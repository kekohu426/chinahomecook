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

    // 构建查询条件
    const where: any = {};

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
            cost: true,
            recipeId: true,
            jobId: true,
            errorMessage: true,
          },
        });

        const totalDuration = logs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
        const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
        const hasError = logs.some((log) => log.status === "failed");
        const recipeId = logs.find((log) => log.recipeId)?.recipeId;
        const jobId = logs.find((log) => log.jobId)?.jobId;

        return {
          sessionId: s.sessionId,
          stepCount: s._count.id,
          startTime: s._min.timestamp,
          endTime: s._max.timestamp,
          totalDuration,
          totalCost,
          hasError,
          recipeId,
          jobId,
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
