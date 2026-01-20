/**
 * 主题卡片 API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { seedHomeThemes } from "@/lib/home/seed";

const resolveLocale = (value?: string | null): Locale =>
  value && SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(searchParams.get("locale"));

    await seedHomeThemes();

    const cards = await prisma.homeThemeCard.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        translations: locale === DEFAULT_LOCALE ? false : { where: { locale } },
      },
    });

    const data = cards.map((card) => {
      const translation =
        locale === DEFAULT_LOCALE ? null : card.translations[0] || null;
      return {
        id: card.id,
        title: translation?.title || card.title,
        imageUrl: card.imageUrl,
        tag: card.tag,
        href: card.href,
        sortOrder: card.sortOrder,
        isActive: card.isActive,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取主题卡片失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = resolveLocale(body.locale);

    if (!body.title || !body.imageUrl || !body.tag) {
      return NextResponse.json(
        { success: false, error: "标题、图片和标签为必填项" },
        { status: 400 }
      );
    }

    const created = await prisma.homeThemeCard.create({
      data: {
        title: body.title,
        imageUrl: body.imageUrl,
        tag: body.tag,
        href: body.href || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      },
    });

    if (locale !== DEFAULT_LOCALE) {
      await prisma.homeThemeCardTranslation.create({
        data: {
          cardId: created.id,
          locale,
          title: body.title,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        title: created.title,
        imageUrl: created.imageUrl,
        tag: created.tag,
        href: created.href,
        sortOrder: created.sortOrder,
        isActive: created.isActive,
      },
    });
  } catch (error) {
    console.error("保存主题卡片失败:", error);
    return NextResponse.json(
      { success: false, error: "保存失败" },
      { status: 500 }
    );
  }
}
