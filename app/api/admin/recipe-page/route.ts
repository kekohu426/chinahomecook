/**
 * 一级聚合页 /recipe 配置 API
 *
 * GET  /api/admin/recipe-page - 获取一级聚合页配置
 * PUT  /api/admin/recipe-page - 更新一级聚合页配置
 *
 * 配置内容：
 * 1. 页面 SEO（H1、副标题、底部文案）
 * 2. 区块配置（启用/排序/折叠/标题）
 * 3. 置顶食谱
 * 4. 默认排序
 *
 * 区块类型：
 * - cuisine: 按菜系浏览
 * - scene: 按场景浏览
 * - ingredient: 按食材浏览
 * - latest: 最新食谱列表
 * - popular: 热门食谱列表
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// 区块类型
type BlockType = "cuisine" | "scene" | "ingredient" | "method" | "taste" | "latest" | "popular";

// 区块配置
interface BlockConfig {
  type: BlockType;
  enabled: boolean;
  order: number;
  collapsed: boolean;  // 是否默认折叠
  title?: string;      // 自定义标题
  subtitle?: string;   // 自定义副标题
  maxItems?: number;   // 最大显示数量
}

// 页面配置
interface RecipePageConfig {
  // SEO
  h1: string;
  subtitle: string;
  footerText: string;

  // 排序
  defaultSort: "latest" | "popular";

  // 置顶
  pinnedRecipeIds: string[];

  // 区块配置
  blocks: BlockConfig[];
}

// 默认配置
const DEFAULT_CONFIG: RecipePageConfig = {
  h1: "中国美食食谱大全",
  subtitle: "系统整理中国各地家常菜做法，按菜系/场景快速找到适合做的菜。",
  footerText: "Recipe Zen 收录了中国各地经典家常菜做法，涵盖川菜、粤菜、湘菜等主要菜系。无论是新手还是进阶用户，都可以在这里找到适合自己的中式菜谱灵感。",
  defaultSort: "latest",
  pinnedRecipeIds: [],
  blocks: [
    { type: "cuisine", enabled: true, order: 1, collapsed: false, title: "按菜系浏览", subtitle: "探索中国不同地区的经典菜系" },
    { type: "scene", enabled: true, order: 2, collapsed: false, title: "按做饭场景", subtitle: "根据场景快速找到灵感" },
    { type: "ingredient", enabled: false, order: 3, collapsed: true, title: "按常见食材", subtitle: "用手边的食材做美食" },
    { type: "method", enabled: false, order: 4, collapsed: true, title: "按烹饪方法", subtitle: "炒、炖、蒸、煮..." },
    { type: "taste", enabled: false, order: 5, collapsed: true, title: "按口味", subtitle: "酸甜苦辣咸" },
    { type: "latest", enabled: true, order: 6, collapsed: false, title: "最新食谱", maxItems: 12 },
    { type: "popular", enabled: false, order: 7, collapsed: false, title: "热门食谱", maxItems: 12 },
  ],
};

const CONFIG_SECTION = "recipe_page_config";

/**
 * GET /api/admin/recipe-page
 * 获取一级聚合页配置
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    // 从 HomeConfig 获取配置
    const config = await prisma.homeConfig.findFirst({
      where: { section: CONFIG_SECTION },
    });

    if (!config) {
      // 返回默认配置
      return NextResponse.json({
        success: true,
        data: DEFAULT_CONFIG,
      });
    }

    // 合并默认配置和存储的配置
    const content = (config.content as Record<string, unknown>) || {};
    const storedConfig: RecipePageConfig = {
      h1: (content.h1 as string) || config.title || DEFAULT_CONFIG.h1,
      subtitle: (content.subtitle as string) || config.subtitle || DEFAULT_CONFIG.subtitle,
      footerText: (content.footerText as string) || DEFAULT_CONFIG.footerText,
      defaultSort: (content.defaultSort as "latest" | "popular") || DEFAULT_CONFIG.defaultSort,
      pinnedRecipeIds: config.recipeIds || DEFAULT_CONFIG.pinnedRecipeIds,
      blocks: (content.blocks as BlockConfig[]) || DEFAULT_CONFIG.blocks,
    };

    // 获取各区块的合集数据
    const blockData = await getBlockData(storedConfig.blocks);

    return NextResponse.json({
      success: true,
      data: storedConfig,
      blockData,
    });
  } catch (error) {
    console.error("获取一级聚合页配置失败:", error);
    return NextResponse.json({ success: false, error: "获取配置失败" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/recipe-page
 * 更新一级聚合页配置
 */
export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { h1, subtitle, footerText, defaultSort, pinnedRecipeIds, blocks } = body as Partial<RecipePageConfig>;

    // 验证
    if (blocks) {
      // 验证区块配置
      for (const block of blocks) {
        if (!block.type || typeof block.enabled !== "boolean" || typeof block.order !== "number") {
          return NextResponse.json(
            { success: false, error: "区块配置格式错误" },
            { status: 400 }
          );
        }
      }
    }

    // 查找现有配置
    const existing = await prisma.homeConfig.findFirst({
      where: { section: CONFIG_SECTION },
    });

    const content: Record<string, unknown> = existing?.content as Record<string, unknown> || {};

    // 更新字段
    if (h1 !== undefined) content.h1 = h1;
    if (subtitle !== undefined) content.subtitle = subtitle;
    if (footerText !== undefined) content.footerText = footerText;
    if (defaultSort !== undefined) content.defaultSort = defaultSort;
    if (blocks !== undefined) content.blocks = blocks;

    if (existing) {
      await prisma.homeConfig.update({
        where: { id: existing.id },
        data: {
          title: h1 || existing.title,
          subtitle: subtitle || existing.subtitle,
          recipeIds: pinnedRecipeIds || existing.recipeIds,
          content: content as object,
        },
      });
    } else {
      await prisma.homeConfig.create({
        data: {
          section: CONFIG_SECTION,
          title: h1 || DEFAULT_CONFIG.h1,
          subtitle: subtitle || DEFAULT_CONFIG.subtitle,
          recipeIds: pinnedRecipeIds || [],
          content: content as object,
        },
      });
    }

    // 清除前端缓存
    revalidateTag("recipe-page-config");
    revalidatePath("/[locale]/recipe", "page");
    revalidatePath("/zh/recipe");
    revalidatePath("/en/recipe");

    return NextResponse.json({
      success: true,
      message: "配置已更新",
    });
  } catch (error) {
    console.error("更新一级聚合页配置失败:", error);
    return NextResponse.json({ success: false, error: "更新配置失败" }, { status: 500 });
  }
}

/**
 * 获取各区块的合集数据
 */
async function getBlockData(blocks: BlockConfig[]) {
  const result: Record<string, unknown[]> = {};

  for (const block of blocks) {
    if (!block.enabled) continue;

    switch (block.type) {
      case "cuisine":
        // 获取已发布的菜系合集
        result.cuisine = await prisma.collection.findMany({
          where: {
            type: "cuisine",
            status: "published",
            cachedPublishedCount: { gte: 10 }, // 至少 10 个食谱
          },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            path: true,
            coverImage: true,
            cachedPublishedCount: true,
          },
          orderBy: { sortOrder: "asc" },
          take: block.maxItems || 12,
        });
        break;

      case "scene":
        result.scene = await prisma.collection.findMany({
          where: {
            type: "scene",
            status: "published",
            cachedPublishedCount: { gte: 10 },
          },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            path: true,
            coverImage: true,
            cachedPublishedCount: true,
          },
          orderBy: { sortOrder: "asc" },
          take: block.maxItems || 12,
        });
        break;

      case "ingredient":
        result.ingredient = await prisma.collection.findMany({
          where: {
            type: "ingredient",
            status: "published",
            cachedPublishedCount: { gte: 10 },
          },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            path: true,
            coverImage: true,
            cachedPublishedCount: true,
          },
          orderBy: { sortOrder: "asc" },
          take: block.maxItems || 12,
        });
        break;

      case "method":
        result.method = await prisma.collection.findMany({
          where: {
            type: "method",
            status: "published",
            cachedPublishedCount: { gte: 10 },
          },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            path: true,
            coverImage: true,
            cachedPublishedCount: true,
          },
          orderBy: { sortOrder: "asc" },
          take: block.maxItems || 12,
        });
        break;

      case "taste":
        result.taste = await prisma.collection.findMany({
          where: {
            type: "taste",
            status: "published",
            cachedPublishedCount: { gte: 10 },
          },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            path: true,
            coverImage: true,
            cachedPublishedCount: true,
          },
          orderBy: { sortOrder: "asc" },
          take: block.maxItems || 12,
        });
        break;

      case "latest":
        result.latest = await prisma.recipe.findMany({
          where: { status: "published" },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            viewCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: block.maxItems || 12,
        });
        break;

      case "popular":
        result.popular = await prisma.recipe.findMany({
          where: { status: "published" },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            viewCount: true,
            createdAt: true,
          },
          orderBy: { viewCount: "desc" },
          take: block.maxItems || 12,
        });
        break;
    }
  }

  return result;
}
