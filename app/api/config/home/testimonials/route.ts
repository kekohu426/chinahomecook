/**
 * 首页用户证言 API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { seedHomeTestimonials } from "@/lib/home/seed";

const resolveLocale = (value?: string | null): Locale =>
  value && SUPPORTED_LOCALES.includes(value as Locale)
    ? (value as Locale)
    : DEFAULT_LOCALE;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = resolveLocale(searchParams.get("locale"));

    await seedHomeTestimonials();

    const items = await prisma.homeTestimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        translations: locale === DEFAULT_LOCALE ? false : { where: { locale } },
      },
    });

    const data = items.map((item) => {
      const translation =
        locale === DEFAULT_LOCALE ? null : item.translations[0] || null;
      return {
        id: item.id,
        name: translation?.name || item.name,
        role: translation?.role || item.role,
        city: translation?.city || item.city,
        content: translation?.content || item.content,
        meta: translation?.meta || item.meta,
        avatarUrl: item.avatarUrl,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取用户证言失败:", error);
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

    if (!body.name || !body.content) {
      return NextResponse.json(
        { success: false, error: "姓名和内容为必填项" },
        { status: 400 }
      );
    }

    const created = await prisma.homeTestimonial.create({
      data: {
        name: body.name,
        role: body.role || "",
        city: body.city || "",
        content: body.content,
        meta: body.meta || "",
        avatarUrl: body.avatarUrl || null,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive ?? true,
      },
    });

    if (locale !== DEFAULT_LOCALE) {
      await prisma.homeTestimonialTranslation.create({
        data: {
          testimonialId: created.id,
          locale,
          name: body.name,
          role: body.role || "",
          city: body.city || "",
          content: body.content,
          meta: body.meta || "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        name: created.name,
        role: created.role,
        city: created.city,
        content: created.content,
        meta: created.meta,
        avatarUrl: created.avatarUrl,
        sortOrder: created.sortOrder,
        isActive: created.isActive,
      },
    });
  } catch (error) {
    console.error("保存用户证言失败:", error);
    return NextResponse.json(
      { success: false, error: "保存失败" },
      { status: 500 }
    );
  }
}
