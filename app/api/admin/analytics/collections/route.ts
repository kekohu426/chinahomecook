/**
 * 聚合页流量分析 API
 *
 * GET /api/admin/analytics/collections - 获取聚合页流量数据
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // all | high | low
    const type = searchParams.get("type") || "all";

    // 构建查询条件
    const where: any = {
      status: "published",
    };

    if (type !== "all") {
      where.type = type;
    }

    // 根据筛选条件添加访问量过滤
    if (filter === "high") {
      where.viewCount = { gte: 1000 };
    } else if (filter === "low") {
      where.viewCount = { lt: 100 };
    }

    // 查询聚合页
    const collections = await prisma.collection.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        viewCount: true,
        lastViewedAt: true,
        status: true,
      },
      orderBy: { viewCount: "desc" },
      take: 100, // 最多显示100个
    });

    // 统计总数和总访问量
    const total = collections.length;
    const totalViews = collections.reduce((sum, c) => sum + c.viewCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        collections,
        total,
        totalViews,
      },
    });
  } catch (error) {
    console.error("获取流量数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取流量数据失败" },
      { status: 500 }
    );
  }
}
