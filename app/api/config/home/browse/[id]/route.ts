/**
 * HomeBrowseItem 详情 API
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

    const item = await prisma.homeBrowseItem.findUnique({
      where: { id },
      include: {
        translations: locale === DEFAULT_LOCALE ? false : { where: { locale } },
      },
    });
    if (!item) {
      return NextResponse.json(
        { success: false, error: "未找到快捷入口" },
        { status: 404 }
      );
    }

    const translation =
      locale === DEFAULT_LOCALE ? null : item.translations[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        type: item.type,
        name: translation?.name || item.name,
        description: translation?.description || item.description,
        href: item.href,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      },
    });
  } catch (error) {
    console.error("获取快捷入口失败:", error);
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

    const existing = await prisma.homeBrowseItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "未找到快捷入口" },
        { status: 404 }
      );
    }

    if (locale === DEFAULT_LOCALE) {
      const updated = await prisma.homeBrowseItem.update({
        where: { id },
        data: {
          type: body.type ?? existing.type,
          name: body.name ?? existing.name,
          description: body.description ?? existing.description,
          href: body.href ?? existing.href,
          imageUrl: body.imageUrl ?? existing.imageUrl,
          sortOrder:
            body.sortOrder !== undefined ? Number(body.sortOrder) || 0 : existing.sortOrder,
          isActive: body.isActive ?? existing.isActive,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          type: updated.type,
          name: updated.name,
          description: updated.description,
          href: updated.href,
          imageUrl: updated.imageUrl,
          sortOrder: updated.sortOrder,
          isActive: updated.isActive,
        },
      });
    }

    const translation = await prisma.homeBrowseItemTranslation.upsert({
      where: { itemId_locale: { itemId: id, locale } },
      update: {
        name: body.name ?? null,
        description: body.description ?? null,
      },
      create: {
        itemId: id,
        locale,
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: existing.id,
        type: existing.type,
        name: translation.name || existing.name,
        description: translation.description || existing.description,
        href: existing.href,
        imageUrl: existing.imageUrl,
        sortOrder: existing.sortOrder,
        isActive: existing.isActive,
      },
    });
  } catch (error) {
    console.error("更新快捷入口失败:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.homeBrowseItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除快捷入口失败:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
