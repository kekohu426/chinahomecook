/**
 * 首页用户证言详情 API
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

    const item = await prisma.homeTestimonial.findUnique({
      where: { id },
      include: {
        translations: locale === DEFAULT_LOCALE ? false : { where: { locale } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "未找到用户证言" },
        { status: 404 }
      );
    }

    const translation =
      locale === DEFAULT_LOCALE ? null : item.translations[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        name: translation?.name || item.name,
        role: translation?.role || item.role,
        city: translation?.city || item.city,
        content: translation?.content || item.content,
        meta: translation?.meta || item.meta,
        avatarUrl: item.avatarUrl,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      },
    });
  } catch (error) {
    console.error("获取用户证言失败:", error);
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

    const existing = await prisma.homeTestimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "未找到用户证言" },
        { status: 404 }
      );
    }

    if (locale === DEFAULT_LOCALE) {
      const updated = await prisma.homeTestimonial.update({
        where: { id },
        data: {
          name: body.name ?? existing.name,
          role: body.role ?? existing.role,
          city: body.city ?? existing.city,
          content: body.content ?? existing.content,
          meta: body.meta ?? existing.meta,
          avatarUrl: body.avatarUrl ?? existing.avatarUrl,
          sortOrder:
            body.sortOrder !== undefined ? Number(body.sortOrder) || 0 : existing.sortOrder,
          isActive: body.isActive ?? existing.isActive,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          role: updated.role,
          city: updated.city,
          content: updated.content,
          meta: updated.meta,
          avatarUrl: updated.avatarUrl,
          sortOrder: updated.sortOrder,
          isActive: updated.isActive,
        },
      });
    }

    const translation = await prisma.homeTestimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: id, locale } },
      update: {
        name: body.name ?? null,
        role: body.role ?? null,
        city: body.city ?? null,
        content: body.content ?? null,
        meta: body.meta ?? null,
      },
      create: {
        testimonialId: id,
        locale,
        name: body.name ?? existing.name,
        role: body.role ?? existing.role,
        city: body.city ?? existing.city,
        content: body.content ?? existing.content,
        meta: body.meta ?? existing.meta,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: existing.id,
        name: translation.name || existing.name,
        role: translation.role || existing.role,
        city: translation.city || existing.city,
        content: translation.content || existing.content,
        meta: translation.meta || existing.meta,
        avatarUrl: existing.avatarUrl,
        sortOrder: existing.sortOrder,
        isActive: existing.isActive,
      },
    });
  } catch (error) {
    console.error("更新用户证言失败:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.homeTestimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除用户证言失败:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
