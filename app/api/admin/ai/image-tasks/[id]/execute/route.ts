/**
 * 执行图片生成任务 API
 * POST - 执行任务（生成提示词和/或图片）
 */

import { NextRequest, NextResponse } from "next/server";
import {
  executeImageTask,
  executePromptsOnly,
  executeImagesOnly,
  retryFailedImages,
  applyImagesToRecipe,
} from "@/lib/ai/image-task-executor";
import { requireAdmin } from "@/lib/auth/guard";

// POST /api/admin/ai/image-tasks/[id]/execute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { action = "full" } = body;

    // 根据 action 执行不同操作
    switch (action) {
      case "prompts":
        // 仅生成提示词
        executePromptsOnly(id).catch((e) => console.error("提示词生成失败:", e));
        break;

      case "images":
        // 仅生成图片（需要已有提示词）
        executeImagesOnly(id).catch((e) => console.error("图片生成失败:", e));
        break;

      case "retry":
        // 重试失败的图片
        retryFailedImages(id).catch((e) => console.error("重试失败:", e));
        break;

      case "apply":
        // 应用图片到食谱
        const result = await applyImagesToRecipe(id);
        return NextResponse.json(result);

      case "full":
      default:
        // 完整执行：生成提示词 + 生成图片
        executeImageTask(id).catch((e) => console.error("任务执行失败:", e));
        break;
    }

    return NextResponse.json({
      success: true,
      message: `任务已开始执行 (action: ${action})`,
    });
  } catch (error) {
    console.error("执行任务失败:", error);
    return NextResponse.json(
      { error: "执行任务失败" },
      { status: 500 }
    );
  }
}
