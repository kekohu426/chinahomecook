/**
 * 烹饪方式翻译 API (适配新 Schema)
 *
 * 使用 TagTranslation 模型
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const translations = await prisma.tagTranslation.findMany({
      where: { tagId: id },
    });
    return NextResponse.json({ success: true, data: translations });
  } catch (error) {
    console.error("Get translations error:", error);
    return NextResponse.json(
      { success: false, error: "获取翻译失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const locale = body.locale || "en";

    const translation = await prisma.tagTranslation.upsert({
      where: { tagId_locale: { tagId: id, locale } },
      update: { name: body.name, slug: body.slug || body.name },
      create: {
        tagId: id,
        locale,
        name: body.name,
        slug: body.slug || body.name,
      },
    });

    return NextResponse.json({ success: true, data: translation });
  } catch (error) {
    console.error("Update translation error:", error);
    return NextResponse.json(
      { success: false, error: "更新翻译失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";

    await prisma.tagTranslation.delete({
      where: { tagId_locale: { tagId: id, locale } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete translation error:", error);
    return NextResponse.json(
      { success: false, error: "删除翻译失败" },
      { status: 500 }
    );
  }
}
