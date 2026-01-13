/**
 * 启动任务 API
 *
 * POST /api/admin/jobs/[id]/start - 启动一个待执行的任务
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/jobs/[id]/start
 * 启动任务
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const job = await prisma.generateJob.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 只有 pending 状态的任务可以启动
    if (job.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `无法启动 ${job.status} 状态的任务` },
        { status: 400 }
      );
    }

    // 异步执行任务
    executeGenerateJobAsync(id);

    return NextResponse.json({
      success: true,
      message: "任务已开始执行",
    });
  } catch (error) {
    console.error("启动任务失败:", error);
    return NextResponse.json({ success: false, error: "启动失败" }, { status: 500 });
  }
}
