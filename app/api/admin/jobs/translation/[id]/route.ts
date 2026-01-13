/**
 * 单个翻译任务 API
 *
 * GET    /api/admin/jobs/translation/[id] - 获取任务详情
 * PUT    /api/admin/jobs/translation/[id] - 更新任务（start/retry/cancel/prioritize）
 * DELETE /api/admin/jobs/translation/[id] - 删除任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  executeTranslationJob,
  executeTranslationJobAsync,
} from "@/lib/ai/translation-job-executor";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/jobs/translation/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const job = await prisma.translationJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务详情失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/jobs/translation/[id]
 *
 * Body: { action: "start" | "start_async" | "retry" | "cancel" | "prioritize", priority?: number }
 *
 * Actions:
 * - start: 同步执行翻译任务（等待完成）
 * - start_async: 异步执行翻译任务（立即返回）
 * - retry: 重试失败的任务
 * - cancel: 取消任务
 * - prioritize: 修改优先级
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, priority } = body;

    const job = await prisma.translationJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 处理启动任务（同步）
    if (action === "start") {
      if (job.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "只有待处理的任务可以启动" },
          { status: 400 }
        );
      }

      const result = await executeTranslationJob(id);
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success ? "翻译完成" : result.error,
      });
    }

    // 处理启动任务（异步）
    if (action === "start_async") {
      if (job.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "只有待处理的任务可以启动" },
          { status: 400 }
        );
      }

      executeTranslationJobAsync(id);
      return NextResponse.json({
        success: true,
        message: "翻译任务已在后台启动",
      });
    }

    const updateData: Record<string, unknown> = {};

    switch (action) {
      case "retry":
        if (job.status !== "failed") {
          return NextResponse.json(
            { success: false, error: "只有失败的任务可以重试" },
            { status: 400 }
          );
        }
        updateData.status = "pending";
        updateData.errorMessage = null;
        updateData.completedAt = null;
        // 不增加 retryCount，保留历史记录
        break;

      case "cancel":
        if (job.status === "completed") {
          return NextResponse.json(
            { success: false, error: "已完成的任务无法取消" },
            { status: 400 }
          );
        }
        updateData.status = "cancelled";
        updateData.errorMessage = "用户取消";
        updateData.completedAt = new Date();
        break;

      case "prioritize":
        if (priority === undefined || priority < 1 || priority > 10) {
          return NextResponse.json(
            { success: false, error: "优先级必须在 1-10 之间" },
            { status: 400 }
          );
        }
        updateData.priority = priority;
        break;

      default:
        return NextResponse.json(
          { success: false, error: "未知操作，支持: start, start_async, retry, cancel, prioritize" },
          { status: 400 }
        );
    }

    const updated = await prisma.translationJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("更新任务失败:", error);
    return NextResponse.json(
      { success: false, error: "更新任务失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/jobs/translation/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const job = await prisma.translationJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    if (job.status === "processing") {
      return NextResponse.json(
        { success: false, error: "处理中的任务无法删除" },
        { status: 400 }
      );
    }

    await prisma.translationJob.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "任务已删除",
    });
  } catch (error) {
    console.error("删除任务失败:", error);
    return NextResponse.json(
      { success: false, error: "删除任务失败" },
      { status: 500 }
    );
  }
}
