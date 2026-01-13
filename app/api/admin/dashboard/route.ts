/**
 * 运营仪表板统计 API
 *
 * GET /api/admin/dashboard
 *
 * 返回食谱管理相关的统计数据，包括:
 * - 食谱统计 (总数、发布、待审、草稿)
 * - 翻译统计 (总数、覆盖率)
 * - 生成任务统计 (运行中、待处理)
 * - 聚合页统计
 * - 待办事项
 * - 趋势数据
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/config";

// 权限验证
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 并行获取所有统计数据
    const [
      totalRecipes,
      publishedRecipes,
      approvedRecipes,
      pendingApproval,
      draftRecipes,
      aiGeneratedRecipes,
      totalTranslations,
      approvedTranslations,
      pendingTranslations,
      recentRecipes,
      recentTranslations,
      cuisineStats,
      locationStats,
      // 生成任务统计
      runningJobs,
      pendingJobs,
      failedJobs,
      // 聚合页统计
      totalCollections,
      collectionDetails,
    ] = await Promise.all([
      // 食谱总数
      prisma.recipe.count(),
      // 已发布 (status = "published")
      prisma.recipe.count({ where: { status: "published" } }),
      // 已审核 (reviewStatus = "approved")
      prisma.recipe.count({ where: { reviewStatus: "approved" } }),
      // 待审核 (reviewStatus = "pending")
      prisma.recipe.count({ where: { reviewStatus: "pending" } }),
      // 草稿 (status = "draft")
      prisma.recipe.count({ where: { status: "draft" } }),
      // AI 生成
      prisma.recipe.count({ where: { aiGenerated: true } }),
      // 翻译总数
      prisma.recipeTranslation.count(),
      // 已审核翻译 (isReviewed = true)
      prisma.recipeTranslation.count({ where: { isReviewed: true } }),
      // 待审核翻译 (isReviewed = false)
      prisma.recipeTranslation.count({ where: { isReviewed: false } }),
      // 最近 7 天新增食谱
      prisma.recipe.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      // 最近 7 天新增翻译
      prisma.recipeTranslation.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      // 按菜系统计（前 10）- 使用 cuisineId 关联
      prisma.recipe.groupBy({
        by: ["cuisineId"],
        where: { cuisineId: { not: null }, status: "published" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // 按地区统计（前 10）- 使用 locationId 关联
      prisma.recipe.groupBy({
        by: ["locationId"],
        where: { locationId: { not: null }, status: "published" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // 生成任务统计
      prisma.generateJob.count({ where: { status: "running" } }),
      prisma.generateJob.count({ where: { status: "pending" } }),
      prisma.generateJob.count({ where: { status: "failed" } }),
      // 聚合页统计
      prisma.collection.count(),
      prisma.collection.findMany({
        where: { status: { in: ["active", "draft"] } },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          minRequired: true,
          targetCount: true,
          _count: { select: { recipes: true } },
        },
      }),
    ]);

    // 获取菜系和地点名称用于分布统计
    const cuisineIds = cuisineStats
      .map((d) => d.cuisineId)
      .filter((id): id is string => id !== null);
    const locationIds = locationStats
      .map((d) => d.locationId)
      .filter((id): id is string => id !== null);

    const [cuisines, locations] = await Promise.all([
      prisma.cuisine.findMany({
        where: { id: { in: cuisineIds } },
        select: { id: true, name: true },
      }),
      prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true },
      }),
    ]);

    const cuisineMap = new Map(cuisines.map((c) => [c.id, c.name]));
    const locationMap = new Map(locations.map((l) => [l.id, l.name]));

    // 计算聚合页统计
    const readyCollections = collectionDetails.filter((c) => {
      return c._count.recipes >= c.minRequired;
    }).length;

    const lowCoverageCollections = collectionDetails.filter((c) => {
      const ratio = c.minRequired > 0 ? c._count.recipes / c.minRequired : 1;
      return c.status === "active" && ratio < 0.8;
    }).length;

    // 按语言统计翻译覆盖率
    const translationLocales = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);
    const translationCoverage: Record<string, { total: number; approved: number }> = {};

    for (const locale of translationLocales) {
      const [total, approved] = await Promise.all([
        prisma.recipeTranslation.count({ where: { locale } }),
        prisma.recipeTranslation.count({ where: { locale, isReviewed: true } }),
      ]);
      translationCoverage[locale] = { total, approved };
    }

    // 获取近7天新增食谱趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecipeList = await prisma.recipe.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    // 按日期分组
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dailyCounts[key] = 0;
    }

    for (const recipe of recentRecipeList) {
      const key = recipe.createdAt.toISOString().split("T")[0];
      if (key in dailyCounts) {
        dailyCounts[key]++;
      }
    }

    const trend = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // 获取需要关注的聚合页（内容不足）
    const attentionCollections = collectionDetails
      .filter((c) => {
        const ratio = c.minRequired > 0 ? c._count.recipes / c.minRequired : 1;
        return ratio < 0.8;
      })
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c._count.recipes < c.minRequired * 0.5 ? "low" : "draft",
        minRequired: c.minRequired,
        targetCount: c.targetCount,
      }));

    // 获取正在运行的生成任务
    const activeJobs = await prisma.generateJob.findMany({
      where: { status: { in: ["running", "pending"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        sourceType: true,
        totalCount: true,
        successCount: true,
        failedCount: true,
        status: true,
        createdAt: true,
      },
    });

    // 构建待办事项
    const todos: Array<{
      type: string;
      priority: "high" | "medium" | "low";
      message: string;
      action: { type: string; url?: string; count?: number };
    }> = [];

    if (pendingApproval > 0) {
      todos.push({
        type: "review_recipes",
        priority: pendingApproval > 10 ? "high" : "medium",
        message: `${pendingApproval} 篇食谱待审核`,
        action: { type: "link", url: "/admin/review/recipes" },
      });
    }

    if (pendingTranslations > 0) {
      todos.push({
        type: "review_translations",
        priority: pendingTranslations > 20 ? "high" : "medium",
        message: `${pendingTranslations} 条翻译待审核`,
        action: { type: "link", url: "/admin/review/recipes?tab=translations" },
      });
    }

    if (lowCoverageCollections > 0) {
      todos.push({
        type: "fill_collections",
        priority: lowCoverageCollections > 5 ? "high" : "medium",
        message: `${lowCoverageCollections} 个聚合页内容不足`,
        action: { type: "link", url: "/admin/collections?status=low" },
      });
    }

    if (failedJobs > 0) {
      todos.push({
        type: "check_failed_jobs",
        priority: "low",
        message: `${failedJobs} 个生成任务失败`,
        action: { type: "link", url: "/admin/jobs?status=failed" },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        recipes: {
          total: totalRecipes,
          published: publishedRecipes,
          draft: draftRecipes,
          approved: approvedRecipes,
          pending: pendingApproval,
          aiGenerated: aiGeneratedRecipes,
          recentWeek: recentRecipes,
        },
        translations: {
          total: totalTranslations,
          approved: approvedTranslations,
          pending: pendingTranslations,
          recentWeek: recentTranslations,
          coverage: translationCoverage,
        },
        jobs: {
          running: runningJobs,
          pending: pendingJobs,
          failed: failedJobs,
        },
        tags: {
          pendingReview: 0, // 标签审核已整合到 Tag 模型
        },
        collections: {
          total: totalCollections,
          ready: readyCollections,
          lowCoverage: lowCoverageCollections,
        },
        distribution: {
          byCuisine: cuisineStats.map((item) => ({
            name: item.cuisineId ? cuisineMap.get(item.cuisineId) || "未知" : "未分类",
            count: item._count.id,
          })),
          byLocation: locationStats.map((item) => ({
            name: item.locationId ? locationMap.get(item.locationId) || "未知" : "未分类",
            count: item._count.id,
          })),
        },
        trend,
        todos,
        attentionCollections,
        activeJobs: activeJobs.map((j) => ({
          id: j.id,
          sourceType: j.sourceType,
          totalCount: j.totalCount,
          successCount: j.successCount,
          failedCount: j.failedCount,
          progress: j.totalCount > 0
            ? Math.round(((j.successCount + j.failedCount) / j.totalCount) * 100)
            : 0,
          status: j.status,
          createdAt: j.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("获取仪表板数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取数据失败" },
      { status: 500 }
    );
  }
}
