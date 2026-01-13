/**
 * GenerateJob 重试 API
 *
 * POST /api/admin/tasks/generate/[id]/retry - 重试失败的任务
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
 * POST /api/admin/tasks/generate/[id]/retry
 * 重试失败的任务（重置失败计数，重新执行）
 */
export async function POST(
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

    // 只能重试 failed 或 cancelled 状态的任务
    if (job.status !== "failed" && job.status !== "cancelled") {
      return NextResponse.json(
        { success: false, error: `任务状态为 ${job.status}，无法重试` },
        { status: 400 }
      );
    }

    // 解析之前的结果，获取失败的食谱名称
    const previousResults = (job.results as Array<{
      name: string;
      status: string;
      recipeId?: string;
      error?: string;
    }>) || [];

    const failedNames = previousResults
      .filter((r) => r.status === "failed")
      .map((r) => r.name);

    // 如果没有失败的任务，保留原有的食谱名称
    const retryNames = failedNames.length > 0 ? failedNames : job.recipeNames;

    // 创建新任务（复制原任务参数）
    const newJob = await prisma.generateJob.create({
      data: {
        sourceType: job.sourceType,
        collectionId: job.collectionId,
        lockedTags: job.lockedTags as object,
        recipeNames: retryNames,
        totalCount: retryNames.length,
        status: "pending",
        successCount: 0,
        failedCount: 0,
      },
    });

    // 标记原任务为已重试
    await prisma.generateJob.update({
      where: { id },
      data: {
        // 在 results 中记录重试信息
        results: {
          ...(job.results as object || {}),
          retriedAt: new Date().toISOString(),
          retriedJobId: newJob.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newJob,
      message: `已创建重试任务，共 ${retryNames.length} 个待生成`,
    });
  } catch (error) {
    console.error("重试任务失败:", error);
    return NextResponse.json({ success: false, error: "重试失败" }, { status: 500 });
  }
}
