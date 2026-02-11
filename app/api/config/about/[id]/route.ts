/**
 * 关于我们区块 API
 *
 * GET    /api/config/about/[id] - 获取单个区块
 * PUT    /api/config/about/[id] - 更新区块/翻译
 * DELETE /api/config/about/[id] - 删除区块
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const section = await prisma.aboutSection.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    console.error("获取关于我们区块失败:", error);
    return NextResponse.json(
      { success: false, error: "获取关于我们区块失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const locale = body?.locale || DEFAULT_LOCALE;

    if (locale !== DEFAULT_LOCALE) {
      const title = body?.title;
      const content = body?.content;
      if (!title || !content) {
        return NextResponse.json(
          { success: false, error: "title 和 content 为必填项" },
          { status: 400 }
        );
      }

      const translation = await prisma.aboutSectionTranslation.upsert({
        where: { sectionId_locale: { sectionId: id, locale } },
        update: { title, content },
        create: { sectionId: id, locale, title, content },
      });

      return NextResponse.json({ success: true, data: translation });
    }

    const section = await prisma.aboutSection.update({
      where: { id },
      data: {
        titleZh: body.titleZh ?? undefined,
        contentZh: body.contentZh ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
        videoUrl: body.videoUrl ?? undefined,
        type: body.type ?? undefined,
        sortOrder: body.sortOrder ?? undefined,
        isActive: body.isActive ?? undefined,
      },
    });

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    console.error("更新关于我们区块失败:", error);
    return NextResponse.json(
      { success: false, error: "更新关于我们区块失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.aboutSection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除关于我们区块失败:", error);
    return NextResponse.json(
      { success: false, error: "删除关于我们区块失败" },
      { status: 500 }
    );
  }
}
