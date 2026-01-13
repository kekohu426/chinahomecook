/**
 * 翻译任务 API
 *
 * GET  /api/admin/jobs/translation - 获取翻译任务列表
 * POST /api/admin/jobs/translation - 创建翻译任务
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/jobs/translation
 *
 * Query params:
 * - status: 任务状态 (pending/processing/completed/failed)
 * - entityType: 实体类型 (recipe/collection/cuisine/location/tag/ingredient)
 * - targetLang: 目标语言
 * - limit: 返回数量限制
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const entityType = searchParams.get("entityType");
    const targetLang = searchParams.get("targetLang");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (targetLang) where.targetLang = targetLang;

    const jobs = await prisma.translationJob.findMany({
      where,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    // 获取实体名称
    const formattedJobs = await Promise.all(
      jobs.map(async (job) => {
        let entityName = "";
        try {
          switch (job.entityType) {
            case "recipe": {
              const recipe = await prisma.recipe.findUnique({
                where: { id: job.entityId },
                select: { title: true },
              });
              entityName = recipe?.title || "未知菜谱";
              break;
            }
            case "collection": {
              const collection = await prisma.collection.findUnique({
                where: { id: job.entityId },
                select: { name: true },
              });
              entityName = collection?.name || "未知合集";
              break;
            }
            case "cuisine": {
              const cuisine = await prisma.cuisine.findUnique({
                where: { id: job.entityId },
                select: { name: true },
              });
              entityName = cuisine?.name || "未知菜系";
              break;
            }
            case "location": {
              const location = await prisma.location.findUnique({
                where: { id: job.entityId },
                select: { name: true },
              });
              entityName = location?.name || "未知地域";
              break;
            }
            case "tag": {
              const tag = await prisma.tag.findUnique({
                where: { id: job.entityId },
                select: { name: true },
              });
              entityName = tag?.name || "未知标签";
              break;
            }
            case "ingredient": {
              const ingredient = await prisma.ingredient.findUnique({
                where: { id: job.entityId },
                select: { name: true },
              });
              entityName = ingredient?.name || "未知食材";
              break;
            }
          }
        } catch {
          entityName = "未知";
        }

        return {
          id: job.id,
          entityType: job.entityType,
          entityId: job.entityId,
          entityName,
          targetLang: job.targetLang,
          status: job.status,
          priority: job.priority,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          qualityScore: job.qualityScore ? Number(job.qualityScore) : null,
          errorMessage: job.errorMessage,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedJobs,
    });
  } catch (error) {
    console.error("获取翻译任务列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取翻译任务列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs/translation
 *
 * Body: {
 *   entityType: "recipe" | "collection" | "cuisine" | "location" | "tag" | "ingredient",
 *   entityId: string,
 *   targetLang: string,
 *   priority?: number (1-10, default 5)
 * }
 *
 * Or batch mode:
 * {
 *   batch: true,
 *   entityType: string,
 *   entityIds: string[],
 *   targetLang: string,
 *   priority?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 批量模式
    if (body.batch) {
      const { entityType, entityIds, targetLang, priority = 5 } = body;

      if (!entityType || !entityIds || entityIds.length === 0 || !targetLang) {
        return NextResponse.json(
          { success: false, error: "entityType, entityIds, targetLang 为必填项" },
          { status: 400 }
        );
      }

      // 检查是否已存在相同任务
      const existingJobs = await prisma.translationJob.findMany({
        where: {
          entityType,
          entityId: { in: entityIds },
          targetLang,
          status: { in: ["pending", "processing"] },
        },
        select: { entityId: true },
      });
      const existingIds = new Set(existingJobs.map((j) => j.entityId));

      // 只创建不存在的任务
      const newEntityIds = entityIds.filter((id: string) => !existingIds.has(id));

      if (newEntityIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "所有任务已存在，无需重复创建",
        });
      }

      const jobs = await prisma.translationJob.createMany({
        data: newEntityIds.map((entityId: string) => ({
          entityType,
          entityId,
          targetLang,
          priority,
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
        })),
      });

      return NextResponse.json({
        success: true,
        data: { count: jobs.count },
        message: `已创建 ${jobs.count} 个翻译任务`,
        skipped: entityIds.length - newEntityIds.length,
      });
    }

    // 单个任务模式
    const { entityType, entityId, targetLang, priority = 5 } = body;

    if (!entityType || !entityId || !targetLang) {
      return NextResponse.json(
        { success: false, error: "entityType, entityId, targetLang 为必填项" },
        { status: 400 }
      );
    }

    // 检查是否已存在相同任务
    const existing = await prisma.translationJob.findFirst({
      where: {
        entityType,
        entityId,
        targetLang,
        status: { in: ["pending", "processing"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: "任务已存在",
      });
    }

    const job = await prisma.translationJob.create({
      data: {
        entityType,
        entityId,
        targetLang,
        priority,
        status: "pending",
        retryCount: 0,
        maxRetries: 3,
      },
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: "翻译任务已创建",
    });
  } catch (error) {
    console.error("创建翻译任务失败:", error);
    return NextResponse.json(
      { success: false, error: "创建翻译任务失败" },
      { status: 500 }
    );
  }
}
