/**
 * AI 批量生成食谱 API（异步 Job 版本）
 *
 * POST /api/admin/collections/[id]/ai/generate
 * 创建异步生成任务
 *
 * 请求体：
 * {
 *   dishNames: string[],           // 要生成的菜名列表（最多 50 个）
 *   reviewMode?: "manual" | "auto", // manual: pending 状态; auto: published 状态
 * }
 *
 * 响应：
 * {
 *   jobId: string,
 *   status: "pending",
 *   totalCount: number,
 *   message: string
 * }
 *
 * 使用 GenerateJob 表持久化任务状态，支持：
 * - 异步执行（不阻塞请求）
 * - 进度查询
 * - 任务取消
 * - 失败重试
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { executeGenerateJobAsync } from "@/lib/ai/job-executor";
import type { ApiResponse, ApiError } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface GenerateRequest {
  dishNames: string[];
  reviewMode?: "manual" | "auto";
}

interface GenerateResponse {
  jobId: string;
  status: "pending";
  totalCount: number;
  message: string;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body: GenerateRequest = await request.json();
    const { dishNames, reviewMode = "manual" } = body;

    // 验证参数
    if (!dishNames || !Array.isArray(dishNames) || dishNames.length === 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "dishNames 不能为空" },
        },
        { status: 400 }
      );
    }

    // 限制单次生成数量
    if (dishNames.length > 50) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "单次最多生成 50 个食谱" },
        },
        { status: 400 }
      );
    }

    // 获取合集信息
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        cuisine: true,
        location: true,
      },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // 检查是否有正在运行的任务
    const runningJob = await prisma.generateJob.findFirst({
      where: {
        collectionId: id,
        status: { in: ["pending", "running"] },
      },
    });

    if (runningJob) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `该合集已有正在执行的任务 (${runningJob.id})，请等待完成或取消后再试`,
          },
        },
        { status: 409 }
      );
    }

    // 检查重复（标题完全相同）
    const existingRecipes = await prisma.recipe.findMany({
      where: { title: { in: dishNames } },
      select: { title: true },
    });
    const existingTitles = new Set(existingRecipes.map((r) => r.title));

    // 过滤掉已存在的菜名
    const uniqueDishNames = dishNames.filter((name) => !existingTitles.has(name));
    const duplicateCount = dishNames.length - uniqueDishNames.length;

    if (uniqueDishNames.length === 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `所有菜名都已存在（${duplicateCount} 个重复）`,
          },
        },
        { status: 400 }
      );
    }

    // 创建生成任务
    const job = await prisma.generateJob.create({
      data: {
        sourceType: "collection",
        collectionId: id,
        recipeNames: uniqueDishNames,
        totalCount: uniqueDishNames.length,
        status: "pending",
        lockedTags: {
          cuisine: collection.cuisine?.slug,
          location: collection.location?.slug,
          reviewMode,
        },
      },
    });

    // 异步执行任务（不等待完成）
    executeGenerateJobAsync(job.id);

    // 构建响应消息
    let message = `已创建生成任务，共 ${uniqueDishNames.length} 个菜谱`;
    if (duplicateCount > 0) {
      message += `（跳过 ${duplicateCount} 个重复）`;
    }

    return NextResponse.json<ApiResponse<GenerateResponse>>({
      success: true,
      data: {
        jobId: job.id,
        status: "pending",
        totalCount: uniqueDishNames.length,
        message,
      },
    });
  } catch (error) {
    console.error("创建生成任务失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "创建生成任务失败" },
      },
      { status: 500 }
    );
  }
}
