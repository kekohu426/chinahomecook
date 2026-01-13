/**
 * 定制食谱列表 API
 *
 * GET /api/custom-recipes?limit=12
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
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "12"),
      50
    );
    const locale = resolveLocale(request.nextUrl.searchParams.get("locale"));
    const locales = getContentLocales(locale);

    const recipes = await prisma.recipe.findMany({
      where: {
        status: "published",
        aiGenerated: true,
        slug: { startsWith: "custom-" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    });

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
            if (!translation) return recipe;
            return {
              ...recipe,
              title: translation.title,
              summary: translation.summary,
            };
          });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取定制食谱列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取定制食谱列表失败" },
      { status: 500 }
    );
  }
}
