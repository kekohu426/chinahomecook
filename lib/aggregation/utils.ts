/**
 * 聚合页数据工具函数
 *
 * 统一从数据库获取标签及其食谱计数
 * 用于首页和一级聚合页的"按 XX 浏览"模块
 *
 * 注意：部分模型（Scene, CookingMethod, Taste, Crowd, Occasion）在新 Schema 中不存在
 * 这些功能现在通过 Tag 模型实现，type 字段区分类型
 */

import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";

interface TagItem {
  id: string;
  name: string;
  description?: string; // Optional - Tag model doesn't have description
  slug: string;
  count: number;
  coverImage?: string | null;
}

/**
 * 获取菜系列表及其食谱计数
 * @param locale - 语言环境
 * @param minCount - 最小食谱数（默认 10）
 */
export async function getCuisinesWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  const [cuisines, counts] = await Promise.all([
    prisma.cuisine.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    }),
    prisma.recipe.groupBy({
      by: ["cuisineId"],
      where: { status: "published", cuisineId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((row) => {
    if (row.cuisineId) {
      countMap.set(row.cuisineId, row._count._all);
    }
  });

  // 获取每个菜系的封面图（最热门食谱的封面）
  const coverImages = await Promise.all(
    cuisines.map(async (cuisine) => {
      const topRecipe = await prisma.recipe.findFirst({
        where: { status: "published", cuisineId: cuisine.id },
        orderBy: { viewCount: "desc" },
        select: { coverImage: true },
      });
      return { id: cuisine.id, coverImage: topRecipe?.coverImage };
    })
  );
  const coverMap = new Map(coverImages.map((c) => [c.id, c.coverImage]));

  return cuisines
    .map((cuisine) => {
      const translation = cuisine.translations.find((t) => t.locale === locale);
      const count = countMap.get(cuisine.id) ?? 0;
      return {
        id: cuisine.id,
        name: translation?.name || cuisine.name,
        description: translation?.description || cuisine.description || "",
        slug: cuisine.slug,
        count,
        coverImage: coverMap.get(cuisine.id) || null,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取场景列表及其食谱计数
 * 场景现在通过 Tag 模型实现，type = "scene"
 * @param locale - 语言环境
 * @param minCount - 最小食谱数（默认 10）
 */
export async function getScenesWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  // 场景现在是 Tag 模型的一种类型
  const scenes = await prisma.tag.findMany({
    where: { type: "scene", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: { in: locales } } },
      recipes: { where: { recipe: { status: "published" } } },
    },
  });

  return scenes
    .map((scene) => {
      const translation = scene.translations.find((t) => t.locale === locale);
      const count = scene.recipes.length;
      return {
        id: scene.id,
        name: translation?.name || scene.name,
        slug: scene.slug,
        count,
        coverImage: scene.icon || null,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取烹饪方式列表及其食谱计数
 * 烹饪方式现在通过 Tag 模型实现，type = "method"
 */
export async function getMethodsWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  const methods = await prisma.tag.findMany({
    where: { type: "method", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: { in: locales } } },
      recipes: { where: { recipe: { status: "published" } } },
    },
  });

  return methods
    .map((method) => {
      const translation = method.translations.find((t) => t.locale === locale);
      return {
        id: method.id,
        name: translation?.name || method.name,
        slug: method.slug,
        count: method.recipes.length,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取口味列表及其食谱计数
 * 口味现在通过 Tag 模型实现，type = "taste"
 */
export async function getTastesWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  const tastes = await prisma.tag.findMany({
    where: { type: "taste", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: { in: locales } } },
      recipes: { where: { recipe: { status: "published" } } },
    },
  });

  return tastes
    .map((taste) => {
      const translation = taste.translations.find((t) => t.locale === locale);
      return {
        id: taste.id,
        name: translation?.name || taste.name,
        slug: taste.slug,
        count: taste.recipes.length,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取人群列表及其食谱计数
 * 人群现在通过 Tag 模型实现，type = "crowd"
 */
export async function getCrowdsWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  const crowds = await prisma.tag.findMany({
    where: { type: "crowd", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: { in: locales } } },
      recipes: { where: { recipe: { status: "published" } } },
    },
  });

  return crowds
    .map((crowd) => {
      const translation = crowd.translations.find((t) => t.locale === locale);
      return {
        id: crowd.id,
        name: translation?.name || crowd.name,
        slug: crowd.slug,
        count: crowd.recipes.length,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取场合列表及其食谱计数
 * 场合现在通过 Tag 模型实现，type = "occasion"
 */
export async function getOccasionsWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  const occasions = await prisma.tag.findMany({
    where: { type: "occasion", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: { in: locales } } },
      recipes: { where: { recipe: { status: "published" } } },
    },
  });

  return occasions
    .map((occasion) => {
      const translation = occasion.translations.find((t) => t.locale === locale);
      return {
        id: occasion.id,
        name: translation?.name || occasion.name,
        slug: occasion.slug,
        count: occasion.recipes.length,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取地点列表及其食谱计数
 */
export async function getLocationsWithCount(
  locale: Locale,
  minCount = 10
): Promise<TagItem[]> {
  const locales = getContentLocales(locale);

  const [locations, counts] = await Promise.all([
    prisma.location.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    }),
    prisma.recipe.groupBy({
      by: ["locationId"],
      where: { status: "published", locationId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((row) => {
    if (row.locationId) {
      countMap.set(row.locationId, row._count._all);
    }
  });

  return locations
    .map((location) => {
      const translation = location.translations.find((t) => t.locale === locale);
      const count = countMap.get(location.id) ?? 0;
      return {
        id: location.id,
        name: translation?.name || location.name,
        description: translation?.description || location.description || "",
        slug: location.slug,
        count,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取热门食材及其食谱计数
 * 从 ingredients JSON 字段提取食材名称
 * @param limit - 返回数量限制
 * @param minCount - 最小食谱数
 */
export async function getPopularIngredientsWithCount(
  limit = 12,
  minCount = 10
): Promise<{ name: string; count: number }[]> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "published" },
    select: { ingredients: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const counts = new Map<string, number>();
  for (const recipe of recipes) {
    // 从 ingredients JSON 提取食材名称
    // 格式: [{ section: "主料", items: [{ name: "猪肉", ... }] }]
    const ingredientData = recipe.ingredients as any;
    if (!ingredientData || !Array.isArray(ingredientData)) continue;

    for (const section of ingredientData) {
      if (!section.items || !Array.isArray(section.items)) continue;
      for (const item of section.items) {
        if (!item.name) continue;
        counts.set(item.name, (counts.get(item.name) || 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * 获取场景列表用于首页快捷浏览
 * 返回带有 tag 字段的格式，兼容旧的匹配逻辑
 */
export interface HomeSceneItem {
  id: string;
  name: string;
  slug: string;
  tag: string; // 用于匹配
  count: number;
}

export async function getScenesForHome(
  locale: Locale,
  minCount = 0
): Promise<HomeSceneItem[]> {
  const locales = getContentLocales(locale);

  const scenes = await prisma.tag.findMany({
    where: { type: "scene", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: { in: locales } } },
      recipes: { where: { recipe: { status: "published" } } },
    },
  });

  return scenes
    .map((scene) => {
      const translation = scene.translations.find((t) => t.locale === locale);
      return {
        id: scene.id,
        name: translation?.name || scene.name,
        slug: scene.slug,
        tag: scene.slug, // tag 等于 slug，用于兼容
        count: scene.recipes.length,
      };
    })
    .filter((item) => item.count >= minCount);
}

/**
 * 获取场景食谱计数（用于首页统计）
 * 返回 slug -> count 的映射
 */
export async function getSceneCountsFromDB(): Promise<Record<string, number>> {
  const scenes = await prisma.tag.findMany({
    where: { type: "scene", isActive: true },
    select: { slug: true },
  });

  const counts = await Promise.all(
    scenes.map(async (scene) => {
      const count = await prisma.recipeTag.count({
        where: {
          tag: { slug: scene.slug },
          recipe: { status: "published" },
        },
      });
      return { slug: scene.slug, count };
    })
  );

  return Object.fromEntries(counts.map((c) => [c.slug, c.count]));
}
