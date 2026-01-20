/**
 * 聚合页访问记录 API
 *
 * POST /api/analytics/pageview - 记录聚合页访问
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: "collectionId is required" },
        { status: 400 }
      );
    }

    // 更新访问统计
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("记录访问失败:", error);
    return NextResponse.json(
      { success: false, error: "记录访问失败" },
      { status: 500 }
    );
  }
}
