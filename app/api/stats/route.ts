/**
 * 公开统计 API
 *
 * GET /api/stats
 *
 * 返回首页展示的统计数据
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 缓存60秒

export async function GET() {
  try {
    const [
      totalRecipes,
      publishedRecipes,
      aiGeneratedRecipes,
      totalViews,
    ] = await Promise.all([
      prisma.recipe.count(),
      prisma.recipe.count({ where: { status: "published" } }),
      prisma.recipe.count({ where: { aiGenerated: true } }),
      prisma.recipe.aggregate({ _sum: { viewCount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        recipesGenerated: aiGeneratedRecipes,
        recipesCollected: publishedRecipes,
        totalRecipes,
        totalViews: totalViews._sum.viewCount || 0,
      },
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
