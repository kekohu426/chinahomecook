/**
 * AI 生成统计 API
 *
 * GET /api/v1/ai-generation-logs/stats - 查询统计数据
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

    // 时间范围参数
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day"; // day/week/month

    // 构建查询条件
    const where: any = ;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // 1. 按模型统计
    const byModel = await prisma.aIGenerationLog.groupBy({
      by: ["modelName"],
      where,
      _count: { id: true },
      _sum: { cost: true, durationMs: true },
    });

    // 2. 按状态统计
    const byStatus = await prisma.aIGenerationLog.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    });

    // 3. 按步骤统计
    const byStep = await prisma.aIGenerationLog.groupBy({
      by: ["stepName"],
      where,
      _count: { id: true },
      _avg: { durationMs: true },
    });

    // 4. 总体统计
    const total = await prisma.aIGenerationLog.aggregate({
      where,
      _count: { id: true },
      _sum: { cost: true, durationMs: true },
    });

    // 5. 按时间统计（简化版，实际应该用 SQL 的 DATE_TRUNC）
    const logs = await prisma.aIGenerationLog.findMany({
      where,
      select: {
        timestamp: true,
        cost: true,
        durationMs: true,
      },
      orderBy: { timestamp: "asc" },
    });

    // 按天分组
    const byDate: Record<string, { count: number; cost: number; duration: number }> = {};
    logs.forEach((log) => {
      const date = log.timestamp.toISOString().split("T")[0];
      if (!byDate[date]) {
        byDate[date] = { count: 0, cost: 0, duration: 0 };
      }
      byDate[date].count++;
      byDate[date].cost += log.cost || 0;
      byDate[date].duration += log.durationMs || 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        total: {
          count: total._count.id,
          totalCost: total._sum.cost || 0,
          totalDuration: total._sum.durationMs || 0,
        },
        byModel: byModel.map((m) => ({
          modelName: m.modelName,
          count: m._count.id,
          totalCost: m._sum.cost || 0,
          totalDuration: m._sum.durationMs || 0,
        })),
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byStep: byStep.map((s) => ({
          stepName: s.stepName,
          count: s._count.id,
          avgDuration: s._avg.durationMs || 0,
        })),
        byDate: Object.entries(byDate).map(([date, stats]) => ({
          date,
          ...stats,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to query AI generation stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
