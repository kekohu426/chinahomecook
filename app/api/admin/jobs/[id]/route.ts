/**
 * GenerateJob 单个任务 API
 *
 * GET /api/admin/jobs/[id] - 获取任务详情
 * DELETE /api/admin/jobs/[id] - 删除任务
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/jobs/[id]
 * 获取任务详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const job = await prisma.generateJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 如果有 collectionId，获取聚合页名称
    let collectionName: string | null = null;
    if (job.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: job.collectionId },
        select: { name: true },
      });
      collectionName = collection?.name || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        collectionName,
      },
    });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/jobs/[id]
 * 删除任务（只能删除 pending/completed/failed/cancelled 状态的任务）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 不允许删除正在运行的任务
    if (job.status === "running") {
      return NextResponse.json(
        { success: false, error: "不能删除正在运行的任务" },
        { status: 400 }
      );
    }

    await prisma.generateJob.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除任务失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
