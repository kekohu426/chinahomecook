/**
 * 刷新合集缓存统计 API
 *
 * POST /api/admin/collections/refresh-counts
 * 刷新指定合集或所有合集的缓存统计
 *
 * 请求体：
 * { collectionIds?: string[] } // 不传则刷新所有
 *
 * 响应：
 * { success: true, refreshed: number, message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { buildRuleWhereClause } from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";
import type { ApiResponse, ApiError } from "@/lib/types/collection-api";

interface RefreshRequest {
  collectionIds?: string[];
}

interface RefreshResponse {
  refreshed: number;
  message: string;
  details?: Array<{
    id: string;
    name: string;
    matched: number;
    published: number;
    pending: number;
  }>;
}

/**
 * 计算单个合集的实时统计
 */
async function calculateCollectionCounts(collection: {
  id: string;
  ruleType: string;
  rules: unknown;
  cuisineId: string | null;
  locationId: string | null;
  tagId: string | null;
  excludedRecipeIds: string[];
}): Promise<{ matched: number; published: number; pending: number; draft: number }> {
  const baseWhere = buildRuleWhereClause(collection.rules as RuleConfig, {
    cuisineId: collection.cuisineId,
    locationId: collection.locationId,
    tagId: collection.tagId,
    excludedRecipeIds: collection.excludedRecipeIds,
  });

  const [published, pending, draft] = await Promise.all([
    prisma.recipe.count({ where: { ...baseWhere, status: "published" } }),
    prisma.recipe.count({ where: { ...baseWhere, status: "pending" } }),
    prisma.recipe.count({ where: { ...baseWhere, status: "draft" } }),
  ]);

  return {
    matched: published + pending + draft,
    published,
    pending,
    draft,
  };
}

export async function POST(request: NextRequest) {
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

    const body: RefreshRequest = await request.json().catch(() => ({}));
    const { collectionIds } = body;

    // 获取要刷新的合集
    const whereClause = collectionIds && collectionIds.length > 0
      ? { id: { in: collectionIds } }
      : {};

    const collections = await prisma.collection.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        ruleType: true,
        rules: true,
        cuisineId: true,
        locationId: true,
        tagId: true,
        excludedRecipeIds: true,
      },
    });

    if (collections.length === 0) {
      return NextResponse.json<ApiResponse<RefreshResponse>>({
        success: true,
        data: {
          refreshed: 0,
          message: "没有找到需要刷新的合集",
        },
      });
    }

    // 批量计算并更新
    const details: RefreshResponse["details"] = [];
    const now = new Date();

    for (const collection of collections) {
      const counts = await calculateCollectionCounts({
        id: collection.id,
        ruleType: collection.ruleType,
        rules: collection.rules,
        cuisineId: collection.cuisineId,
        locationId: collection.locationId,
        tagId: collection.tagId,
        excludedRecipeIds: collection.excludedRecipeIds,
      });

      await prisma.collection.update({
        where: { id: collection.id },
        data: {
          cachedMatchedCount: counts.matched,
          cachedPublishedCount: counts.published,
          cachedPendingCount: counts.pending,
          cachedAt: now,
        },
      });

      details.push({
        id: collection.id,
        name: collection.name,
        matched: counts.matched,
        published: counts.published,
        pending: counts.pending,
      });
    }

    return NextResponse.json<ApiResponse<RefreshResponse>>({
      success: true,
      data: {
        refreshed: collections.length,
        message: `已刷新 ${collections.length} 个合集的缓存统计`,
        details,
      },
    });
  } catch (error) {
    console.error("刷新缓存统计失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "刷新缓存统计失败" },
      },
      { status: 500 }
    );
  }
}
