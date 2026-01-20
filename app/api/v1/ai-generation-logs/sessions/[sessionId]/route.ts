/**
 * AI 生成会话详情 API
 *
 * GET /api/v1/ai-generation-logs/sessions/[sessionId] - 查询会话详情
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 鉴权：仅管理员可查看
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId } = await context.params;

    // 查询该会话的所有日志
    const logs = await prisma.aIGenerationLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // 计算汇总信息
    const totalDuration = logs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalTokens = logs.reduce((sum, log) => {
      const usage = log.tokenUsage as any;
      return sum + (usage?.total || 0);
    }, 0);

    const hasError = logs.some((log) => log.status === "failed");
    const recipeId = logs.find((log) => log.recipeId)?.recipeId;
    const jobId = logs.find((log) => log.jobId)?.jobId;

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        startTime: logs[0].timestamp,
        endTime: logs[logs.length - 1].timestamp,
        totalDuration,
        totalCost,
        totalTokens,
        hasError,
        recipeId,
        jobId,
        stepCount: logs.length,
        steps: logs,
      },
    });
  } catch (error) {
    console.error("Failed to query AI generation session details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
