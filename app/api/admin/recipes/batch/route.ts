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
  // 如果是发布，检查是否都已审核
  if (publish) {
    const recipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, title: true, reviewStatus: true },
    });

    const unapproved = recipes.filter((r) => r.reviewStatus !== "approved");
    if (unapproved.length > 0) {
      return {
        success: false,
        message: `以下食谱未审核，无法发布：${unapproved.map((r) => r.title).join("、")}`,
      };
    }
  }

  const updated = await prisma.recipe.updateMany({
    where: { id: { in: recipeIds } },
    data: {
      status: publish ? "published" : "draft",
      publishedAt: publish ? new Date() : null,
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
      const prompt = `你是一位专业的翻译。请把以下食谱内容从${sourceLangName}翻译成${targetLangName}，保持结构和数字不变。

返回 JSON，字段必须包含：
{
  "title": "标题",
  "summary": { "oneLine": "", "healingTone": "", "difficulty": "easy/medium/hard", "timeTotalMin": 45, "timeActiveMin": 20, "servings": 3 },
  "story": { "title": "", "content": "", "tags": ["tag1","tag2"] },
  "ingredients": [ { "section": "", "items": [ { "name": "", "iconKey": "meat", "amount": 500, "unit": "克", "notes": "" } ] } ],
  "steps": [ { "id": "", "title": "", "action": "", "speechText": "", "timerSec": 0, "visualCue": "", "failPoint": "", "photoBrief": "" } ],
  "styleGuide": { "theme": "", "lighting": "", "composition": "", "aesthetic": "" },
  "imageShots": [ { "key": "", "imagePrompt": "", "ratio": "4:3", "imageUrl": "" } ]
}

要求：
1) 仅翻译文本，保持数字/时长/比例/键名不变。
2) 不要删除字段和数组元素。
3) 不要翻译单位和 iconKey；imagePrompt 可按语义翻译。
4) 只返回 JSON，不要额外说明。

源内容：
${JSON.stringify(sourceData, null, 2)}`;

      const response = await provider.chat({
        messages: [
          {
            role: "system",
            content: "你是严格的 JSON 翻译器，只返回有效 JSON，禁止输出多余文本。",
          },
          { role: "user", content: prompt },
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
