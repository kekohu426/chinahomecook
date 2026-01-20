/**
 * 批量操作 API
 *
 * POST /api/admin/recipes/batch
 *
 * 支持操作：
 * - publish: 批量发布（需已审核）
 * - unpublish: 批量下架
 * - approve: 批量审核通过
 * - reject: 批量审核拒绝
 * - translate: 批量翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai/provider";
import { requireAdmin } from "@/lib/auth/guard";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES_EN,
  type Locale,
} from "@/lib/i18n/config";

type BatchAction = "publish" | "unpublish" | "approve" | "reject" | "translate";

interface BatchRequest {
  action: BatchAction;
  recipeIds: string[];
  // 翻译专用参数
  targetLocales?: string[];
  autoApprove?: boolean;
  // 拒绝专用参数
  rejectReason?: string;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body: BatchRequest = await request.json();
    const { action, recipeIds, targetLocales, autoApprove, rejectReason } = body;

    if (!recipeIds || recipeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "请选择至少一个食谱" },
        { status: 400 }
      );
    }

    let result: { success: boolean; message: string; data?: unknown };

    switch (action) {
      case "publish":
        result = await handleBatchPublish(recipeIds, true);
        break;
      case "unpublish":
        result = await handleBatchPublish(recipeIds, false);
        break;
      case "approve":
        result = await handleBatchApprove(recipeIds, true);
        break;
      case "reject":
        result = await handleBatchApprove(recipeIds, false, rejectReason);
        break;
      case "translate":
        if (!targetLocales || targetLocales.length === 0) {
          return NextResponse.json(
            { success: false, error: "请选择至少一个目标语言" },
            { status: 400 }
          );
        }
        result = await handleBatchTranslate(recipeIds, targetLocales, autoApprove ?? false);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("批量操作失败:", error);
    return NextResponse.json(
      { success: false, error: "批量操作失败" },
      { status: 500 }
    );
  }
}

/**
 * 批量发布/下架
 */
async function handleBatchPublish(recipeIds: string[], publish: boolean) {
  const updated = await prisma.recipe.updateMany({
    where: { id: { in: recipeIds } },
    data: {
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : null,
      reviewStatus: publish ? "approved" : undefined,
      reviewedAt: publish ? new Date() : undefined,
    },
  });

  return {
    success: true,
    message: `已${publish ? "发布" : "下架"} ${updated.count} 个食谱`,
    data: { count: updated.count },
  };
}

/**
 * 批量审核
 */
async function handleBatchApprove(recipeIds: string[], approve: boolean, rejectReason?: string) {
  const updated = await prisma.recipe.updateMany({
    where: { id: { in: recipeIds } },
    data: {
      reviewStatus: approve ? "approved" : "rejected",
      reviewedAt: new Date(),
      status: approve ? "published" : "draft",
      publishedAt: approve ? new Date() : null,
    },
  });

  return {
    success: true,
    message: `已${approve ? "审核通过" : "拒绝"} ${updated.count} 个食谱`,
    data: { count: updated.count },
  };
}

// 翻译辅助函数
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

function mergeFallback<T extends Record<string, unknown>>(source: T, translated?: Partial<T> | null): T {
  if (!translated || typeof translated !== "object") return source;
  return { ...source, ...translated } as T;
}

/**
 * 翻译单个食谱
 */
async function translateSingleRecipe(
  recipeId: string,
  targetLocales: string[],
  autoApprove: boolean
): Promise<{ success: boolean; title: string; error?: string }> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { translations: true },
  });

  if (!recipe) {
    return { success: false, title: recipeId, error: "食谱不存在" };
  }

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
      const ingredients = Array.isArray(translated.ingredients) && translated.ingredients.length > 0
        ? translated.ingredients
        : sourceData.ingredients;
      const steps = Array.isArray(translated.steps) && translated.steps.length > 0
        ? translated.steps
        : sourceData.steps;
      const styleGuide = mergeFallback(sourceData.styleGuide, translated.styleGuide);
      const imageShots = Array.isArray(translated.imageShots) && translated.imageShots.length > 0
        ? translated.imageShots
        : sourceData.imageShots;

      await prisma.recipeTranslation.upsert({
        where: { recipeId_locale: { recipeId, locale: targetLocale } },
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
          recipeId,
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
    title: recipe.title,
    error: hasError ? lastError : undefined,
  };
}

/**
 * 批量翻译
 */
async function handleBatchTranslate(
  recipeIds: string[],
  targetLocales: string[],
  autoApprove: boolean
) {
  const results: { recipeId: string; title: string; status: string; error?: string }[] = [];

  for (const recipeId of recipeIds) {
    const result = await translateSingleRecipe(recipeId, targetLocales, autoApprove);
    results.push({
      recipeId,
      title: result.title,
      status: result.success ? "success" : "failed",
      error: result.error,
    });
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return {
    success: true,
    message: `翻译完成：成功 ${successCount} 个，失败 ${failedCount} 个`,
    data: { results, successCount, failedCount },
  };
}
