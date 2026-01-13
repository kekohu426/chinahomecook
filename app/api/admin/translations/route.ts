/**
 * 翻译列表 API (适配新 Schema)
 *
 * GET /api/admin/translations
 *
 * 查询参数：
 * - reviewed: 是否已审核（true/false）
 * - locale: 语言筛选
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const reviewedParam = searchParams.get("reviewed") || searchParams.get("approved");
    const locale = searchParams.get("locale");

    // 构建查询条件
    const where: {
      isReviewed?: boolean;
      locale?: string;
    } = {};

    if (reviewedParam !== null) {
      where.isReviewed = reviewedParam === "true";
    }

    if (locale && locale !== "all") {
      where.locale = locale;
    }

    const translations = await prisma.recipeTranslation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // 格式化返回数据
    const formattedData = translations.map((t) => ({
      id: t.id,
      recipeId: t.recipeId,
      recipeTitleZh: t.recipe.title,
      locale: t.locale,
      title: t.title,
      isReviewed: t.isReviewed,
      isApproved: t.isReviewed, // 兼容旧字段名
      reviewedAt: t.reviewedAt,
      approvedAt: t.reviewedAt, // 兼容旧字段名
      createdAt: t.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("获取翻译列表失败:", error);
    return NextResponse.json({ success: false, error: "获取翻译列表失败" }, { status: 500 });
  }
}
