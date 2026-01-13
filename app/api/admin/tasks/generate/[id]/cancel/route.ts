/**
 * GenerateJob 取消 API
 *
 * POST /api/admin/tasks/generate/[id]/cancel - 取消任务
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
 * POST /api/admin/tasks/generate/[id]/cancel
 * 取消任务
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

    // 只能取消 pending 或 running 状态的任务
    if (job.status !== "pending" && job.status !== "running") {
      return NextResponse.json(
        { success: false, error: `任务状态为 ${job.status}，无法取消` },
        { status: 400 }
      );
    }

    // 更新状态为取消
    const updated = await prisma.generateJob.update({
      where: { id },
      data: {
        status: "cancelled",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "任务已取消",
    });
  } catch (error) {
    console.error("取消任务失败:", error);
    return NextResponse.json({ success: false, error: "取消失败" }, { status: 500 });
  }
}
