/**
 * 单个图片生成任务 API
 * GET    - 获取任务详情
 * DELETE - 删除任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// GET /api/admin/ai/image-tasks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const task = await prisma.imageGenTask.findUnique({
      where: { id },
      include: {
        recipe: {
          select: { id: true, slug: true, title: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return NextResponse.json(
      { error: "获取任务详情失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ai/image-tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    await prisma.imageGenTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除任务失败:", error);
    return NextResponse.json(
      { error: "删除任务失败" },
      { status: 500 }
    );
  }
}
