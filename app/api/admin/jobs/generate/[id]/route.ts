/**
 * 单个生成任务 API
 *
 * GET    /api/admin/jobs/generate/[id] - 获取任务详情
 * PUT    /api/admin/jobs/generate/[id] - 更新任务状态
 * DELETE /api/admin/jobs/generate/[id] - 删除任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/jobs/generate/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const job = await prisma.generateJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 获取关联的 Collection
    let collection = null;
    if (job.collectionId) {
      collection = await prisma.collection.findUnique({
        where: { id: job.collectionId },
        select: { id: true, name: true, slug: true, type: true },
      });
    }

    // 获取生成的菜谱
    const generatedRecipes = await prisma.recipe.findMany({
      where: { generateJobId: job.id },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        status: true,
        reviewStatus: true,
        qualityScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        sourceType: job.sourceType,
        collection,
        lockedTags: job.lockedTags,
        recipeNames: job.recipeNames,
        qualityLevel: job.qualityLevel,
        reviewMode: job.reviewMode,
        status: job.status,
        totalCount: job.totalCount,
        successCount: job.successCount,
        failedCount: job.failedCount,
        progress: job.totalCount > 0 ? Math.round((job.successCount + job.failedCount) / job.totalCount * 100) : 0,
        results: job.results,
        errorMessage: job.errorMessage,
        generatedRecipes,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
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
 * PUT /api/admin/jobs/generate/[id]
 *
 * Body: { action: "start" | "pause" | "resume" | "cancel" }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    const job = await prisma.generateJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    let newStatus: string;
    const updateData: Record<string, unknown> = {};

    switch (action) {
      case "start":
        if (job.status !== "pending") {
          return NextResponse.json(
            { success: false, error: "只有待处理任务可以启动" },
            { status: 400 }
          );
        }
        newStatus = "running";
        updateData.startedAt = new Date();
        break;

      case "pause":
        if (job.status !== "running") {
          return NextResponse.json(
            { success: false, error: "只有运行中任务可以暂停" },
            { status: 400 }
          );
        }
        newStatus = "paused";
        break;

      case "resume":
        if (job.status !== "paused") {
          return NextResponse.json(
            { success: false, error: "只有已暂停任务可以恢复" },
            { status: 400 }
          );
        }
        newStatus = "running";
        break;

      case "cancel":
        if (job.status === "completed" || job.status === "failed") {
          return NextResponse.json(
            { success: false, error: "已完成或失败的任务无法取消" },
            { status: 400 }
          );
        }
        newStatus = "failed";
        updateData.errorMessage = "用户取消";
        updateData.completedAt = new Date();
        break;

      default:
        return NextResponse.json(
          { success: false, error: "未知操作" },
          { status: 400 }
        );
    }

    const updated = await prisma.generateJob.update({
      where: { id },
      data: { status: newStatus, ...updateData },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `任务已${action === "start" ? "启动" : action === "pause" ? "暂停" : action === "resume" ? "恢复" : "取消"}`,
    });
  } catch (error) {
    console.error("更新任务状态失败:", error);
    return NextResponse.json(
      { success: false, error: "更新任务状态失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/jobs/generate/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const job = await prisma.generateJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    if (job.status === "running") {
      return NextResponse.json(
        { success: false, error: "运行中的任务无法删除，请先暂停或取消" },
        { status: 400 }
      );
    }

    await prisma.generateJob.delete({ where: { id } });

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
