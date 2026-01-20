/**
 * 仪表盘统计 API
 *
 * GET /api/admin/stats - 获取后台统计数据
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/stats
 *
 * 返回仪表盘所需的各项统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 并行获取各项统计
    const [
      // 菜谱统计
      totalRecipes,
      publishedRecipes,
      pendingReviewRecipes,
      draftRecipes,
      todayGeneratedRecipes,

      // 翻译统计
      pendingTranslations,
      completedTranslationsToday,

      // 生成任务统计
      runningGenerateJobs,
      pendingGenerateJobs,

      // 合集统计
      totalCollections,
      activeCollections,

      // 最近生成的菜谱
      recentRecipes,

      // 各合集进度
      collectionProgress,
    ] = await Promise.all([
      // 菜谱统计
      prisma.recipe.count(),
      prisma.recipe.count({ where: { status: "published" } }),
      prisma.recipe.count({ where: { reviewStatus: "pending", status: "pending" } }),
      prisma.recipe.count({ where: { status: "draft" } }),
      prisma.recipe.count({
        where: {
          aiGenerated: true,
          createdAt: { gte: today },
        },
      }),

      // 翻译统计
      prisma.translationJob.count({ where: { status: "pending" } }),
      prisma.translationJob.count({
        where: {
          status: "completed",
          completedAt: { gte: today },
        },
      }),

      // 生成任务统计
      prisma.generateJob.count({ where: { status: "running" } }),
      prisma.generateJob.count({ where: { status: "pending" } }),

      // 合集统计
      prisma.collection.count(),
      prisma.collection.count({ where: { status: "active" } }),

      // 最近生成的菜谱
      prisma.recipe.findMany({
        where: { aiGenerated: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          status: true,
          reviewStatus: true,
          createdAt: true,
          collection: { select: { id: true, name: true } },
        },
      }),

      // 各合集进度（需要单独查询已发布食谱数）
      prisma.collection.findMany({
        where: { status: { in: ["active", "draft"] } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          minRequired: true,
          targetCount: true,
          _count: {
            select: {
              recipes: {
                where: { status: "published" },
              },
            },
          },
        },
      }),
    ]);

    // 格式化合集进度
    const formattedCollectionProgress = collectionProgress.map((coll) => {
      const currentCount = coll._count.recipes;
      const progress = coll.targetCount > 0
        ? Math.round((currentCount / coll.targetCount) * 100)
        : 0;
      const gap = Math.max(0, coll.targetCount - currentCount);

      let statusIndicator: "green" | "yellow" | "red" | "gray" = "gray";
      if (coll.status === "active") {
        const ratio = currentCount / coll.minRequired;
        if (ratio >= 1) statusIndicator = "green";
        else if (ratio >= 0.8) statusIndicator = "yellow";
        else statusIndicator = "red";
      }

      return {
        id: coll.id,
        name: coll.name,
        type: coll.type,
        status: coll.status,
        currentCount,
        targetCount: coll.targetCount,
        minRequired: coll.minRequired,
        progress,
        gap,
        statusIndicator,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        // KPI 卡片数据
        kpis: {
          todayGenerated: todayGeneratedRecipes,
          pendingReview: pendingReviewRecipes,
          pendingTranslation: pendingTranslations,
          totalPublished: publishedRecipes,
        },

        // 菜谱统计
        recipes: {
          total: totalRecipes,
          published: publishedRecipes,
          pendingReview: pendingReviewRecipes,
          draft: draftRecipes,
        },

        // 翻译统计
        translations: {
          pending: pendingTranslations,
          completedToday: completedTranslationsToday,
        },

        // 生成任务统计
        generateJobs: {
          running: runningGenerateJobs,
          pending: pendingGenerateJobs,
        },

        // 合集统计
        collections: {
          total: totalCollections,
          active: activeCollections,
          progress: formattedCollectionProgress,
        },

        // 最近生成的菜谱
        recentRecipes: recentRecipes.map((r) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          coverImage: r.coverImage,
          status: r.status,
          reviewStatus: r.reviewStatus,
          collection: r.collection,
          createdAt: r.createdAt,
        })),

        // 更新时间
        updatedAt: new Date().toISOString(),
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
