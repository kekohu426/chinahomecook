/**
 * 主题卡片详情 API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

type RouteContext = { params: Promise<{ id: string }> };

const resolveLocale = (value?: string | null): Locale =>
  value && SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(searchParams.get("locale"));

    const card = await prisma.homeThemeCard.findUnique({
      where: { id },
      include: {
        translations: locale === DEFAULT_LOCALE ? false : { where: { locale } },
      },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: "未找到主题卡片" },
        { status: 404 }
      );
    }

    const translation =
      locale === DEFAULT_LOCALE ? null : card.translations[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        id: card.id,
        title: translation?.title || card.title,
        imageUrl: card.imageUrl,
        tag: card.tag,
        href: card.href,
        sortOrder: card.sortOrder,
        isActive: card.isActive,
      },
    });
  } catch (error) {
    console.error("获取主题卡片失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const locale = resolveLocale(body.locale);

    const existing = await prisma.homeThemeCard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "未找到主题卡片" },
        { status: 404 }
      );
    }

    if (locale === DEFAULT_LOCALE) {
      const updated = await prisma.homeThemeCard.update({
        where: { id },
        data: {
          title: body.title ?? existing.title,
          imageUrl: body.imageUrl ?? existing.imageUrl,
          tag: body.tag ?? existing.tag,
          href: body.href ?? existing.href,
          sortOrder:
            body.sortOrder !== undefined ? Number(body.sortOrder) || 0 : existing.sortOrder,
          isActive: body.isActive ?? existing.isActive,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          title: updated.title,
          imageUrl: updated.imageUrl,
          tag: updated.tag,
          href: updated.href,
          sortOrder: updated.sortOrder,
          isActive: updated.isActive,
        },
      });
    }

    const translation = await prisma.homeThemeCardTranslation.upsert({
      where: { cardId_locale: { cardId: id, locale } },
      update: {
        title: body.title ?? null,
      },
      create: {
        cardId: id,
        locale,
        title: body.title ?? existing.title,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: existing.id,
        title: translation.title || existing.title,
        imageUrl: existing.imageUrl,
        tag: existing.tag,
        href: existing.href,
        sortOrder: existing.sortOrder,
        isActive: existing.isActive,
      },
    });
  } catch (error) {
    console.error("更新主题卡片失败:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.homeThemeCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除主题卡片失败:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
