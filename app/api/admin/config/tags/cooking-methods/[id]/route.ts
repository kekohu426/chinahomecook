/**
 * 烹饪方式详情 API (适配新 Schema)
 *
 * CookingMethod 模型已迁移到 Tag 模型 (type="method")
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { syncCollectionForTag, handleCollectionOnTagDelete } from "@/lib/collection/sync";

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
    const method = await prisma.tag.findFirst({
      where: { id, type: "method" },
      include: { translations: true },
    });

    if (!method) {
      return NextResponse.json(
        { success: false, error: "烹饪方式不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: method });
  } catch (error) {
    console.error("Get cooking method error:", error);
    return NextResponse.json(
      { success: false, error: "获取烹饪方式失败" },
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

    const method = await prisma.tag.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        icon: body.icon,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });

    // 同步聚合页
    await syncCollectionForTag("method", id, {
      name: body.name,
      slug: body.slug,
    });

    return NextResponse.json({ success: true, data: method });
  } catch (error) {
    console.error("Update cooking method error:", error);
    return NextResponse.json(
      { success: false, error: "更新烹饪方式失败" },
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

    // 处理聚合页
    await handleCollectionOnTagDelete("method", id);

    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete cooking method error:", error);
    return NextResponse.json(
      { success: false, error: "删除烹饪方式失败" },
      { status: 500 }
    );
  }
}
