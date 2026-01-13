/**
 * AI 推荐菜名 API
 *
 * POST /api/admin/collections/[id]/ai/recommend
 * 根据合集规则推荐适合的菜名
 *
 * 请求体：
 * {
 *   count?: number,  // 推荐数量，默认 10
 *   style?: string   // 风格提示
 * }
 *
 * 响应：
 * {
 *   recommendations: Array<{ name, reason, confidence }>,
 *   collectionInfo: { name, type, currentCount, targetCount, gap },
 *   ruleDescription: string,
 *   source: "ai" | "fallback"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { buildRuleWhereClause, getRuleDescription } from "@/lib/collection/rule-engine";
import { recommendDishes, getFallbackRecommendations, type RecommendContext } from "@/lib/ai/recommend-dishes";
import type { RuleConfig } from "@/lib/types/collection";
import type { ApiResponse, ApiError } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface RecommendRequest {
  count?: number;
  style?: string;
}

interface RecommendResponse {
  recommendations: Array<{
    name: string;
    reason: string;
    confidence: number;
  }>;
  collectionInfo: {
    name: string;
    type: string;
    currentCount: number;
    targetCount: number;
    gap: number;
  };
  ruleDescription: string;
  source: "ai" | "fallback";
}

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
    const body: RecommendRequest = await request.json();
    const { count = 10, style } = body;

    // 限制推荐数量
    const limitedCount = Math.min(Math.max(1, count), 30);

    // 获取合集信息
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

    // 获取已有食谱标题（用于去重）
    const baseWhere = buildRuleWhereClause(collection.rules as unknown as RuleConfig, {
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
    });

    const existingRecipes = await prisma.recipe.findMany({
      where: baseWhere,
      select: { title: true },
    });

    const existingTitles = existingRecipes.map((r) => r.title);

    // 获取规则描述
    const ruleDescription = getRuleDescription(collection.rules as unknown as RuleConfig);

    // 构建推荐上下文
    const recommendContext: RecommendContext = {
      collectionName: collection.name,
      collectionType: collection.type,
      cuisineName: collection.cuisine?.name,
      locationName: collection.location?.name,
      tagName: collection.tag?.name,
      description: collection.description || undefined,
      existingTitles,
      style,
    };

    // 尝试使用 AI 推荐
    let recommendations = await recommendDishes(recommendContext, limitedCount);
    let source: "ai" | "fallback" = "ai";

    // 如果 AI 推荐失败或返回空，使用备选方案
    if (recommendations.length === 0) {
      console.log(`[Recommend] AI 推荐为空，使用备选方案`);
      recommendations = getFallbackRecommendations(recommendContext, limitedCount);
      source = "fallback";
    }

    // 计算缺口
    const publishedCount = await prisma.recipe.count({
      where: { ...baseWhere, status: "published" },
    });
    const gap = Math.max(0, collection.targetCount - publishedCount);

    return NextResponse.json<ApiResponse<RecommendResponse>>({
      success: true,
      data: {
        recommendations,
        collectionInfo: {
          name: collection.name,
          type: collection.type,
          currentCount: publishedCount,
          targetCount: collection.targetCount,
          gap,
        },
        ruleDescription,
        source,
      },
    });
  } catch (error) {
    console.error("AI 推荐失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "AI 推荐失败" },
      },
      { status: 500 }
    );
  }
}
