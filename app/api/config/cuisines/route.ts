/**
 * 菜系配置 API
 *
 * GET  /api/config/cuisines - 获取所有菜系
 * POST /api/config/cuisines - 创建菜系
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";
import { createCollectionForTag } from "@/lib/collection/sync";

/**
 * GET /api/config/cuisines
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const localeParam = searchParams.get("locale") as Locale | null;
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined;
    const locale: Locale =
      (localeParam && SUPPORTED_LOCALES.includes(localeParam)) ? localeParam
      : (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) ? cookieLocale
      : DEFAULT_LOCALE;
    const locales = getContentLocales(locale);

    const cuisines = await prisma.cuisine.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale: { in: locales } } } },
    });

    const formatted = cuisines.map((cui) => {
      const translation = cui.translations.find((t) => locales.includes(t.locale));
      const displayName = translation?.name || cui.name;
      const displayDescription = translation?.description || cui.description;
      return {
        id: cui.id,
        slug: cui.slug,
        name: displayName,
        originalName: cui.name,
        description: displayDescription,
        isActive: cui.isActive,
        sortOrder: cui.sortOrder,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("获取菜系列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取菜系列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/cuisines
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, slug, isActive, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "name 和 slug 为必填项" },
        { status: 400 }
      );
    }

    const cuisine = await prisma.cuisine.create({
      data: {
        name,
        description,
        slug,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
      },
    });

    // 自动创建对应的 Collection
    await createCollectionForTag("cuisine", {
      id: cuisine.id,
      name: cuisine.name,
      slug: cuisine.slug,
      description: cuisine.description,
    });

    return NextResponse.json({
      success: true,
      data: cuisine,
    });
  } catch (error) {
    console.error("创建菜系失败:", error);
    return NextResponse.json(
      { success: false, error: "创建菜系失败" },
      { status: 500 }
    );
  }
}
