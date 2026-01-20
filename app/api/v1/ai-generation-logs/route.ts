/**
 * AI 生成日志 API
 *
 * GET  /api/v1/ai-generation-logs - 查询日志列表
 * POST /api/v1/ai-generation-logs - 写入单条日志
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

// 日志写入请求接口
export interface AIGenerationLogRequest {
  sessionId: string;
  stepName: string;
  modelName: string;
  status: "success" | "failed" | "partial";

  // 可选字段
  provider?: string;
  prompt?: string;
  promptUrl?: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
  resultUrl?: string;
  resultText?: string;
  resultImages?: string[];
  durationMs?: number;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  cost?: number;
  retryIndex?: number;
  recipeId?: string;
  jobId?: string;
  userId?: string;
  errorMessage?: string;
  errorStack?: string;
  warning?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/v1/ai-generation-logs
 * 查询日志列表（支持筛选）
 */
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
    const sessionId = searchParams.get("sessionId");
    const modelName = searchParams.get("modelName");
    const status = searchParams.get("status");
    const stepName = searchParams.get("stepName");
    const recipeId = searchParams.get("recipeId");
    const jobId = searchParams.get("jobId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search"); // prompt 关键词搜索

    // 构建查询条件
    const where: any = {};

    if (sessionId) where.sessionId = sessionId;
    if (modelName) where.modelName = modelName;
    if (status) where.status = status;
    if (stepName) where.stepName = stepName;
    if (recipeId) where.recipeId = recipeId;
    if (jobId) where.jobId = jobId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { prompt: { contains: search, mode: "insensitive" } },
        { resultText: { contains: search, mode: "insensitive" } },
      ];
    }

    // 查询数据
    const [logs, total] = await Promise.all([
      prisma.aIGenerationLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.aIGenerationLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to query AI generation logs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/ai-generation-logs
 * 写入单条日志
 */
export async function POST(request: NextRequest) {
  try {
    // 鉴权：仅管理员可写入
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 解析请求体
    const body: AIGenerationLogRequest = await request.json();

    // 校验必填字段
    if (!body.sessionId || !body.stepName || !body.modelName || !body.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: sessionId, stepName, modelName, status",
        },
        { status: 400 }
      );
    }

    // 处理大字段（超过 10KB 的 prompt 应该使用 promptUrl）
    if (body.prompt && body.prompt.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt too large (>10KB), please use promptUrl instead",
        },
        { status: 400 }
      );
    }

    // 写入数据库
    const log = await prisma.aIGenerationLog.create({
      data: {
        sessionId: body.sessionId,
        stepName: body.stepName,
        modelName: body.modelName,
        status: body.status,
        provider: body.provider,
        prompt: body.prompt,
        promptUrl: body.promptUrl,
        parameters: body.parameters as any,
        result: body.result as any,
        resultUrl: body.resultUrl,
        resultText: body.resultText,
        resultImages: body.resultImages || [],
        durationMs: body.durationMs,
        tokenUsage: body.tokenUsage as any,
        cost: body.cost,
        retryIndex: body.retryIndex,
        recipeId: body.recipeId,
        jobId: body.jobId,
        userId: body.userId,
        errorMessage: body.errorMessage,
        errorStack: body.errorStack,
        warning: body.warning,
        metadata: body.metadata as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: { logId: log.id },
    });
  } catch (error) {
    console.error("Failed to write AI generation log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
