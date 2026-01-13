/**
 * 美食图片库 API
 *
 * GET /api/gallery - 获取所有已发布食谱的主图
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getContentLocales } from "@/lib/i18n/content";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const q = searchParams.get("q") || "";
    const cuisine = searchParams.get("cuisine") || "";
    const location = searchParams.get("location") || "";
    const locale = resolveLocale(searchParams.get("locale"));
    const locales = getContentLocales(locale);

    // 构建查询条件
    const where: any = {
      status: "published",
      coverImage: { not: null },
    };

    if (q) {
      where.title = { contains: q, mode: "insensitive" };
    }

    if (cuisine) {
      where.cuisineId = cuisine;
    }

    if (location) {
      where.locationId = location;
    }

    // 获取数据
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        select: {
          id: true,
          title: true,
          coverImage: true,
          cuisineId: true,
          locationId: true,
          translations: { where: { locale: { in: locales } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ]);

    const data =
      locale === DEFAULT_LOCALE
        ? recipes
        : recipes.map((recipe) => {
            const translation =
              locales
                .map((loc) =>
                  recipe.translations.find((item) => item.locale === loc)
                )
                .find(Boolean) || null;
            return {
              ...recipe,
              title: translation?.title || recipe.title,
            };
          });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("获取图片库失败:", error);
    return NextResponse.json(
      { success: false, error: "获取图片库失败" },
      { status: 500 }
    );
  }
}
