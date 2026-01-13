/**
 * 地点配置 API
 *
 * GET  /api/config/locations - 获取所有地点
 * POST /api/config/locations - 创建地点
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { createCollectionForTag } from "@/lib/collection/sync";

/**
 * GET /api/config/locations
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

    const locations = await prisma.location.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale: { in: locales } } } },
    });

    const formatted = locations.map((loc) => {
      const translation = loc.translations.find((t) => locales.includes(t.locale));
      const displayName = translation?.name || loc.name;
      const displayDescription = translation?.description || loc.description;
      return {
        id: loc.id,
        slug: loc.slug,
        name: displayName,
        originalName: loc.name,
        description: displayDescription,
        isActive: loc.isActive,
        sortOrder: loc.sortOrder,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("获取地点列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取地点列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/locations
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

    const location = await prisma.location.create({
      data: {
        name,
        description,
        slug,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
      },
    });

    // 自动创建对应的 Collection
    await createCollectionForTag("region", {
      id: location.id,
      name: location.name,
      slug: location.slug,
      description: location.description,
    });

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("创建地点失败:", error);
    return NextResponse.json(
      { success: false, error: "创建地点失败" },
      { status: 500 }
    );
  }
}
