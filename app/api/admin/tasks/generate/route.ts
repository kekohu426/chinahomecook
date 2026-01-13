/**
 * GenerateJob (生成任务) API
 *
 * GET  /api/admin/tasks/generate - 获取任务列表
 * POST /api/admin/tasks/generate - 创建新任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

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
 * GET /api/admin/tasks/generate
 * 获取生成任务列表
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sourceType = searchParams.get("sourceType");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (sourceType) where.sourceType = sourceType;

    // 获取总数
    const total = await prisma.generateJob.count({ where });

    // 获取任务列表
    const jobs = await prisma.generateJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取关联的 Collection 名称
    const collectionIds = jobs
      .filter((j) => j.collectionId)
      .map((j) => j.collectionId as string);

    const collections = collectionIds.length > 0
      ? await prisma.collection.findMany({
          where: { id: { in: collectionIds } },
          select: { id: true, name: true },
        })
      : [];

    const collectionMap = new Map(collections.map((c) => [c.id, c.name]));

    // 格式化返回数据
    const jobsWithInfo = jobs.map((job) => ({
      id: job.id,
      sourceType: job.sourceType,
      collectionId: job.collectionId,
      collectionName: job.collectionId ? collectionMap.get(job.collectionId) : null,
      totalCount: job.totalCount,
      successCount: job.successCount,
      failedCount: job.failedCount,
      status: job.status,
      progress: Math.round(((job.successCount + job.failedCount) / job.totalCount) * 100),
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        jobs: jobsWithInfo,
      },
    });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tasks/generate
 * 创建新的生成任务
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const {
      sourceType = "manual",
      collectionId,
      lockedTags,
      suggestedTags,
      recipeNames = [],
      totalCount,
    } = body;

    // 验证必填字段
    if (!lockedTags || typeof totalCount !== "number" || totalCount < 1) {
      return NextResponse.json(
        { success: false, error: "lockedTags 和 totalCount 为必填项" },
        { status: 400 }
      );
    }

    // 如果是来自聚合页，验证聚合页存在
    if (sourceType === "collection" && collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
      });
      if (!collection) {
        return NextResponse.json(
          { success: false, error: "关联的聚合页不存在" },
          { status: 404 }
        );
      }
    }

    // 创建任务
    const job = await prisma.generateJob.create({
      data: {
        sourceType,
        collectionId: sourceType === "collection" ? collectionId : null,
        lockedTags,
        recipeNames,
        totalCount,
        status: "pending",
        successCount: 0,
        failedCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
