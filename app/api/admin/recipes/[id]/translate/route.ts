/**
 * AI 翻译食谱
 *
 * POST /api/admin/recipes/[id]/translate
 * body: { sourceLocale?: string, targetLocales: string[], autoReview?: boolean }
 *
 * 作用：将源语言的食谱（默认中文）翻译成目标语言，写入 RecipeTranslation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 检查管理员权限
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "需要管理员权限" },
      { status: 403 }
    );
  }
  return null;
}

const SUPPORTED_LOCALES = ["zh", "en", "ja", "ko"];
const DEFAULT_LOCALE = "zh";
const LOCALE_NAMES_EN: Record<string, string> = {
  zh: "Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
};

function resolveLocale(value?: string | null): string {
  if (value && SUPPORTED_LOCALES.includes(value)) {
    return value;
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
 * 获取 AI 文本生成 Provider
 * 简化实现，直接调用配置的 AI 服务
 */
async function getTextProvider() {
  const config = await prisma.aIConfig.findUnique({
    where: { id: "default" },
  });

  if (!config?.textApiKey) {
    throw new Error("AI 配置未设置，请先在后台配置 AI 服务");
  }

  return {
    async chat(options: {
      messages: { role: string; content: string }[];
      temperature?: number;
      maxTokens?: number;
    }) {
      const response = await fetch(config.textBaseUrl || "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.textApiKey}`,
        },
        body: JSON.stringify({
          model: config.textModel || "gpt-4-turbo",
          messages: options.messages,
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 6000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI 调用失败: ${error}`);
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || "",
      };
    },
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const sourceLocale = resolveLocale(body.sourceLocale);
    const targetLocales: string[] = Array.isArray(body.targetLocales)
      ? body.targetLocales
      : [];
    const autoReview = Boolean(body.autoReview);

    if (targetLocales.length === 0) {
      return NextResponse.json({ success: false, error: "请选择目标语言" }, { status: 400 });
    }

    // 读取源数据
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!recipe) {
      return NextResponse.json({ success: false, error: "食谱不存在" }, { status: 404 });
    }

    // 如果源语言不是中文，则从翻译表获取
    const sourceTranslation =
      sourceLocale === DEFAULT_LOCALE
        ? null
        : recipe.translations.find((t) => t.locale === sourceLocale);

    const sourceData = {
      title: sourceTranslation?.title || recipe.title,
      description: sourceTranslation?.description || recipe.description,
      difficulty: sourceTranslation?.difficulty || recipe.difficulty,
      summary: (sourceTranslation?.summary as Record<string, unknown>) || (recipe.summary as Record<string, unknown>),
      story: (sourceTranslation?.story as Record<string, unknown>) || (recipe.story as Record<string, unknown>),
      ingredients: (sourceTranslation?.ingredients as unknown[]) || (recipe.ingredients as unknown[]),
      steps: (sourceTranslation?.steps as unknown[]) || (recipe.steps as unknown[]),
    };

    const provider = await getTextProvider();
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const targetLocaleRaw of targetLocales) {
      const targetLocale = resolveLocale(targetLocaleRaw);
      if (targetLocale === sourceLocale) {
        results[targetLocale] = { success: true };
        continue;
      }

      try {
        const targetLangName = LOCALE_NAMES_EN[targetLocale];
        const sourceLangName = LOCALE_NAMES_EN[sourceLocale];
        const prompt = `你是一位专业的翻译。请把以下食谱内容从${sourceLangName}翻译成${targetLangName}，保持结构和数字不变。

返回 JSON，字段必须包含：
{
  "title": "标题",
  "description": "一句话介绍",
  "difficulty": "easy/medium/hard",
  "summary": { "oneLine": "", "healingTone": "", "difficulty": "easy/medium/hard", "timeTotalMin": 45, "timeActiveMin": 20, "servings": 3 },
  "story": { "title": "", "content": "", "tags": ["tag1","tag2"] },
  "ingredients": [ { "section": "", "items": [ { "name": "", "iconKey": "meat", "amount": 500, "unit": "克", "notes": "" } ] } ],
  "steps": [ { "id": "", "title": "", "action": "", "speechText": "", "timerSec": 0, "visualCue": "", "failPoint": "", "photoBrief": "" } ]
}

要求：
1) 仅翻译文本，保持数字/时长/比例/键名不变。
2) 不要删除字段和数组元素。
3) 不要翻译单位和 iconKey。
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

        // 合并回退，避免缺字段
        const summary = mergeFallback(sourceData.summary || {}, translated.summary);
        const story = mergeFallback(sourceData.story || {}, translated.story);
        const ingredients = Array.isArray(translated.ingredients) && translated.ingredients.length > 0
          ? translated.ingredients
          : sourceData.ingredients;
        const steps = Array.isArray(translated.steps) && translated.steps.length > 0
          ? translated.steps
          : sourceData.steps;

        // 生成英文 slug
        const translatedSlug = translated.title
          ? translated.title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, "-")
              .slice(0, 100)
          : `${recipe.slug}-${targetLocale}`;

        await prisma.recipeTranslation.upsert({
          where: { recipeId_locale: { recipeId: id, locale: targetLocale } },
          update: {
            title: translated.title || sourceData.title,
            slug: translatedSlug,
            description: translated.description || sourceData.description,
            difficulty: translated.difficulty || sourceData.difficulty,
            summary: summary as object,
            story: story as object,
            ingredients: ingredients as object[],
            steps: steps as object[],
            isReviewed: autoReview ? true : undefined,
            reviewedAt: autoReview ? new Date() : undefined,
          },
          create: {
            recipeId: id,
            locale: targetLocale,
            title: translated.title || sourceData.title,
            slug: translatedSlug,
            description: translated.description || sourceData.description,
            difficulty: translated.difficulty || sourceData.difficulty,
            summary: summary as object,
            story: story as object,
            ingredients: ingredients as object[],
            steps: steps as object[],
            isReviewed: autoReview,
            reviewedAt: autoReview ? new Date() : null,
          },
        });

        // 更新主表的翻译状态
        const currentTransStatus = (recipe.transStatus as Record<string, string>) || {};
        currentTransStatus[targetLocale] = autoReview ? "completed" : "pending_review";
        await prisma.recipe.update({
          where: { id },
          data: { transStatus: currentTransStatus },
        });

        results[targetLocale] = { success: true };
      } catch (error) {
        console.error(`Failed to translate recipe to ${targetLocale}:`, error);
        results[targetLocale] = {
          success: false,
          error: (error as Error).message,
        };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Translate recipe failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "翻译失败" },
      { status: 500 }
    );
  }
}
