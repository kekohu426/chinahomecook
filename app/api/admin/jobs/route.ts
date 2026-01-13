/**
 * GenerateJob 管理 API
 *
 * GET /api/admin/jobs - 获取任务列表
 * POST /api/admin/jobs - 创建新任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { executeGenerateJobAsync } from "@/lib/ai/job-executor";

// 权限验证
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  }
  return null;
}

/**
 * GET /api/admin/jobs
 * 获取任务列表
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * - status: 状态筛选（pending/running/completed/partial/failed/cancelled）
 * - sourceType: 来源类型筛选（collection/manual）
 * - collectionId: 聚合页ID筛选
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const sourceType = searchParams.get("sourceType");
    const collectionId = searchParams.get("collectionId");

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (sourceType) where.sourceType = sourceType;
    if (collectionId) where.collectionId = collectionId;

    // 获取总数
    const total = await prisma.generateJob.count({ where });

    // 获取列表
    const jobs = await prisma.generateJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取状态统计
    const statusCounts = await prisma.generateJob.groupBy({
      by: ["status"],
      _count: true,
    });

    const stats: Record<string, number> = {};
    for (const item of statusCounts) {
      stats[item.status] = item._count;
    }

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats,
        items: jobs.map((job) => ({
          id: job.id,
          sourceType: job.sourceType,
          collectionId: job.collectionId,
          totalCount: job.totalCount,
          successCount: job.successCount,
          failedCount: job.failedCount,
          status: job.status,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        })),
      },
    });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/jobs
 * 创建新任务
 *
 * Body:
 * - sourceType: "collection" | "manual"
 * - collectionId?: string (sourceType="collection" 时必填)
 * - lockedTags: { cuisine?, location?, scene?, method?, ... }
 * - suggestedTags?: { taste?, crowd?, occasion?, ... }
 * - recipeNames?: string[] (指定菜名，可选)
 * - totalCount: number (生成数量)
 * - autoStart?: boolean (是否自动开始，默认 false)
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const {
      sourceType,
      collectionId,
      lockedTags = {},
      suggestedTags = null,
      recipeNames = [],
      totalCount,
      autoStart = false,
    } = body;

    // 参数验证
    if (!sourceType || !["collection", "manual"].includes(sourceType)) {
      return NextResponse.json(
        { success: false, error: "sourceType 必须是 collection 或 manual" },
        { status: 400 }
      );
    }

    if (sourceType === "collection" && !collectionId) {
      return NextResponse.json(
        { success: false, error: "collection 类型任务必须指定 collectionId" },
        { status: 400 }
      );
    }

    if (!totalCount || totalCount < 1 || totalCount > 100) {
      return NextResponse.json(
        { success: false, error: "totalCount 必须在 1-100 之间" },
        { status: 400 }
      );
    }

    // 创建任务
    const job = await prisma.generateJob.create({
      data: {
        sourceType,
        collectionId: collectionId || null,
        lockedTags,
        recipeNames,
        totalCount,
        status: "pending",
      },
    });

    // 自动开始
    if (autoStart) {
      executeGenerateJobAsync(job.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        sourceType: job.sourceType,
        collectionId: job.collectionId,
        totalCount: job.totalCount,
        status: job.status,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
