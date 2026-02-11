/**
 * 更新图片生成任务数据 API
 * PATCH - 更新步骤信息、提示词等
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// PATCH /api/admin/ai/image-tasks/[id]/update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { steps, prompts, shotPrompts } = body;

    const task = await prisma.imageGenTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // 更新步骤信息
    if (steps !== undefined) {
      updateData.steps = steps;
      updateData.totalSteps = steps.length;
    }

    // 更新步骤图提示词
    if (prompts !== undefined) {
      updateData.prompts = prompts;
      updateData.promptsDone = prompts.length;
    }

    // 更新成品图提示词
    if (shotPrompts !== undefined) {
      updateData.shotPrompts = shotPrompts;
    }

    await prisma.imageGenTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新任务失败:", error);
    return NextResponse.json(
      { error: "更新任务失败" },
      { status: 500 }
    );
  }
}
