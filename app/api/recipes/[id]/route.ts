/**
 * 单个食谱 API 路由
 *
 * GET    /api/recipes/[id] - 获取单个食谱（公开接口，仅返回已发布内容）
 * PUT    /api/recipes/[id] - 更新食谱（需管理员权限）- 已废弃
 * PATCH  /api/recipes/[id] - 更新发布状态（需管理员权限）- 已废弃
 * DELETE /api/recipes/[id] - 删除食谱（需管理员权限）- 已废弃
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/recipes/[id]
 * 公开接口 - 仅返回已发布的食谱（管理员可访问所有）
 *
 * Query params:
 * - locale: 语言（en/zh，默认 zh）
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const locale = request.nextUrl.searchParams.get("locale") || "zh";

    // 检查是否为管理员（可选，不强制登录）
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        collection: { select: { id: true, name: true, slug: true } },
        tags: {
          include: {
            tag: {
              select: { id: true, type: true, name: true, slug: true, icon: true },
            },
          },
        },
        translations: locale !== "zh" ? { where: { locale } } : false,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 非管理员只能访问已发布的食谱
    if (!isAdmin && recipe.status !== "published") {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 更新浏览次数（非阻塞）
    if (recipe.status === "published") {
      prisma.recipe.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    // 获取翻译版本（如果有）
    const translation = locale !== "zh" && recipe.translations?.[0];

    // 按类型分组标签
    const tagsByType: Record<string, { id: string; name: string; slug: string; icon?: string }[]> = {};
    recipe.tags.forEach((rt) => {
      const type = rt.tag.type;
      if (!tagsByType[type]) tagsByType[type] = [];
      tagsByType[type].push({
        id: rt.tag.id,
        name: rt.tag.name,
        slug: rt.tag.slug,
        icon: rt.tag.icon || undefined,
      });
    });

    // 格式化返回数据
    const formattedRecipe = {
      id: recipe.id,
      // 基本信息
      title: translation ? translation.title : recipe.title,
      slug: translation ? translation.slug : recipe.slug,
      description: translation ? translation.description : recipe.description,
      difficulty: translation ? translation.difficulty : recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      // 图片
      coverImage: recipe.coverImage,
      styleGuide: recipe.styleGuide,
      imageShots: recipe.imageShots,
      // 内容
      summary: translation ? translation.summary : recipe.summary,
      story: translation ? translation.story : recipe.story,
      ingredients: translation ? translation.ingredients : recipe.ingredients,
      steps: translation ? translation.steps : recipe.steps,
      nutrition: recipe.nutrition,
      // 分类
      cuisine: recipe.cuisine,
      location: recipe.location,
      collection: recipe.collection,
      tags: tagsByType,
      // 状态信息
      status: recipe.status,
      reviewStatus: recipe.reviewStatus,
      aiGenerated: recipe.aiGenerated,
      // 统计
      viewCount: recipe.viewCount,
      // 时间
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      publishedAt: recipe.publishedAt,
      // 翻译状态（仅管理员可见）
      ...(isAdmin && {
        transStatus: recipe.transStatus,
        qualityScore: recipe.qualityScore,
      }),
    };

    return NextResponse.json({
      success: true,
      data: formattedRecipe,
    });
  } catch (error) {
    console.error("获取食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食谱失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recipes/[id]
 * 已废弃，请使用 /api/admin/recipes/[id]
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  void request;
  void context;
  return NextResponse.json(
    { success: false, error: "此接口已废弃，请使用 /api/admin/recipes/[id]" },
    { status: 410 }
  );
}

/**
 * PATCH /api/recipes/[id]
 * 已废弃，请使用 /api/admin/recipes/[id]
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  void request;
  void context;
  return NextResponse.json(
    { success: false, error: "此接口已废弃，请使用 /api/admin/recipes/[id]" },
    { status: 410 }
  );
}

/**
 * DELETE /api/recipes/[id]
 * 已废弃，请使用 /api/admin/recipes/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  void request;
  void context;
  return NextResponse.json(
    { success: false, error: "此接口已废弃，请使用 /api/admin/recipes/[id]" },
    { status: 410 }
  );
}
