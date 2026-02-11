/**
 * AI 生成会话列表 API
 *
 * GET /api/v1/ai-generation-logs/sessions - 查询会话列表
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 鉴权：仅管理员可查看
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // 分页参数
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const skip = (page - 1) * pageSize;

    // 筛选参数
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const EXCLUDED_STEP_NAMES = ["import_start", "import_validation", "import_create"];

    // 构建查询条件
    const where: any = {
      stepName: { notIn: EXCLUDED_STEP_NAMES },
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    // 按 sessionId 分组查询
    const sessions = await prisma.aIGenerationLog.groupBy({
      by: ["sessionId"],
      where,
      _count: { id: true },
      _min: { timestamp: true },
      _max: { timestamp: true },
      orderBy: { _min: { timestamp: "desc" } },
      skip,
      take: pageSize,
    });

    // 步骤名称到可读任务名称的映射
    const stepNameToTaskName: Record<string, string> = {
      text_generation: "食谱生成",
      recipe_generate: "食谱生成",
      step_image_gen: "步骤图生成",
      cover_image_gen: "封面图生成",
      prompt_generation: "提示词生成",
      translation: "内容翻译",
      blog_generate: "博客生成",
      blog_generate_full: "博客一键生成",
      recommend_dishes: "菜品推荐",
      import_start: "批量导入",
      import_validation: "批量导入",
      import_create: "批量导入",
    };

    // 获取每个会话的详细信息
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (s) => {
        const logs = await prisma.aIGenerationLog.findMany({
          where: { sessionId: s.sessionId },
          orderBy: { timestamp: "asc" },
          select: {
            id: true,
            stepName: true,
            modelName: true,
            status: true,
            durationMs: true,
            recipeId: true,
            jobId: true,
            errorMessage: true,
            resultText: true,
            resultImages: true,
            metadata: true,
            parameters: true,
          },
        });

        const totalDuration = logs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
        const hasError = logs.some((log) => log.status === "failed");
        const recipeId = logs.find((log) => log.recipeId)?.recipeId;
        const jobId = logs.find((log) => log.jobId)?.jobId;

        // 计算内容类型和预览信息
        let hasText = false;
        let hasImages = false;
        let previewText: string | undefined;
        let previewImages: string[] = [];
        let finalStepName: string | undefined;

        // 从最后一个成功的步骤中获取预览信息
        for (let i = logs.length - 1; i >= 0; i--) {
          const log = logs[i];
          if (log.status === "success") {
            if (log.resultText && !previewText) {
              hasText = true;
              previewText = log.resultText.substring(0, 200);
              finalStepName = log.stepName;
            }
            if (log.resultImages && log.resultImages.length > 0 && previewImages.length === 0) {
              hasImages = true;
              previewImages = log.resultImages.slice(0, 3);
              if (!finalStepName) finalStepName = log.stepName;
            }
            if (previewText && previewImages.length > 0) break;
          }
        }

        // 确定内容类型
        let contentType: "text" | "image" | "mixed" = "text";
        if (hasText && hasImages) {
          contentType = "mixed";
        } else if (hasImages) {
          contentType = "image";
        }

        // 生成可读的任务名称
        const firstLog = logs[0];
        const firstStep = firstLog?.stepName || "";
        const metadata = firstLog?.metadata as Record<string, unknown> | null;
        const parameters = firstLog?.parameters as Record<string, unknown> | null;

        // 提取业务名称（菜名、博客标题等）
        let businessName = "";

        // 优先从 metadata 获取
        if (metadata?.dishName) {
          businessName = metadata.dishName as string;
        } else if (metadata?.recipeName) {
          businessName = metadata.recipeName as string;
        } else if (metadata?.title) {
          businessName = metadata.title as string;
        }

        // 其次从 parameters 获取
        if (!businessName && parameters?.dishName) {
          businessName = parameters.dishName as string;
        } else if (!businessName && parameters?.recipeName) {
          businessName = parameters.recipeName as string;
        }

        // 是否为批量导入会话
        const isImportSession =
          metadata?.source === "import" ||
          metadata?.mode === "batch_import" ||
          logs.some((log) => log.stepName.startsWith("import_"));

        // 生成任务类型名称
        let taskType = stepNameToTaskName[firstStep] || firstStep;

        // 如果 metadata 中有 taskType 或 type，优先使用
        if (metadata?.taskType) {
          const metaTaskType = metadata.taskType as string;
          taskType = stepNameToTaskName[metaTaskType] || metaTaskType;
        } else if (metadata?.type) {
          const metaType = metadata.type as string;
          if (metaType === "recipe_generation") {
            taskType = "食谱生成";
          } else if (metaType === "image_generation") {
            taskType = "图片生成";
          }
        }

        if (isImportSession) {
          taskType = "批量导入";
        }

        // 如果有多个不同类型的步骤，标记为复合任务
        const uniqueSteps = new Set(logs.map((l) => l.stepName));
        if (!isImportSession && uniqueSteps.size > 2) {
          taskType = "复合任务";
        }

        // 解析批量导入数量（优先 metadata.count，其次 resultText 里的 count=）
        let importCount: number | undefined;
        if (isImportSession) {
          const startLog = logs.find((log) => log.stepName === "import_start");
          const metaCount =
            startLog && startLog.metadata && (startLog.metadata as Record<string, unknown>).count;
          if (typeof metaCount === "number") {
            importCount = metaCount;
          } else if (typeof metaCount === "string") {
            const parsed = parseInt(metaCount, 10);
            if (!Number.isNaN(parsed)) importCount = parsed;
          }

          if (importCount === undefined && typeof startLog?.resultText === "string") {
            const match = startLog.resultText.match(/count=(\d+)/);
            if (match) importCount = parseInt(match[1], 10);
          }
        }

        // 组合最终的任务名称：任务类型【业务名称】
        const taskName = isImportSession
          ? importCount
            ? `批量导入（${importCount}个）`
            : "批量导入"
          : businessName
            ? `${taskType}【${businessName}】`
            : taskType;

        return {
          sessionId: s.sessionId,
          taskName,
          stepCount: s._count.id,
          startTime: s._min.timestamp,
          endTime: s._max.timestamp,
          totalDuration,
          hasError,
          recipeId,
          jobId,
          contentType,
          previewText,
          previewImages,
          finalStepName,
          steps: logs.map((log) => ({
            stepName: log.stepName,
            status: log.status,
          })),
        };
      })
    );

    // 获取总数
    const totalSessions = await prisma.aIGenerationLog.groupBy({
      by: ["sessionId"],
      where,
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: sessionsWithDetails,
      meta: {
        page,
        pageSize,
        total: totalSessions.length,
        totalPages: Math.ceil(totalSessions.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to query AI generation sessions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
