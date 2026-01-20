/**
 * 后台食谱管理 API
 *
 * GET  /api/admin/recipes - 获取食谱列表（支持筛选状态）
 * POST /api/admin/recipes - 创建新食谱
 *
 * 此接口仅供后台使用，支持完整的筛选功能
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

/**
 * 解析地点参数（支持 slug 和中文名）
 */
async function resolveLocationId(location: string): Promise<string | null> {
  const bySlug = await prisma.location.findUnique({
    where: { slug: location },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

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
 * 创建或获取标签 ID
 */
async function resolveOrCreateTags(
  tagData: { type: string; name: string; slug?: string }[]
): Promise<string[]> {
  const tagIds: string[] = [];

  for (const data of tagData) {
    // 先尝试按 name + type 查找
    let tag = await prisma.tag.findUnique({
      where: { type_name: { type: data.type, name: data.name } },
    });

    // 如果没有，尝试按 slug 查找
    if (!tag && data.slug) {
      tag = await prisma.tag.findUnique({
        where: { slug: data.slug },
      });
    }

    // 如果还是没有，创建新标签
    if (!tag) {
      const slug = data.slug || `${data.type}-${data.name.toLowerCase().replace(/\s+/g, "-")}`;
      tag = await prisma.tag.create({
        data: {
          type: data.type,
          name: data.name,
          slug,
          isActive: true,
        },
      });
    }

    tagIds.push(tag.id);
  }

  return tagIds;
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

/**
 * GET /api/admin/recipes
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 50）
 * - search: 搜索关键词
 * - status: 发布状态（draft/pending/published/archived）
 * - reviewStatus: 审核状态（pending/approved/rejected）
 * - locationId: 地点 ID 筛选
 * - cuisineId: 菜系 ID 筛选
 * - collectionId: 合集筛选
 * - sceneId: 场景标签 ID 筛选
 * - methodId: 烹饪方法标签 ID 筛选
 * - tasteId: 口味标签 ID 筛选
 * - crowdId: 人群标签 ID 筛选
 * - occasionId: 场合标签 ID 筛选
 * - aiGenerated: 是否 AI 生成（true/false）
 * - includeTranslations: 是否包含翻译状态（true/false）
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const reviewStatus = searchParams.get("reviewStatus");
    const locationId = searchParams.get("locationId");
    const cuisineId = searchParams.get("cuisineId");
    const collectionId = searchParams.get("collectionId");
    // 标签筛选
    const sceneId = searchParams.get("sceneId");
    const methodId = searchParams.get("methodId");
    const tasteId = searchParams.get("tasteId");
    const crowdId = searchParams.get("crowdId");
    const occasionId = searchParams.get("occasionId");
    const aiGeneratedParam = searchParams.get("aiGenerated");
    const includeTranslations = searchParams.get("includeTranslations") === "true";

    // 构建查询条件
    const where: Record<string, unknown> = {};

    // 搜索
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        {
          translations: {
            some: { title: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 审核状态筛选
    if (reviewStatus) {
      where.reviewStatus = reviewStatus;
    }

    // 地点筛选（直接使用 ID）
    if (locationId) {
      where.locationId = locationId;
    }

    // 菜系筛选（直接使用 ID）
    if (cuisineId) {
      where.cuisineId = cuisineId;
    }

    // 合集筛选
    if (collectionId) {
      where.collectionId = collectionId;
    }

    // 标签筛选 - 通过 tags 关联表筛选
    const tagFilters: string[] = [];
    if (sceneId) tagFilters.push(sceneId);
    if (methodId) tagFilters.push(methodId);
    if (tasteId) tagFilters.push(tasteId);
    if (crowdId) tagFilters.push(crowdId);
    if (occasionId) tagFilters.push(occasionId);

    if (tagFilters.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagFilters },
        },
      };
    }

    // AI 生成筛选
    if (aiGeneratedParam !== null && aiGeneratedParam !== "") {
      where.aiGenerated = aiGeneratedParam === "true";
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询数据
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          cuisine: { select: { id: true, name: true, slug: true } },
          location: { select: { id: true, name: true, slug: true } },
          collection: { select: { id: true, name: true, type: true } },
          tags: {
            include: {
              tag: { select: { id: true, type: true, name: true, slug: true } },
            },
          },
          translations: includeTranslations
            ? {
                select: {
                  id: true,
                  locale: true,
                  isReviewed: true,
                  reviewedAt: true,
                },
              }
            : false,
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    // 格式化数据
    const formattedRecipes = recipes.map((recipe) => {
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
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        difficulty: recipe.difficulty,
        coverImage: recipe.coverImage,
        cuisine: recipe.cuisine,
        location: recipe.location,
        collection: recipe.collection,
        tags: tagsByType,
        status: recipe.status,
        reviewStatus: recipe.reviewStatus,
        aiGenerated: recipe.aiGenerated,
        transStatus: recipe.transStatus,
        qualityScore: recipe.qualityScore,
        translations: recipe.translations || [],
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
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
 * POST /api/admin/recipes
 * 创建新食谱（需管理员权限）
 *
 * Body:
 * {
 *   title: string,           // 中文标题
 *   slug?: string,           // URL标识，不传则自动生成
 *   description?: string,    // 一句话介绍
 *   difficulty?: string,     // easy/medium/hard
 *   prepTime?: number,       // 准备时间(分钟)
 *   cookTime?: number,       // 烹饪时间(分钟)
 *   servings?: string,       // 份量
 *   summary?: object,        // 摘要信息 JSON
 *   story?: object,          // 文化故事 JSON
 *   ingredients: object,     // 食材列表 JSON
 *   steps: object,           // 烹饪步骤 JSON
 *   nutrition?: object,      // 营养信息 JSON
 *   coverImage?: string,     // 封面图
 *   styleGuide?: object,     // 风格指南 JSON
 *   imageShots?: object,     // 配图方案 JSON
 *   cuisineId?: string,      // 菜系 ID（或传 cuisine 名称/slug）
 *   cuisine?: string,        // 菜系名称或 slug
 *   locationId?: string,     // 地点 ID（或传 location 名称/slug）
 *   location?: string,       // 地点名称或 slug
 *   collectionId?: string,   // 所属合集 ID
 *   tags?: { type, name, slug? }[],  // 标签数组
 *   status?: string,         // draft/pending/published
 *   aiGenerated?: boolean,   // 是否 AI 生成
 *   generateJobId?: string,  // 关联的生成任务 ID
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();

    // 验证必填字段
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "title 为必填项" },
        { status: 400 }
      );
    }
    if (!body.ingredients) {
      return NextResponse.json(
        { success: false, error: "ingredients 为必填项" },
        { status: 400 }
      );
    }
    if (!body.steps) {
      return NextResponse.json(
        { success: false, error: "steps 为必填项" },
        { status: 400 }
      );
    }

    // 生成 slug
    const slug =
      body.slug ||
      `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 解析菜系 ID
    let cuisineId = body.cuisineId;
    if (!cuisineId && body.cuisine) {
      cuisineId = await resolveCuisineId(body.cuisine);
    }

    // 解析地点 ID
    let locationId = body.locationId;
    if (!locationId && body.location) {
      locationId = await resolveLocationId(body.location);
    }

    // 解析标签
    let tagIds: string[] = [];
    if (body.tags && Array.isArray(body.tags)) {
      tagIds = await resolveOrCreateTags(body.tags);
    }

    // 创建食谱
    const recipe = await prisma.recipe.create({
      data: {
        title: body.title,
        slug,
        description: body.description || null,
        difficulty: body.difficulty || null,
        prepTime: body.prepTime || null,
        cookTime: body.cookTime || null,
        servings: body.servings || null,
        summary: body.summary || null,
        story: body.story || null,
        ingredients: body.ingredients,
        steps: body.steps,
        nutrition: body.nutrition || null,
        coverImage: body.coverImage || null,
        styleGuide: body.styleGuide || null,
        imageShots: body.imageShots || null,
        cuisineId,
        locationId,
        collectionId: body.collectionId || null,
        status: body.status || "draft",
        reviewStatus: "pending",
        aiGenerated: body.aiGenerated || false,
        generateJobId: body.generateJobId || null,
        // 创建标签关联
        tags: tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        collection: { select: { id: true, name: true, type: true } },
        tags: {
          include: {
            tag: { select: { id: true, type: true, name: true, slug: true } },
          },
        },
      },
    });

    // 格式化标签
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

    return NextResponse.json({
      success: true,
      data: {
        ...recipe,
        tags: tagsByType,
      },
    });
  } catch (error) {
    console.error("创建食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "创建食谱失败" },
      { status: 500 }
    );
  }
}
