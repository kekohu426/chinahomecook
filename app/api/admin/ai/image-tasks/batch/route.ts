/**
 * 批量操作图片生成任务 API
 * POST - 批量执行任务
 */

import { NextRequest, NextResponse } from "next/server";
import {
  executeImageTask,
  executePromptsOnly,
  retryFailedImages,
} from "@/lib/ai/image-task-executor";
import { requireAdmin } from "@/lib/auth/guard";

// POST /api/admin/ai/image-tasks/batch
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { taskIds, action = "full" } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "缺少 taskIds 数组" },
        { status: 400 }
      );
    }

    // 限制批量操作数量
    if (taskIds.length > 20) {
      return NextResponse.json(
        { error: "单次最多处理 20 个任务" },
        { status: 400 }
      );
    }

    // 根据 action 批量执行
    const executeAction = async (taskId: string) => {
      switch (action) {
        case "prompts":
          return executePromptsOnly(taskId);
        case "retry":
          return retryFailedImages(taskId);
        case "full":
        default:
          return executeImageTask(taskId);
      }
    };

    // 异步执行所有任务（不等待完成）
    for (const taskId of taskIds) {
      executeAction(taskId).catch((e) =>
        console.error(`批量执行任务 ${taskId} 失败:`, e)
      );
    }

    return NextResponse.json({
      success: true,
      message: `已开始执行 ${taskIds.length} 个任务 (action: ${action})`,
      taskIds,
    });
  } catch (error) {
    console.error("批量执行任务失败:", error);
    return NextResponse.json(
      { error: "批量执行任务失败" },
      { status: 500 }
    );
  }
}
