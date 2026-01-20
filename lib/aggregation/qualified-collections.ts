/**
 * 获取达标集合工具函数
 *
 * 用于一级聚合页的卡片来源
 * 达标条件：status=published 且 publishedCount >= minRequired
 */

import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";

export interface QualifiedCollectionCard {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  path: string;
  type: string;
  coverImage: string | null;
  publishedCount: number;
  targetCount: number;
  progress: number;
  sortOrder: number;
}

/**
 * 获取指定类型的达标集合
 * @param type - 集合类型 (cuisine, region, scene, method, taste, crowd, occasion, ingredient, theme)
 * @param locale - 语言环境
 * @param limit - 返回数量限制
 */
export async function getQualifiedCollectionsByType(
  type: string,
  locale: Locale,
  limit = 20
): Promise<QualifiedCollectionCard[]> {
  const locales = getContentLocales(locale);
  const isEn = locale === "en";
  const isTheme = type === "theme";

  const collections = await prisma.collection.findMany({
    where: {
      type: isTheme ? { in: ["theme", "topic"] } : type,
      status: "published",
      // 不检查 isFeatured，因为它是计算结果而不是查询条件
      // 达标条件：cachedPublishedCount >= minRequired
      // 使用 raw SQL 或者在应用层过滤
    },
    orderBy: [{ sortOrder: "asc" }, { cachedPublishedCount: "desc" }],
    take: limit * 2, // 多取一些，因为要在应用层过滤达标的
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });

  // 在应用层过滤达标的集合
  const qualifiedCollections = collections.filter(
    (c) => c.cachedPublishedCount >= c.minRequired
  );

  return qualifiedCollections.slice(0, limit).map((c) => {
    const translation = c.translations.find((t) => t.locale === locale);
    // 防止除零：targetCount 至少为 1
    const safeTargetCount = Math.max(c.targetCount, 1);
    return {
      id: c.id,
      name: isEn ? (translation?.name || c.nameEn || c.name) : c.name,
      nameEn: c.nameEn || undefined,
      slug: c.slug,
      path: c.type === "topic" ? `/recipe/theme/${c.slug}` : c.path,
      type: c.type,
      coverImage: c.coverImage,
      publishedCount: c.cachedPublishedCount,
      targetCount: c.targetCount,
      progress: Math.round((c.cachedPublishedCount / safeTargetCount) * 100),
      sortOrder: c.sortOrder,
    };
  });
}

/**
 * 获取所有类型的达标集合（按类型分组）
 * @param locale - 语言环境
 * @param limits - 每种类型的数量限制
 */
export async function getAllQualifiedCollections(
  locale: Locale,
  limits: Record<string, number> = {}
): Promise<Record<string, QualifiedCollectionCard[]>> {
  const types = [
    "cuisine",
    "region",
    "scene",
    "method",
    "taste",
    "crowd",
    "occasion",
    "ingredient",
    "theme",
  ];

  const results: Record<string, QualifiedCollectionCard[]> = {};

  await Promise.all(
    types.map(async (type) => {
      const limit = limits[type] || 8;
      results[type] = await getQualifiedCollectionsByType(type, locale, limit);
    })
  );

  return results;
}

/**
 * 获取一级聚合页区块配置
 * 从 HomeConfig 表读取区块配置
 */
export interface AggregationBlockConfig {
  type: string; // cuisine, scene, method, etc.
  enabled: boolean;
  order: number;
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  cardCount: number;
  minThreshold: number; // 最小达标数量门槛
  collapsed: boolean; // 默认折叠
}

const DEFAULT_BLOCKS: AggregationBlockConfig[] = [
  {
    type: "cuisine",
    enabled: true,
    order: 1,
    title: "按菜系浏览",
    titleEn: "Browse by Cuisine",
    subtitle: "探索中国各地经典菜系",
    subtitleEn: "Explore classic Chinese cuisines",
    cardCount: 8,
    minThreshold: 0,
    collapsed: false,
  },
  {
    type: "scene",
    enabled: true,
    order: 2,
    title: "按场景浏览",
    titleEn: "Browse by Scene",
    subtitle: "根据做饭场景找食谱",
    subtitleEn: "Find recipes by cooking scene",
    cardCount: 6,
    minThreshold: 0,
    collapsed: false,
  },
  {
    type: "method",
    enabled: true,
    order: 3,
    title: "按烹饪方式浏览",
    titleEn: "Browse by Cooking Method",
    subtitle: "炒、炖、蒸、煮...",
    subtitleEn: "Stir-fry, stew, steam, boil...",
    cardCount: 6,
    minThreshold: 0,
    collapsed: true,
  },
  {
    type: "taste",
    enabled: true,
    order: 4,
    title: "按口味浏览",
    titleEn: "Browse by Taste",
    subtitle: "酸甜苦辣咸",
    subtitleEn: "Sour, sweet, bitter, spicy, salty",
    cardCount: 6,
    minThreshold: 0,
    collapsed: true,
  },
  {
    type: "crowd",
    enabled: true,
    order: 5,
    title: "按人群浏览",
    titleEn: "Browse by Dietary",
    subtitle: "减脂、增肌、儿童...",
    subtitleEn: "Weight loss, muscle gain, kids...",
    cardCount: 6,
    minThreshold: 0,
    collapsed: true,
  },
  {
    type: "ingredient",
    enabled: true,
    order: 6,
    title: "按食材浏览",
    titleEn: "Browse by Ingredient",
    subtitle: "猪肉、鸡肉、豆腐...",
    subtitleEn: "Pork, chicken, tofu...",
    cardCount: 8,
    minThreshold: 0,
    collapsed: false,
  },
  {
    type: "theme",
    enabled: true,
    order: 7,
    title: "专题精选",
    titleEn: "Featured Topics",
    subtitle: "策划主题合集",
    subtitleEn: "Curated theme collections",
    cardCount: 6,
    minThreshold: 0,
    collapsed: false,
  },
];

const CONFIG_SECTION = "aggregation_blocks_config";

/**
 * 获取一级聚合页区块配置
 * 合并数据库配置和默认配置，确保所有区块都有配置
 */
export async function getAggregationBlocksConfig(): Promise<
  AggregationBlockConfig[]
> {
  try {
    const config = await prisma.homeConfig.findFirst({
      where: { section: CONFIG_SECTION },
    });

    if (!config) {
      return DEFAULT_BLOCKS;
    }

    const content = (config.content as Record<string, unknown>) || {};
    const dbBlocks = (content.blocks as AggregationBlockConfig[]) || [];

    // 如果数据库中没有配置，使用默认配置
    if (dbBlocks.length === 0) {
      return DEFAULT_BLOCKS;
    }

    // 合并数据库配置和默认配置
    // 数据库中有的区块使用数据库配置，没有的使用默认配置
    const dbBlockTypes = new Set(dbBlocks.map((b) => b.type));
    const mergedBlocks = [...dbBlocks];

    // 添加数据库中缺失的默认区块
    for (const defaultBlock of DEFAULT_BLOCKS) {
      if (!dbBlockTypes.has(defaultBlock.type)) {
        mergedBlocks.push(defaultBlock);
      }
    }

    // 确保 ingredient 区块启用（临时修复，后续可通过后台配置）
    const ingredientBlock = mergedBlocks.find((b) => b.type === "ingredient");
    if (ingredientBlock && !ingredientBlock.enabled) {
      ingredientBlock.enabled = true;
    }

    return mergedBlocks;
  } catch (error) {
    console.error("获取区块配置失败:", error);
    return DEFAULT_BLOCKS;
  }
}

/**
 * 保存一级聚合页区块配置
 */
export async function saveAggregationBlocksConfig(
  blocks: AggregationBlockConfig[]
): Promise<void> {
  const existing = await prisma.homeConfig.findFirst({
    where: { section: CONFIG_SECTION },
  });

  if (existing) {
    await prisma.homeConfig.update({
      where: { id: existing.id },
      data: { content: { blocks } as object },
    });
  } else {
    await prisma.homeConfig.create({
      data: {
        section: CONFIG_SECTION,
        content: { blocks } as object,
      },
    });
  }
}

/**
 * 获取一级聚合页完整数据（区块配置 + 达标集合）
 * 用于前台渲染
 */
export interface AggregationPageData {
  blocks: Array<
    AggregationBlockConfig & {
      collections: QualifiedCollectionCard[];
    }
  >;
}

export async function getAggregationPageData(
  locale: Locale
): Promise<AggregationPageData> {
  const blocksConfig = await getAggregationBlocksConfig();

  // 只获取启用的区块
  const enabledBlocks = blocksConfig
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);

  // 并行获取每个区块的达标集合
  const blocksWithCollections = await Promise.all(
    enabledBlocks.map(async (block) => {
      const collections = await getQualifiedCollectionsByType(
        block.type,
        locale,
        block.cardCount
      );

      // 过滤掉不满足门槛的集合
      const filteredCollections =
        block.minThreshold > 0
          ? collections.filter((c) => c.publishedCount >= block.minThreshold)
          : collections;

      return {
        ...block,
        collections: filteredCollections,
      };
    })
  );

  // 过滤掉没有集合的区块
  const nonEmptyBlocks = blocksWithCollections.filter(
    (b) => b.collections.length > 0
  );

  return { blocks: nonEmptyBlocks };
}
