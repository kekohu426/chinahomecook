/**
 * GenerateJob 详情 API
 *
 * GET /api/admin/tasks/generate/[id] - 获取任务详情
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
 * GET /api/admin/tasks/generate/[id]
 * 获取任务详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const job = await prisma.generateJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 获取关联的 Collection 名称
    let collectionName = null;
    if (job.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: job.collectionId },
        select: { name: true },
      });
      collectionName = collection?.name;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        sourceType: job.sourceType,
        collectionId: job.collectionId,
        collectionName,
        lockedTags: job.lockedTags,
        recipeNames: job.recipeNames,
        totalCount: job.totalCount,
        successCount: job.successCount,
        failedCount: job.failedCount,
        status: job.status,
        results: job.results,
        progress: Math.round(((job.successCount + job.failedCount) / job.totalCount) * 100),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}
