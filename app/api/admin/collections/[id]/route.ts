/**
 * 单个合集 API
 *
 * GET    /api/admin/collections/[id] - 获取合集详情（实时统计）
 * PUT    /api/admin/collections/[id] - 更新合集
 * DELETE /api/admin/collections/[id] - 删除合集
 *
 * 核心口径：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 进度：progress = publishedCount / targetCount * 100
 * 3. 详情页使用实时计算统计
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  calculateProgress,
  calculateQualifiedStatus,
  CollectionTypePath,
} from "@/lib/types/collection";
import { buildRuleWhereClause, validateRuleConfig } from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";
import type {
  CollectionDetail,
  UpdateCollectionRequest,
  ApiResponse,
  ApiError,
} from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * 实时计算合集匹配的食谱数量
 * 口径：根据规则匹配，排除 excludedRecipeIds
 */
async function countMatchedRecipesRealtime(collection: {
  id: string;
  ruleType: string;
  rules: unknown;
  cuisineId: string | null;
  locationId: string | null;
  tagId: string | null;
  excludedRecipeIds: string[];
  pinnedRecipeIds: string[];
}): Promise<{ matched: number; published: number; pending: number; draft: number }> {
  // 使用规则引擎构建查询条件
  const baseWhere = buildRuleWhereClause(collection.rules as RuleConfig, {
    cuisineId: collection.cuisineId,
    locationId: collection.locationId,
    tagId: collection.tagId,
    excludedRecipeIds: collection.excludedRecipeIds,
  });

  const pinnedIds = collection.pinnedRecipeIds || [];
  const excludedIds = collection.excludedRecipeIds || [];
  const matchWhere =
    pinnedIds.length > 0
      ? {
          AND: [
            { OR: [baseWhere, { id: { in: pinnedIds } }] },
            excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {},
          ],
        }
      : baseWhere;

  // 分别统计各状态数量
  const [published, pending, draft] = await Promise.all([
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "published" }] } }),
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "pending" }] } }),
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "draft" }] } }),
  ]);

  return {
    matched: published + pending + draft,
    published,
    pending,
    draft,
  };
}

/**
 * GET /api/admin/collections/[id]
 * 获取合集详情（使用实时统计）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        cuisine: true,
        location: true,
        tag: true,
      },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // 实时计算统计数据
    const counts = await countMatchedRecipesRealtime({
      id: collection.id,
      ruleType: collection.ruleType,
      rules: collection.rules,
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
      pinnedRecipeIds: collection.pinnedRecipeIds,
    });

    // 获取已加入的食谱列表（限制100个，避免过大）
    const baseWhere = buildRuleWhereClause(collection.rules as RuleConfig, {
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
    });

    const pinnedIds = collection.pinnedRecipeIds || [];
    const excludedIds = collection.excludedRecipeIds || [];
    const matchWhere =
      pinnedIds.length > 0
        ? {
            AND: [
              { OR: [baseWhere, { id: { in: pinnedIds } }] },
              excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {},
            ],
          }
        : baseWhere;

    const recipes = await prisma.recipe.findMany({
      where: matchWhere,
      select: {
        id: true,
        title: true,
        status: true,
      },
      take: 100,
      orderBy: [
        { status: "desc" }, // published first
        { createdAt: "desc" },
      ],
    });

    // 判断每个食谱的加入方式
    const recipesWithMethod = recipes.map((r) => {
      let addMethod: "rule" | "manual" | "ai" = "rule";

      // 如果在 pinnedRecipeIds 中，说明是手动添加或 AI 生成
      if (pinnedIds.includes(r.id)) {
        // TODO: 未来可以通过 Recipe 表的字段判断是否为 AI 生成
        // 暂时统一标记为手动添加
        addMethod = "manual";
      }

      return {
        id: r.id,
        title: r.title,
        status: r.status,
        addMethod,
      };
    });

    // 获取关联实体名称
    let linkedEntityName: string | undefined;
    let linkedEntityType: string | undefined;
    if (collection.cuisine) {
      linkedEntityName = collection.cuisine.name;
      linkedEntityType = "cuisine";
    } else if (collection.location) {
      linkedEntityName = collection.location.name;
      linkedEntityType = "location";
    } else if (collection.tag) {
      linkedEntityName = collection.tag.name;
      linkedEntityType = "tag";
    }

    // 构建响应
    const detail: CollectionDetail = {
      id: collection.id,
      type: collection.type,
      name: collection.name,
      nameEn: collection.nameEn,
      slug: collection.slug,
      path: collection.path,
      status: collection.status,
      coverImage: collection.coverImage,
      description: collection.description,
      descriptionEn: collection.descriptionEn,
      ruleType: collection.ruleType as "auto" | "custom",
      rules: collection.rules as any,
      seo: collection.seo as any,
      pinnedRecipeIds: collection.pinnedRecipeIds,
      excludedRecipeIds: collection.excludedRecipeIds,
      minRequired: collection.minRequired,
      targetCount: collection.targetCount,
      sortOrder: collection.sortOrder,
      isFeatured: collection.isFeatured,
      publishedAt: collection.publishedAt?.toISOString() || null,
      transStatus: collection.transStatus as Record<string, string>,
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      linkedEntityName,
      linkedEntityType,
      // 实时统计
      matchedCount: counts.matched,
      publishedCount: counts.published,
      pendingCount: counts.pending,
      draftCount: counts.draft,
      // 计算字段
      progress: calculateProgress(counts.published, collection.targetCount),
      qualifiedStatus: calculateQualifiedStatus(
        counts.published,
        collection.minRequired,
        collection.targetCount
      ),
      // 已加入的食谱列表
      recipes: recipesWithMethod,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<CollectionDetail>>({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error("获取合集详情失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取合集详情失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/collections/[id]
 * 更新合集基本信息
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body: UpdateCollectionRequest = await request.json();

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // 可更新字段
    if (body.name !== undefined) updateData.name = body.name;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.minRequired !== undefined) updateData.minRequired = body.minRequired;
    if (body.targetCount !== undefined) updateData.targetCount = body.targetCount;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.seo !== undefined) {
      // 合并现有 SEO 配置和新配置
      const existingSeo = (existing.seo as Record<string, unknown>) || {};
      updateData.seo = { ...existingSeo, ...body.seo };
    }

    if (body.rules !== undefined || body.ruleType !== undefined) {
      const rules = body.rules ?? existing.rules;
      const validation = validateRuleConfig(rules as RuleConfig);
      if (!validation.valid) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "规则配置无效",
              details: { rules: validation.errors },
            },
          },
          { status: 400 }
        );
      }

      updateData.ruleType = body.ruleType ?? existing.ruleType;
      updateData.rules = rules;
    }

    // 如果修改了 slug，需要同步更新 path
    if (body.slug !== undefined && body.slug !== existing.slug) {
      // 检查新 slug 是否已存在
      const slugExists = await prisma.collection.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (slugExists) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "slug 已存在",
              details: { slug: ["该 slug 已被使用"] },
            },
          },
          { status: 409 }
        );
      }

      updateData.slug = body.slug;
      const typePath =
        CollectionTypePath[existing.type as keyof typeof CollectionTypePath] ||
        `/recipe/${existing.type}`;
      updateData.path = `${typePath}/${body.slug}`;
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<{ id: string; slug: string }>>({
      success: true,
      data: { id: updated.id, slug: updated.slug },
    });
  } catch (error) {
    console.error("更新合集失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "更新合集失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { recipes: true } } },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // 检查是否有关联的食谱
    if (collection._count.recipes > 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `无法删除：该合集关联了 ${collection._count.recipes} 个菜谱`,
          },
        },
        { status: 400 }
      );
    }

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: { message: "删除成功" },
    });
  } catch (error) {
    console.error("删除合集失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "删除失败" },
      },
      { status: 500 }
    );
  }
}
