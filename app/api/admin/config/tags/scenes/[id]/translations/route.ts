/**
 * 场景标签翻译 API (适配新 Schema)
 *
 * 使用 TagTranslation 模型
 *
 * GET /api/admin/config/tags/scenes/[id]/translations - 获取翻译
 * PUT /api/admin/config/tags/scenes/[id]/translations - 更新翻译
 * DELETE /api/admin/config/tags/scenes/[id]/translations - 删除翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  }
  return null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/config/tags/scenes/[id]/translations
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

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
 * PUT /api/admin/config/tags/scenes/[id]/translations
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();
    const { locale, name } = body;

    if (!locale || !name) {
      return NextResponse.json(
        { success: false, error: "locale 和 name 为必填项" },
        { status: 400 }
      );
    }

    const translation = await prisma.tagTranslation.upsert({
      where: { tagId_locale: { tagId: id, locale } },
      create: {
        tagId: id,
        locale,
        name,
        slug: body.slug || name,
      },
      update: {
        name,
        slug: body.slug || name,
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

/**
 * DELETE /api/admin/config/tags/scenes/[id]/translations
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale");

    if (!locale) {
      return NextResponse.json(
        { success: false, error: "locale 参数必填" },
        { status: 400 }
      );
    }

    await prisma.tagTranslation.delete({
      where: { tagId_locale: { tagId: id, locale } },
    });

    return NextResponse.json({ success: true, message: "翻译已删除" });
  } catch (error) {
    console.error("删除翻译失败:", error);
    return NextResponse.json(
      { success: false, error: "删除翻译失败" },
      { status: 500 }
    );
  }
}
