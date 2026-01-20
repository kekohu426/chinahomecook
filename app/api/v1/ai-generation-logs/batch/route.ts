/**
 * AI 生成日志批量写入 API
 *
 * POST /api/v1/ai-generation-logs/batch - 批量写入日志
 *
 * 性能优化：单次事务写入多条日志
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import type { AIGenerationLogRequest } from "../route";

/**
 * POST /api/v1/ai-generation-logs/batch
 * 批量写入日志
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 鉴权：仅管理员可写入
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await request.json();
    const logs: AIGenerationLogRequest[] = body.logs || [];

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { success: false, error: "logs must be a non-empty array" },
        { status: 400 }
      );
    }

    // 3. 限制批量大小
    if (logs.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 logs per batch" },
        { status: 400 }
      );
    }

    // 4. 批量写入（单次事务）
    const results = await prisma.$transaction(
      logs.map((log) =>
        prisma.aIGenerationLog.create({
          data: {
            sessionId: log.sessionId,
            stepName: log.stepName,
            modelName: log.modelName,
            status: log.status,
            provider: log.provider,
            prompt: log.prompt,
            promptUrl: log.promptUrl,
            parameters: log.parameters as any,
            result: log.result as any,
            resultUrl: log.resultUrl,
            resultText: log.resultText,
            resultImages: log.resultImages || [],
            durationMs: log.durationMs,
            tokenUsage: log.tokenUsage as any,
            cost: log.cost,
            retryIndex: log.retryIndex,
            recipeId: log.recipeId,
            jobId: log.jobId,
            userId: log.userId,
            errorMessage: log.errorMessage,
            errorStack: log.errorStack,
            warning: log.warning,
            metadata: log.metadata as any,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        count: results.length,
        logIds: results.map((r) => r.id),
      },
    });
  } catch (error) {
    console.error("Failed to batch write AI generation logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
