/**
 * 关于我们区块列表 API
 *
 * GET  /api/config/about - 获取区块列表
 * POST /api/config/about - 新增区块（仅默认语言）
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const localeParam = searchParams.get("locale");
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    const locale = resolveLocale(localeParam || cookieLocale || DEFAULT_LOCALE);
    const locales = getContentLocales(locale);

    const sections = await prisma.aboutSection.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
      },
    });

    const formatted = sections.map((section) => {
      const translation = section.translations.find((t) =>
        locales.includes(t.locale)
      );
      const enTranslation = section.translations.find((t) => t.locale === "en");
      return {
        id: section.id,
        titleZh: section.titleZh,
        contentZh: section.contentZh,
        titleEn: enTranslation?.title || null,
        contentEn: enTranslation?.content || null,
        title: translation?.title || null,
        content: translation?.content || null,
        imageUrl: section.imageUrl,
        videoUrl: section.videoUrl,
        type: section.type,
        sortOrder: section.sortOrder,
        isActive: section.isActive,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("获取关于我们配置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取关于我们配置失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titleZh, contentZh, imageUrl, videoUrl, type, sortOrder, isActive } =
      body || {};

    if (!titleZh || !contentZh) {
      return NextResponse.json(
        { success: false, error: "titleZh 和 contentZh 为必填项" },
        { status: 400 }
      );
    }

    const section = await prisma.aboutSection.create({
      data: {
        titleZh,
        contentZh,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        type: type || "text",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    console.error("创建关于我们区块失败:", error);
    return NextResponse.json(
      { success: false, error: "创建关于我们区块失败" },
      { status: 500 }
    );
  }
}
