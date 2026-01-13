/**
 * 重试任务 API
 *
 * POST /api/admin/jobs/[id]/retry - 重试失败的任务项
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { retryGenerateJob, executeGenerateJobAsync } from "@/lib/ai/job-executor";

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
 * POST /api/admin/jobs/[id]/retry
 * 重试失败的任务项
 *
 * Body:
 * - autoStart?: boolean (是否自动开始新任务，默认 true)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    let autoStart = true;
    try {
      const body = await request.json();
      if (typeof body.autoStart === "boolean") {
        autoStart = body.autoStart;
      }
    } catch {
      // 没有 body 时使用默认值
    }

    const newJobId = await retryGenerateJob(id);

    if (!newJobId) {
      return NextResponse.json(
        { success: false, error: "无法重试任务（可能任务不存在、状态不允许或没有失败项）" },
        { status: 400 }
      );
    }

    // 自动开始新任务
    if (autoStart) {
      executeGenerateJobAsync(newJobId);
    }

    return NextResponse.json({
      success: true,
      message: "已创建重试任务",
      data: {
        newJobId,
        autoStarted: autoStart,
      },
    });
  } catch (error) {
    console.error("重试任务失败:", error);
    return NextResponse.json({ success: false, error: "重试失败" }, { status: 500 });
  }
}
