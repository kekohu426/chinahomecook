/**
 * AI 翻译服务
 *
 * 统一的翻译服务封装，支持多种实体类型：
 * - recipe: 菜谱
 * - cuisine: 菜系
 * - location: 地域
 * - tag: 标签
 * - collection: 合集
 * - ingredient: 食材
 *
 * 使用 AIConfig 中配置的 AI Provider
 */

import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "./provider";
import { getAppliedPrompt } from "./prompt-manager";

/**
 * 翻译服务支持的语言
 *
 * 注意：这与 lib/i18n/config.ts 中的 SUPPORTED_LOCALES 不同：
 * - lib/i18n/config.ts: 路由支持的语言（前端 URL 实际使用）
 * - 这里: 翻译服务支持的语言（可预生成翻译供未来使用）
 *
 * 翻译服务可以支持更多语言，以便在扩展前端路由时已有翻译数据
 */
export const TRANSLATION_LOCALES = ["zh", "en", "ja", "ko"] as const;
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

// 向后兼容的别名
export const SUPPORTED_LOCALES = TRANSLATION_LOCALES;
export type SupportedLocale = TranslationLocale;

// 默认语言（源语言）
const DEFAULT_LOCALE: SupportedLocale = "zh";

// 语言名称映射（用于提示词）
const LOCALE_NAMES: Record<SupportedLocale, { zh: string; en: string }> = {
  zh: { zh: "中文", en: "Chinese" },
  en: { zh: "英文", en: "English" },
  ja: { zh: "日文", en: "Japanese" },
  ko: { zh: "韩文", en: "Korean" },
};

// 翻译结果
export interface TranslationResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  qualityScore?: number;
}

/**
 * 解析 JSON 响应
 */
function parseJsonResponse(content: string): Record<string, unknown> | null {
  // 尝试匹配 JSON 块
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // 尝试修复常见的 JSON 错误
    let fixed = jsonMatch[0]
      .replace(/,\s*}/g, "}") // 移除尾逗号
      .replace(/,\s*]/g, "]"); // 移除数组尾逗号

    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(text: string, locale: string): string {
  if (locale === "en") {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 100);
  }
  // 其他语言使用拼音或保持原样
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

/**
 * 翻译菜谱
 */
export async function translateRecipe(
  recipeId: string,
  targetLocale: SupportedLocale,
  options?: { autoReview?: boolean }
): Promise<TranslationResult> {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return { success: false, error: "菜谱不存在" };
    }

    const sourceData = {
      title: recipe.title,
      description: recipe.description,
      difficulty: recipe.difficulty,
      summary: recipe.summary,
      story: recipe.story,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    };

    const targetLangName = LOCALE_NAMES[targetLocale].en;
    const sourceLangName = LOCALE_NAMES[DEFAULT_LOCALE].en;
    const applied = await getAppliedPrompt("translate_recipe", {
      sourceLangName,
      targetLangName,
      sourceData: JSON.stringify(sourceData, null, 2),
    });
    if (!applied?.prompt) {
      return { success: false, error: "未找到可用的提示词配置" };
    }

    const provider = getTextProvider();
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

    const translated = parseJsonResponse(response.content);
    if (!translated) {
      return { success: false, error: "AI 返回内容解析失败" };
    }

    // 生成 slug
    const translatedSlug = translated.title
      ? generateSlug(String(translated.title), targetLocale)
      : `${recipe.slug}-${targetLocale}`;

    // 保存翻译（使用 undefined 替代 null 以兼容 Prisma JSON 类型）
    const translationData = {
      title: String(translated.title || sourceData.title),
      slug: translatedSlug,
      description: (translated.description as string) || undefined,
      difficulty: (translated.difficulty as string) || undefined,
      summary: translated.summary ? (translated.summary as object) : undefined,
      story: translated.story ? (translated.story as object) : undefined,
      ingredients: translated.ingredients ? (translated.ingredients as object[]) : undefined,
      steps: translated.steps ? (translated.steps as object[]) : undefined,
      transMethod: "ai",
      isReviewed: options?.autoReview ?? false,
      reviewedAt: options?.autoReview ? new Date() : null,
    };

    await prisma.recipeTranslation.upsert({
      where: { recipeId_locale: { recipeId, locale: targetLocale } },
      update: translationData,
      create: {
        recipeId,
        locale: targetLocale,
        ...translationData,
      },
    });

    // 更新主表翻译状态
    const currentTransStatus = (recipe.transStatus as Record<string, string>) || {};
    currentTransStatus[targetLocale] = options?.autoReview ? "completed" : "pending_review";
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { transStatus: currentTransStatus },
    });

    return {
      success: true,
      data: translated,
      qualityScore: 0.85, // 默认质量分数，后续可实现更精细的评分
    };
  } catch (error) {
    console.error(`翻译菜谱 ${recipeId} 失败:`, error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 翻译菜系
 */
export async function translateCuisine(
  cuisineId: string,
  targetLocale: SupportedLocale
): Promise<TranslationResult> {
  try {
    const cuisine = await prisma.cuisine.findUnique({
      where: { id: cuisineId },
    });

    if (!cuisine) {
      return { success: false, error: "菜系不存在" };
    }

    const targetLangName = LOCALE_NAMES[targetLocale].en;
    const applied = await getAppliedPrompt("translate_cuisine", {
      targetLangName,
      name: cuisine.name,
      description: cuisine.description || "",
    });
    if (!applied?.prompt) {
      return { success: false, error: "未找到可用的提示词配置" };
    }

    const provider = getTextProvider();
    const response = await provider.chat({
      messages: [
        ...(applied.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    const translated = parseJsonResponse(response.content);
    if (!translated) {
      return { success: false, error: "AI 返回内容解析失败" };
    }

    const translatedSlug = generateSlug(String(translated.name || cuisine.name), targetLocale);

    await prisma.cuisineTranslation.upsert({
      where: { cuisineId_locale: { cuisineId, locale: targetLocale } },
      update: {
        name: String(translated.name || cuisine.name),
        slug: translatedSlug,
        description: translated.description as string | null,
      },
      create: {
        cuisineId,
        locale: targetLocale,
        name: String(translated.name || cuisine.name),
        slug: translatedSlug,
        description: translated.description as string | null,
      },
    });

    // 更新翻译状态
    const currentTransStatus = (cuisine.transStatus as Record<string, string>) || {};
    currentTransStatus[targetLocale] = "completed";
    await prisma.cuisine.update({
      where: { id: cuisineId },
      data: { transStatus: currentTransStatus },
    });

    return { success: true, data: translated, qualityScore: 0.9 };
  } catch (error) {
    console.error(`翻译菜系 ${cuisineId} 失败:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 翻译地域
 */
export async function translateLocation(
  locationId: string,
  targetLocale: SupportedLocale
): Promise<TranslationResult> {
  try {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return { success: false, error: "地域不存在" };
    }

    const targetLangName = LOCALE_NAMES[targetLocale].en;
    const applied = await getAppliedPrompt("translate_location", {
      targetLangName,
      name: location.name,
      description: location.description || "",
    });
    if (!applied?.prompt) {
      return { success: false, error: "未找到可用的提示词配置" };
    }

    const provider = getTextProvider();
    const response = await provider.chat({
      messages: [
        ...(applied.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    const translated = parseJsonResponse(response.content);
    if (!translated) {
      return { success: false, error: "AI 返回内容解析失败" };
    }

    const translatedSlug = generateSlug(String(translated.name || location.name), targetLocale);

    await prisma.locationTranslation.upsert({
      where: { locationId_locale: { locationId, locale: targetLocale } },
      update: {
        name: String(translated.name || location.name),
        slug: translatedSlug,
        description: translated.description as string | null,
      },
      create: {
        locationId,
        locale: targetLocale,
        name: String(translated.name || location.name),
        slug: translatedSlug,
        description: translated.description as string | null,
      },
    });

    // 更新翻译状态
    const currentTransStatus = (location.transStatus as Record<string, string>) || {};
    currentTransStatus[targetLocale] = "completed";
    await prisma.location.update({
      where: { id: locationId },
      data: { transStatus: currentTransStatus },
    });

    return { success: true, data: translated, qualityScore: 0.9 };
  } catch (error) {
    console.error(`翻译地域 ${locationId} 失败:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 翻译标签
 */
export async function translateTag(
  tagId: string,
  targetLocale: SupportedLocale
): Promise<TranslationResult> {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return { success: false, error: "标签不存在" };
    }

    const targetLangName = LOCALE_NAMES[targetLocale].en;
    const applied = await getAppliedPrompt("translate_tag", {
      targetLangName,
      type: tag.type,
      name: tag.name,
    });
    if (!applied?.prompt) {
      return { success: false, error: "未找到可用的提示词配置" };
    }

    const provider = getTextProvider();
    const response = await provider.chat({
      messages: [
        ...(applied.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.3,
      maxTokens: 200,
    });

    const translated = parseJsonResponse(response.content);
    if (!translated) {
      return { success: false, error: "AI 返回内容解析失败" };
    }

    const translatedSlug = generateSlug(String(translated.name || tag.name), targetLocale);

    await prisma.tagTranslation.upsert({
      where: { tagId_locale: { tagId, locale: targetLocale } },
      update: {
        name: String(translated.name || tag.name),
        slug: translatedSlug,
      },
      create: {
        tagId,
        locale: targetLocale,
        name: String(translated.name || tag.name),
        slug: translatedSlug,
      },
    });

    // 更新翻译状态
    const currentTransStatus = (tag.transStatus as Record<string, string>) || {};
    currentTransStatus[targetLocale] = "completed";
    await prisma.tag.update({
      where: { id: tagId },
      data: { transStatus: currentTransStatus },
    });

    return { success: true, data: translated, qualityScore: 0.95 };
  } catch (error) {
    console.error(`翻译标签 ${tagId} 失败:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 翻译合集
 */
export async function translateCollection(
  collectionId: string,
  targetLocale: SupportedLocale
): Promise<TranslationResult> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return { success: false, error: "合集不存在" };
    }

    const targetLangName = LOCALE_NAMES[targetLocale].en;
    const applied = await getAppliedPrompt("translate_collection", {
      targetLangName,
      name: collection.name,
      description: collection.description || "",
      seo: JSON.stringify(collection.seo || {}),
    });
    if (!applied?.prompt) {
      return { success: false, error: "未找到可用的提示词配置" };
    }

    const provider = getTextProvider();
    const response = await provider.chat({
      messages: [
        ...(applied.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.3,
      maxTokens: 800,
    });

    const translated = parseJsonResponse(response.content);
    if (!translated) {
      return { success: false, error: "AI 返回内容解析失败" };
    }

    const translatedSlug = generateSlug(String(translated.name || collection.name), targetLocale);

    const collectionTransData = {
      name: String(translated.name || collection.name),
      slug: translatedSlug,
      description: (translated.description as string) || undefined,
      seo: translated.seo ? (translated.seo as object) : undefined,
    };

    await prisma.collectionTranslation.upsert({
      where: { collectionId_locale: { collectionId, locale: targetLocale } },
      update: collectionTransData,
      create: {
        collectionId,
        locale: targetLocale,
        ...collectionTransData,
      },
    });

    // 更新翻译状态
    const currentTransStatus = (collection.transStatus as Record<string, string>) || {};
    currentTransStatus[targetLocale] = "completed";
    await prisma.collection.update({
      where: { id: collectionId },
      data: { transStatus: currentTransStatus },
    });

    return { success: true, data: translated, qualityScore: 0.9 };
  } catch (error) {
    console.error(`翻译合集 ${collectionId} 失败:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 翻译食材
 */
export async function translateIngredient(
  ingredientId: string,
  targetLocale: SupportedLocale
): Promise<TranslationResult> {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return { success: false, error: "食材不存在" };
    }

    const targetLangName = LOCALE_NAMES[targetLocale].en;
    const applied = await getAppliedPrompt("translate_ingredient", {
      targetLangName,
      name: ingredient.name,
      unit: ingredient.unit || "",
    });
    if (!applied?.prompt) {
      return { success: false, error: "未找到可用的提示词配置" };
    }

    const provider = getTextProvider();
    const response = await provider.chat({
      messages: [
        ...(applied.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied.prompt },
      ],
      temperature: 0.3,
      maxTokens: 200,
    });

    const translated = parseJsonResponse(response.content);
    if (!translated) {
      return { success: false, error: "AI 返回内容解析失败" };
    }

    await prisma.ingredientTranslation.upsert({
      where: { ingredientId_locale: { ingredientId, locale: targetLocale } },
      update: {
        name: String(translated.name || ingredient.name),
        unit: translated.unit as string | null,
      },
      create: {
        ingredientId,
        locale: targetLocale,
        name: String(translated.name || ingredient.name),
        unit: translated.unit as string | null,
      },
    });

    // 更新翻译状态
    const currentTransStatus = (ingredient.transStatus as Record<string, string>) || {};
    currentTransStatus[targetLocale] = "completed";
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { transStatus: currentTransStatus },
    });

    return { success: true, data: translated, qualityScore: 0.95 };
  } catch (error) {
    console.error(`翻译食材 ${ingredientId} 失败:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 根据实体类型翻译
 */
export async function translateEntity(
  entityType: string,
  entityId: string,
  targetLocale: SupportedLocale,
  options?: { autoReview?: boolean }
): Promise<TranslationResult> {
  switch (entityType) {
    case "recipe":
      return translateRecipe(entityId, targetLocale, options);
    case "cuisine":
      return translateCuisine(entityId, targetLocale);
    case "location":
      return translateLocation(entityId, targetLocale);
    case "tag":
      return translateTag(entityId, targetLocale);
    case "collection":
      return translateCollection(entityId, targetLocale);
    case "ingredient":
      return translateIngredient(entityId, targetLocale);
    default:
      return { success: false, error: `不支持的实体类型: ${entityType}` };
  }
}
