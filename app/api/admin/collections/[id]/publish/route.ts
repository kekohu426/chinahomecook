/**
 * 合集发布 API
 *
 * POST /api/admin/collections/[id]/publish
 * 发布合集（需达标检查）
 *
 * 核心口径：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 未达标时默认允许发布但返回 warning
 * 3. force=true 可强制发布
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  calculateProgress,
  calculateQualifiedStatus,
  QualifiedStatus,
} from "@/lib/types/collection";
import { buildRuleWhereClause } from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";
import type {
  PublishCollectionRequest,
  PublishCollectionResponse,
  ApiResponse,
  ApiError,
} from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * 实时计算已发布食谱数量
 */
async function countPublishedRecipes(collection: {
  rules: unknown;
  cuisineId: string | null;
  locationId: string | null;
  tagId: string | null;
  excludedRecipeIds: string[];
}): Promise<number> {
  const baseWhere = buildRuleWhereClause(collection.rules as RuleConfig, {
    cuisineId: collection.cuisineId,
    locationId: collection.locationId,
    tagId: collection.tagId,
    excludedRecipeIds: collection.excludedRecipeIds,
  });

  return prisma.recipe.count({
    where: { ...baseWhere, status: "published" },
  });
}

/**
 * POST /api/admin/collections/[id]/publish
 * 发布合集
 */
export async function POST(request: NextRequest, context: RouteContext) {
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
    const body: PublishCollectionRequest = await request.json().catch(() => ({}));
    const { force = false } = body;

    // 获取合集
    const collection = await prisma.collection.findUnique({
      where: { id },
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

    // 检查当前状态
    if (collection.status === "published") {
      return NextResponse.json<ApiResponse<PublishCollectionResponse>>({
        success: true,
        data: {
          published: true,
          qualifiedStatus: calculateQualifiedStatus(
            collection.cachedPublishedCount,
            collection.minRequired,
            collection.targetCount
          ),
          message: "合集已经是发布状态",
          publishedCount: collection.cachedPublishedCount,
          minRequired: collection.minRequired,
        },
      });
    }

    // 实时计算已发布食谱数量
    const publishedCount = await countPublishedRecipes({
      rules: collection.rules,
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
    });

    // 计算达标状态
    const qualifiedStatus = calculateQualifiedStatus(
      publishedCount,
      collection.minRequired,
      collection.targetCount
    );

    // 检查是否达标
    const isQualified = qualifiedStatus === QualifiedStatus.QUALIFIED;

    // 未达标且未强制发布时，返回警告但仍允许发布
    let message = "";
    if (!isQualified && !force) {
      message = `警告：当前已发布食谱数 ${publishedCount} 未达到最低要求 ${collection.minRequired}，建议补充内容后再发布`;
    }

    // 执行发布
    const now = new Date();
    await prisma.collection.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: collection.publishedAt || now, // 首次发布时间
        // 同时更新缓存
        cachedPublishedCount: publishedCount,
        cachedAt: now,
      },
    });

    return NextResponse.json<ApiResponse<PublishCollectionResponse>>({
      success: true,
      data: {
        published: true,
        qualifiedStatus,
        message: message || "发布成功",
        publishedCount,
        minRequired: collection.minRequired,
      },
    });
  } catch (error) {
    console.error("发布合集失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "发布失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections/[id]/publish
 * 下架合集（改为草稿状态）
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

    // 获取合集
    const collection = await prisma.collection.findUnique({
      where: { id },
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

    // 检查当前状态
    if (collection.status !== "published") {
      return NextResponse.json<ApiResponse<{ message: string }>>({
        success: true,
        data: { message: "合集当前不是发布状态" },
      });
    }

    // 执行下架
    await prisma.collection.update({
      where: { id },
      data: {
        status: "draft",
      },
    });

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: { message: "下架成功" },
    });
  } catch (error) {
    console.error("下架合集失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "下架失败" },
      },
      { status: 500 }
    );
  }
}
