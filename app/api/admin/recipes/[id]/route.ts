/**
 * 后台单个食谱管理 API
 *
 * GET    /api/admin/recipes/[id] - 获取食谱详情
 * PUT    /api/admin/recipes/[id] - 更新食谱
 * PATCH  /api/admin/recipes/[id] - 更新状态（发布/审核）
 * DELETE /api/admin/recipes/[id] - 删除食谱
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

interface RouteContext {
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

/**
 * 解析菜系 ID
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
 * 解析地点 ID
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
 * 解析或创建标签
 */
async function resolveOrCreateTags(
  tagData: { type: string; name: string; slug?: string }[]
): Promise<string[]> {
  const tagIds: string[] = [];

  for (const data of tagData) {
    let tag = await prisma.tag.findUnique({
      where: { type_name: { type: data.type, name: data.name } },
    });

    if (!tag && data.slug) {
      tag = await prisma.tag.findUnique({
        where: { slug: data.slug },
      });
    }

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

/**
 * GET /api/admin/recipes/[id]
 * 获取食谱详情
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        collection: { select: { id: true, name: true, type: true } },
        tags: {
          include: {
            tag: { select: { id: true, type: true, name: true, slug: true, icon: true } },
          },
        },
        translations: true,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 格式化标签
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

    return NextResponse.json({
      success: true,
      data: {
        ...recipe,
        tags: tagsByType,
      },
    });
  } catch (error) {
    console.error("获取食谱详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食谱详情失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/recipes/[id]
 * 更新食谱（完整更新）
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 解析菜系 ID
    let cuisineId = body.cuisineId;
    if (cuisineId === undefined && body.cuisine) {
      cuisineId = await resolveCuisineId(body.cuisine);
    }

    // 解析地点 ID
    let locationId = body.locationId;
    if (locationId === undefined && body.location) {
      locationId = await resolveLocationId(body.location);
    }

    // 处理标签更新
    let tagOperations = {};
    if (body.tags !== undefined && Array.isArray(body.tags)) {
      const newTagIds = await resolveOrCreateTags(body.tags);
      const existingTagIds = existing.tags.map((t) => t.tagId);

      // 需要删除的标签
      const toDelete = existingTagIds.filter((tid) => !newTagIds.includes(tid));
      // 需要添加的标签
      const toAdd = newTagIds.filter((tid) => !existingTagIds.includes(tid));

      tagOperations = {
        tags: {
          deleteMany: toDelete.length > 0 ? { tagId: { in: toDelete } } : undefined,
          create: toAdd.map((tagId) => ({ tagId })),
        },
      };
    }

    // 更新食谱
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        slug: body.slug !== undefined ? body.slug : existing.slug,
        description: body.description !== undefined ? body.description : existing.description,
        difficulty: body.difficulty !== undefined ? body.difficulty : existing.difficulty,
        prepTime: body.prepTime !== undefined ? body.prepTime : existing.prepTime,
        cookTime: body.cookTime !== undefined ? body.cookTime : existing.cookTime,
        servings: body.servings !== undefined ? body.servings : existing.servings,
        summary: body.summary !== undefined ? body.summary : existing.summary,
        story: body.story !== undefined ? body.story : existing.story,
        ingredients: body.ingredients !== undefined ? body.ingredients : existing.ingredients,
        steps: body.steps !== undefined ? body.steps : existing.steps,
        nutrition: body.nutrition !== undefined ? body.nutrition : existing.nutrition,
        coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
        styleGuide: body.styleGuide !== undefined ? body.styleGuide : existing.styleGuide,
        imageShots: body.imageShots !== undefined ? body.imageShots : existing.imageShots,
        cuisineId: cuisineId !== undefined ? cuisineId : existing.cuisineId,
        locationId: locationId !== undefined ? locationId : existing.locationId,
        collectionId: body.collectionId !== undefined ? body.collectionId : existing.collectionId,
        ...tagOperations,
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
    console.error("更新食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "更新食谱失败" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/recipes/[id]
 * 快捷更新状态
 *
 * Body:
 * - status: draft/pending/published/archived
 * - reviewStatus: pending/approved/rejected
 * - reviewNote: string
 * - autoTranslate: boolean (审核通过后是否自动创建翻译任务)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // 更新发布状态
    if (body.status !== undefined) {
      const validStatuses = ["draft", "pending", "published", "archived"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `status 必须是 ${validStatuses.join("/")}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;

      // 如果发布，记录发布时间
      if (body.status === "published" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // 更新审核状态
    if (body.reviewStatus !== undefined) {
      const validReviewStatuses = ["pending", "approved", "rejected"];
      if (!validReviewStatuses.includes(body.reviewStatus)) {
        return NextResponse.json(
          { success: false, error: `reviewStatus 必须是 ${validReviewStatuses.join("/")}` },
          { status: 400 }
        );
      }
      updateData.reviewStatus = body.reviewStatus;
      updateData.reviewedAt = new Date();

      if (body.reviewNote !== undefined) {
        updateData.reviewNote = body.reviewNote;
      }

      // 审核通过后自动发布
      if (body.reviewStatus === "approved") {
        updateData.status = "published";
        if (!existing.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "没有可更新的字段" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
    });

    // 如果审核通过且需要自动翻译
    if (body.reviewStatus === "approved" && body.autoTranslate !== false) {
      await prisma.translationJob.create({
        data: {
          entityType: "recipe",
          entityId: id,
          targetLang: "en",
          priority: 5,
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: recipe,
      message: body.reviewStatus === "approved" ? "已通过并发布" : "状态已更新",
    });
  } catch (error) {
    console.error("更新状态失败:", error);
    return NextResponse.json(
      { success: false, error: "更新状态失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/recipes/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;

    const existing = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 删除食谱（关联的 RecipeTag 和 RecipeTranslation 会通过 onDelete: Cascade 自动删除）
    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "食谱已删除",
    });
  } catch (error) {
    console.error("删除食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "删除食谱失败" },
      { status: 500 }
    );
  }
}
