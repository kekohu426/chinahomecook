/**
 * 取消任务 API
 *
 * POST /api/admin/jobs/[id]/cancel - 取消一个正在执行或待执行的任务
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelGenerateJob } from "@/lib/ai/job-executor";

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
 * POST /api/admin/jobs/[id]/cancel
 * 取消任务
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const cancelled = await cancelGenerateJob(id);

    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: "无法取消任务（可能任务不存在或状态不允许取消）" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "任务已取消",
    });
  } catch (error) {
    console.error("取消任务失败:", error);
    return NextResponse.json({ success: false, error: "取消失败" }, { status: 500 });
  }
}
