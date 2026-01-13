/**
 * 地点翻译 API
 *
 * GET /api/config/locations/[id]/translations - 获取翻译
 * PUT /api/config/locations/[id]/translations - 更新翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/config/locations/[id]/translations
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale");

    if (!locale) {
      // 返回所有翻译
      const translations = await prisma.locationTranslation.findMany({
        where: { locationId: id },
      });
      return NextResponse.json({ success: true, data: translations });
    }

    // 返回指定语言翻译
    const translation = await prisma.locationTranslation.findUnique({
      where: { locationId_locale: { locationId: id, locale } },
    });

    return NextResponse.json({ success: true, data: translation });
  } catch (error) {
    console.error("获取翻译失败:", error);
    return NextResponse.json(
      { success: false, error: "获取翻译失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/config/locations/[id]/translations
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { locale, name, description } = body;

    if (!locale || !name) {
      return NextResponse.json(
        { success: false, error: "locale 和 name 为必填项" },
        { status: 400 }
      );
    }

    // 生成 slug
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const translation = await prisma.locationTranslation.upsert({
      where: { locationId_locale: { locationId: id, locale } },
      create: {
        locationId: id,
        locale,
        name,
        slug,
        description,
      },
      update: {
        name,
        slug,
        description,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: translation });
  } catch (error) {
    console.error("更新翻译失败:", error);
    return NextResponse.json(
      { success: false, error: "更新翻译失败" },
      { status: 500 }
    );
  }
}
