/**
 * AI 生成任务 API
 *
 * GET  /api/admin/jobs/generate - 获取生成任务列表
 * POST /api/admin/jobs/generate - 创建生成任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/jobs/generate
 *
 * Query params:
 * - status: 任务状态 (pending/running/paused/completed/failed)
 * - collectionId: 按合集筛选
 * - limit: 返回数量限制
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const collectionId = searchParams.get("collectionId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (collectionId) where.collectionId = collectionId;

    const jobs = await prisma.generateJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // 获取关联的 Collection 信息
    const collectionIds = [...new Set(jobs.filter(j => j.collectionId).map(j => j.collectionId as string))];
    const collections = await prisma.collection.findMany({
      where: { id: { in: collectionIds } },
      select: { id: true, name: true, slug: true, type: true },
    });
    const collectionMap = new Map(collections.map(c => [c.id, c]));

    const formatted = jobs.map(job => ({
      id: job.id,
      sourceType: job.sourceType,
      collection: job.collectionId ? collectionMap.get(job.collectionId) : null,
      lockedTags: job.lockedTags,
      recipeNames: job.recipeNames,
      qualityLevel: job.qualityLevel,
      reviewMode: job.reviewMode,
      status: job.status,
      totalCount: job.totalCount,
      successCount: job.successCount,
      failedCount: job.failedCount,
      progress: job.totalCount > 0 ? Math.round((job.successCount + job.failedCount) / job.totalCount * 100) : 0,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("获取生成任务列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取生成任务列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs/generate
 *
 * Body: {
 *   sourceType: "collection" | "custom",
 *   collectionId?: string,
 *   lockedTags: { cuisineId?: string, locationId?: string, tagIds?: string[] },
 *   recipeNames: string[],
 *   qualityLevel?: "high" | "medium" | "low",
 *   reviewMode?: "ai_human" | "ai_only" | "human_only"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceType,
      collectionId,
      lockedTags,
      recipeNames,
      qualityLevel = "high",
      reviewMode = "ai_human",
    } = body;

    if (!sourceType || !recipeNames || recipeNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "sourceType 和 recipeNames 为必填项" },
        { status: 400 }
      );
    }

    if (sourceType === "collection" && !collectionId) {
      return NextResponse.json(
        { success: false, error: "合集模式需要提供 collectionId" },
        { status: 400 }
      );
    }

    // 验证 collection 存在
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
      });
      if (!collection) {
        return NextResponse.json(
          { success: false, error: "指定的合集不存在" },
          { status: 400 }
        );
      }
    }

    const job = await prisma.generateJob.create({
      data: {
        sourceType,
        collectionId: collectionId || null,
        lockedTags: lockedTags || {},
        recipeNames,
        qualityLevel,
        reviewMode,
        status: "pending",
        totalCount: recipeNames.length,
        successCount: 0,
        failedCount: 0,
        results: [],
      },
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: `已创建生成任务，共 ${recipeNames.length} 个菜谱待生成`,
    });
  } catch (error) {
    console.error("创建生成任务失败:", error);
    return NextResponse.json(
      { success: false, error: "创建生成任务失败" },
      { status: 500 }
    );
  }
}
