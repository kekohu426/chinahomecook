/**
 * 食谱 API 路由
 *
 * GET  /api/recipes - 获取所有食谱（支持分页、搜索）
 * POST /api/recipes - 创建新食谱（已废弃，后台请用 /api/admin/recipes）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * 解析地点参数（支持 slug 和中文名）
 * 优先按 slug 查找，找不到则按中文名匹配
 */
async function resolveLocationId(location: string): Promise<string | null> {
  // 先按 slug 查找
  const bySlug = await prisma.location.findUnique({
    where: { slug: location },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  // 再按中文名查找
  const byName = await prisma.location.findUnique({
    where: { name: location },
    select: { id: true },
  });
  if (byName) return byName.id;

  return null;
}

/**
 * 解析菜系参数（支持 slug 和中文名）
 */
async function resolveCuisineId(cuisine: string): Promise<string | null> {
  const bySlug = await prisma.cuisine.findUnique({
    where: { slug: cuisine },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const byName = await prisma.cuisine.findUnique({
    where: { name: cuisine },
    select: { id: true },
  });
  if (byName) return byName.id;

  return null;
}

/**
 * 根据标签类型和 slug 获取标签 ID
 */
async function resolveTagIds(type: string, slugs: string[]): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    where: {
      type,
      slug: { in: slugs },
      isActive: true,
    },
    select: { id: true },
  });
  return tags.map((t) => t.id);
}

/**
 * GET /api/recipes
 *
 * 公开接口 - 只返回已发布的食谱
 * 后台管理请使用 /api/admin/recipes
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 10）
 * - search: 搜索关键词（搜索标题）
 * - location: 地点筛选（支持 slug 如 sichuan，或中文如 四川）
 * - cuisine: 菜系筛选（支持 slug 如 chuan，或中文如 川菜）
 * - ingredient: 食材筛选（支持多个，用逗号分隔）- 暂不支持（需重新设计）
 * - scene: 场景标签筛选（slug，如 breakfast）
 * - method: 烹饪方法筛选（slug，如 stir-fry）
 * - taste: 口味筛选（slug，如 spicy）
 * - crowd: 适宜人群筛选（slug，如 kids）
 * - occasion: 场合筛选（slug，如 everyday）
 * - locale: 语言（en/zh，决定返回翻译版本还是原版）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location");
    const cuisine = searchParams.get("cuisine");
    const locale = searchParams.get("locale") || "zh";
    // 标签筛选参数
    const scene = searchParams.get("scene");
    const method = searchParams.get("method");
    const taste = searchParams.get("taste");
    const crowd = searchParams.get("crowd");
    const occasion = searchParams.get("occasion");

    // 构建查询条件
    const where: Record<string, unknown> = {
      // 安全：公开接口强制只返回已发布内容
      status: "published",
    };

    // 搜索（中文标题）
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    // 地点筛选
    if (location) {
      const locationId = await resolveLocationId(location);
      if (locationId) {
        where.locationId = locationId;
      }
    }

    // 菜系筛选
    if (cuisine) {
      const cuisineId = await resolveCuisineId(cuisine);
      if (cuisineId) {
        where.cuisineId = cuisineId;
      }
    }

    // 标签筛选（通过 RecipeTag 关联）
    const tagFilters: { tagId: { in: string[] } }[] = [];

    if (scene) {
      const tagIds = await resolveTagIds("scene", scene.split(",").map((s) => s.trim()));
      if (tagIds.length > 0) tagFilters.push({ tagId: { in: tagIds } });
    }
    if (method) {
      const tagIds = await resolveTagIds("method", method.split(",").map((s) => s.trim()));
      if (tagIds.length > 0) tagFilters.push({ tagId: { in: tagIds } });
    }
    if (taste) {
      const tagIds = await resolveTagIds("taste", taste.split(",").map((s) => s.trim()));
      if (tagIds.length > 0) tagFilters.push({ tagId: { in: tagIds } });
    }
    if (crowd) {
      const tagIds = await resolveTagIds("crowd", crowd.split(",").map((s) => s.trim()));
      if (tagIds.length > 0) tagFilters.push({ tagId: { in: tagIds } });
    }
    if (occasion) {
      const tagIds = await resolveTagIds("occasion", occasion.split(",").map((s) => s.trim()));
      if (tagIds.length > 0) tagFilters.push({ tagId: { in: tagIds } });
    }

    // 如果有标签筛选，添加关联条件
    if (tagFilters.length > 0) {
      where.tags = {
        some: {
          OR: tagFilters,
        },
      };
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询数据
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          cuisine: { select: { id: true, name: true, slug: true } },
          location: { select: { id: true, name: true, slug: true } },
          tags: {
            include: {
              tag: { select: { id: true, type: true, name: true, slug: true } },
            },
          },
          // 如果请求英文版，包含翻译
          translations: locale !== "zh" ? { where: { locale } } : false,
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    // 格式化返回数据
    const formattedRecipes = recipes.map((recipe) => {
      const translation = locale !== "zh" && recipe.translations?.[0];

      // 按类型分组标签
      const tagsByType: Record<string, { id: string; name: string; slug: string }[]> = {};
      recipe.tags.forEach((rt) => {
        const type = rt.tag.type;
        if (!tagsByType[type]) tagsByType[type] = [];
        tagsByType[type].push({
          id: rt.tag.id,
          name: rt.tag.name,
          slug: rt.tag.slug,
        });
      });

      return {
        id: recipe.id,
        title: translation ? translation.title : recipe.title,
        slug: translation ? translation.slug : recipe.slug,
        description: translation ? translation.description : recipe.description,
        difficulty: translation ? translation.difficulty : recipe.difficulty,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        coverImage: recipe.coverImage,
        cuisine: recipe.cuisine,
        location: recipe.location,
        tags: tagsByType,
        summary: translation ? translation.summary : recipe.summary,
        createdAt: recipe.createdAt,
        publishedAt: recipe.publishedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRecipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取食谱列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食谱列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 *
 * 创建新食谱（已废弃）
 */
export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json(
    { success: false, error: "此接口已废弃，请使用 /api/admin/recipes" },
    { status: 410 }
  );
}
