/**
 * 标签翻译 API
 *
 * GET /api/admin/tags/[id]/translations - 获取翻译列表
 * PUT /api/admin/tags/[id]/translations - 创建/更新翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tags/[id]/translations
 *
 * Query params:
 * - locale: 获取指定语言的翻译
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale");

    if (!locale) {
      // 返回所有翻译
      const translations = await prisma.tagTranslation.findMany({
        where: { tagId: id },
      });
      return NextResponse.json({ success: true, data: translations });
    }

    // 返回指定语言翻译
    const translation = await prisma.tagTranslation.findUnique({
      where: { tagId_locale: { tagId: id, locale } },
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
 * PUT /api/admin/tags/[id]/translations
 *
 * Body: { locale, name, slug }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { locale, name, slug } = body;

    if (!locale || !name || !slug) {
      return NextResponse.json(
        { success: false, error: "locale, name, slug 为必填项" },
        { status: 400 }
      );
    }

    const translation = await prisma.tagTranslation.upsert({
      where: { tagId_locale: { tagId: id, locale } },
      create: {
        tagId: id,
        locale,
        name,
        slug,
      },
      update: {
        name,
        slug,
      },
    });

    // 更新主表的翻译状态
    const allTranslations = await prisma.tagTranslation.findMany({
      where: { tagId: id },
    });

    const transStatus: Record<string, string> = {};
    allTranslations.forEach((t) => {
      transStatus[t.locale] = "completed";
    });

    await prisma.tag.update({
      where: { id },
      data: { transStatus },
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
