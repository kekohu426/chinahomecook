/**
 * 审核工作台 API
 *
 * GET  /api/admin/review - 获取待审核菜谱列表
 * POST /api/admin/review - 批量审核操作
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/review
 *
 * Query params:
 * - quality: 质量等级筛选 (high/medium/low)
 * - sort: 排序方式 (createdAt/qualityScore)
 * - order: 排序顺序 (asc/desc)
 * - limit: 返回数量
 * - offset: 偏移量
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quality = searchParams.get("quality");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 基础条件：待审核状态
    const where: Record<string, unknown> = {
      reviewStatus: "pending",
    };

    // 质量筛选（基于 qualityScore JSON 字段）
    // 暂时不实现复杂的 JSON 查询，前端可以做筛选

    // 排序
    const orderBy: Record<string, string> = {};
    orderBy[sort] = order;

    // 获取待审核菜谱
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          cuisine: { select: { id: true, name: true, slug: true } },
          location: { select: { id: true, name: true, slug: true } },
          collection: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    // 格式化数据
    const formatted = recipes.map((recipe) => {
      const qualityScore = recipe.qualityScore as Record<string, number> | null;
      const overallScore = qualityScore
        ? Object.values(qualityScore).reduce((a, b) => a + b, 0) / Object.keys(qualityScore).length
        : null;

      let qualityLevel = "medium";
      if (overallScore !== null) {
        if (overallScore >= 0.9) qualityLevel = "high";
        else if (overallScore < 0.7) qualityLevel = "low";
      }

      return {
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        coverImage: recipe.coverImage,
        description: recipe.description,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        location: recipe.location,
        collection: recipe.collection,
        aiGenerated: recipe.aiGenerated,
        qualityScore,
        overallScore,
        qualityLevel,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      };
    });

    // 统计各质量等级数量
    const allPending = await prisma.recipe.findMany({
      where: { reviewStatus: "pending" },
      select: { qualityScore: true },
    });

    const stats = {
      total,
      high: 0,
      medium: 0,
      low: 0,
    };

    allPending.forEach((r) => {
      const qs = r.qualityScore as Record<string, number> | null;
      if (qs) {
        const avg = Object.values(qs).reduce((a, b) => a + b, 0) / Object.keys(qs).length;
        if (avg >= 0.9) stats.high++;
        else if (avg < 0.7) stats.low++;
        else stats.medium++;
      } else {
        stats.medium++;
      }
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats,
    });
  } catch (error) {
    console.error("获取待审核列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取待审核列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/review
 *
 * Body: {
 *   action: "approve" | "reject" | "batch_approve" | "batch_reject",
 *   recipeId?: string,          // 单个操作时
 *   recipeIds?: string[],       // 批量操作时
 *   note?: string,              // 审核备注
 *   autoTranslate?: boolean     // 通过后是否自动创建翻译任务
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, recipeId, recipeIds, note, autoTranslate = true } = body;

    // 单个审核
    if (action === "approve" || action === "reject") {
      if (!recipeId) {
        return NextResponse.json(
          { success: false, error: "recipeId 为必填项" },
          { status: 400 }
        );
      }

      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
      if (!recipe) {
        return NextResponse.json(
          { success: false, error: "菜谱不存在" },
          { status: 404 }
        );
      }

      if (recipe.reviewStatus !== "pending") {
        return NextResponse.json(
          { success: false, error: "该菜谱已被审核" },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
        reviewStatus: action === "approve" ? "approved" : "rejected",
        reviewedAt: new Date(),
        reviewNote: note || null,
      };

      // 通过后自动发布
      if (action === "approve") {
        updateData.status = "published";
        updateData.publishedAt = new Date();
      }

      const updated = await prisma.recipe.update({
        where: { id: recipeId },
        data: updateData,
      });

      // 如果通过且需要自动翻译
      if (action === "approve" && autoTranslate) {
        await prisma.translationJob.create({
          data: {
            entityType: "recipe",
            entityId: recipeId,
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
        data: updated,
        message: action === "approve" ? "已通过并发布" : "已拒绝",
      });
    }

    // 批量审核
    if (action === "batch_approve" || action === "batch_reject") {
      if (!recipeIds || recipeIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "recipeIds 为必填项" },
          { status: 400 }
        );
      }

      const isApprove = action === "batch_approve";

      const updateData: Record<string, unknown> = {
        reviewStatus: isApprove ? "approved" : "rejected",
        reviewedAt: new Date(),
        reviewNote: note || null,
      };

      if (isApprove) {
        updateData.status = "published";
        updateData.publishedAt = new Date();
      }

      const result = await prisma.recipe.updateMany({
        where: {
          id: { in: recipeIds },
          reviewStatus: "pending",
        },
        data: updateData,
      });

      // 如果通过且需要自动翻译
      if (isApprove && autoTranslate) {
        await prisma.translationJob.createMany({
          data: recipeIds.map((id: string) => ({
            entityType: "recipe",
            entityId: id,
            targetLang: "en",
            priority: 5,
            status: "pending",
            retryCount: 0,
            maxRetries: 3,
          })),
          skipDuplicates: true,
        });
      }

      return NextResponse.json({
        success: true,
        data: { count: result.count },
        message: `已${isApprove ? "批量通过" : "批量拒绝"} ${result.count} 个菜谱`,
      });
    }

    return NextResponse.json(
      { success: false, error: "未知操作" },
      { status: 400 }
    );
  } catch (error) {
    console.error("审核操作失败:", error);
    return NextResponse.json(
      { success: false, error: "审核操作失败" },
      { status: 500 }
    );
  }
}
