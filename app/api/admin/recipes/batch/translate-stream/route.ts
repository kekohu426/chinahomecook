/**
 * 流式批量翻译 API
 *
 * POST /api/admin/recipes/batch/translate-stream
 *
 * 使用 Server-Sent Events 返回实时进度
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai/provider";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES_EN,
  type Locale,
} from "@/lib/i18n/config";

interface TranslateRequest {
  recipeIds: string[];
  targetLocales: string[];
  autoApprove?: boolean;
}

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

function parseJson(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function mergeFallback<T extends Record<string, unknown>>(
  source: T,
  translated?: Partial<T> | null
): T {
  if (!translated || typeof translated !== "object") return source;
  return { ...source, ...translated } as T;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body: TranslateRequest = await request.json();
    const { recipeIds, targetLocales, autoApprove = false } = body;

    if (!recipeIds || recipeIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "请选择至少一个食谱" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!targetLocales || targetLocales.length === 0) {
      return new Response(
        JSON.stringify({ error: "请选择至少一个目标语言" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 创建 SSE 流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let successCount = 0;
        let failedCount = 0;
        const total = recipeIds.length;

        sendEvent({
          type: "start",
          total,
          targetLocales,
        });

        for (let i = 0; i < recipeIds.length; i++) {
          const recipeId = recipeIds[i];

          try {
            // 获取食谱
            const recipe = await prisma.recipe.findUnique({
              where: { id: recipeId },
              include: { translations: true },
            });

            if (!recipe) {
              failedCount++;
              sendEvent({
                type: "progress",
                current: i + 1,
                total,
                recipeId,
                title: recipeId,
                status: "failed",
                error: "食谱不存在",
                successCount,
                failedCount,
              });
              continue;
            }

            sendEvent({
              type: "translating",
              current: i + 1,
              total,
              recipeId,
              title: recipe.title,
            });

            // 翻译食谱
            const result = await translateRecipe(
              recipe,
              targetLocales,
              autoApprove
            );

            if (result.success) {
              successCount++;
            } else {
              failedCount++;
            }

            sendEvent({
              type: "progress",
              current: i + 1,
              total,
              recipeId,
              title: recipe.title,
              status: result.success ? "success" : "failed",
              error: result.error,
              successCount,
              failedCount,
            });
          } catch (error) {
            failedCount++;
            sendEvent({
              type: "progress",
              current: i + 1,
              total,
              recipeId,
              title: recipeId,
              status: "failed",
              error: (error as Error).message,
              successCount,
              failedCount,
            });
          }
        }

        sendEvent({
          type: "complete",
          total,
          successCount,
          failedCount,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("批量翻译失败:", error);
    return new Response(
      JSON.stringify({ error: "批量翻译失败" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function translateRecipe(
  recipe: {
    id: string;
    title: string;
    summary: unknown;
    story: unknown;
    ingredients: unknown;
    steps: unknown;
    styleGuide: unknown;
    imageShots: unknown;
  },
  targetLocales: string[],
  autoApprove: boolean
): Promise<{ success: boolean; error?: string }> {
  const sourceLocale = DEFAULT_LOCALE;
  const sourceData = {
    title: recipe.title,
    summary: recipe.summary as Record<string, unknown>,
    story: recipe.story as Record<string, unknown>,
    ingredients: recipe.ingredients as unknown[],
    steps: recipe.steps as unknown[],
    styleGuide: recipe.styleGuide as Record<string, unknown>,
    imageShots: recipe.imageShots as unknown[],
  };

  const provider = await getTextProvider();
  let hasError = false;
  let lastError = "";

  for (const targetLocaleRaw of targetLocales) {
    const targetLocale = resolveLocale(targetLocaleRaw);
    if (targetLocale === sourceLocale) continue;

    try {
      const targetLangName = LOCALE_NAMES_EN[targetLocale];
      const sourceLangName = LOCALE_NAMES_EN[sourceLocale];
      const applied = await getAppliedPrompt("translate_recipe_full", {
        sourceLangName,
        targetLangName,
        sourceData: JSON.stringify(sourceData, null, 2),
      });
      if (!applied?.prompt) {
        throw new Error("未找到可用的提示词配置");
      }

      const response = await provider.chat({
        messages: [
          ...(applied.systemPrompt
            ? [{ role: "system" as const, content: applied.systemPrompt }]
            : []),
          { role: "user" as const, content: applied.prompt },
        ],
        temperature: 0.3,
        maxTokens: 6000,
      });

      const translated = parseJson(response.content || "");
      if (!translated) {
        throw new Error("AI 返回内容解析失败");
      }

      // 合并回退
      const summary = mergeFallback(sourceData.summary, translated.summary);
      const story = mergeFallback(sourceData.story, translated.story);
      const ingredients =
        Array.isArray(translated.ingredients) && translated.ingredients.length > 0
          ? translated.ingredients
          : sourceData.ingredients;
      const steps =
        Array.isArray(translated.steps) && translated.steps.length > 0
          ? translated.steps
          : sourceData.steps;
      const styleGuide = mergeFallback(sourceData.styleGuide, translated.styleGuide);
      const imageShots =
        Array.isArray(translated.imageShots) && translated.imageShots.length > 0
          ? translated.imageShots
          : sourceData.imageShots;

      await prisma.recipeTranslation.upsert({
        where: { recipeId_locale: { recipeId: recipe.id, locale: targetLocale } },
        update: {
          title: translated.title || sourceData.title,
          slug: translated.title || sourceData.title,
          summary: summary as object,
          story: story as object,
          ingredients: ingredients as object[],
          steps: steps as object[],
          isReviewed: autoApprove ? true : undefined,
          reviewedAt: autoApprove ? new Date() : undefined,
        },
        create: {
          recipeId: recipe.id,
          locale: targetLocale,
          title: translated.title || sourceData.title,
          slug: translated.title || sourceData.title,
          summary: summary as object,
          story: story as object,
          ingredients: ingredients as object[],
          steps: steps as object[],
          isReviewed: autoApprove,
          reviewedAt: autoApprove ? new Date() : null,
        },
      });
    } catch (error) {
      console.error(`翻译食谱 ${recipe.title} 到 ${targetLocaleRaw} 失败:`, error);
      hasError = true;
      lastError = (error as Error).message;
    }
  }

  return {
    success: !hasError,
    error: hasError ? lastError : undefined,
  };
}
