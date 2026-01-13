/**
 * 口味标签详情 API (适配新 Schema)
 *
 * Taste 模型已迁移到 Tag 模型 (type="taste")
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { syncCollectionForTag, handleCollectionOnTagDelete } from "@/lib/collection/sync";

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  return null;
}

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const taste = await prisma.tag.findFirst({
      where: { id, type: "taste" },
      include: { translations: true },
    });

    if (!taste) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data: taste });
  } catch (error) {
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const { name, slug, sortOrder, isActive, icon } = await request.json();

    const existing = await prisma.tag.findFirst({ where: { id, type: "taste" } });
    if (!existing) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 });

    if (slug && slug !== existing.slug) {
      const conflict = await prisma.tag.findFirst({ where: { slug, type: "taste", id: { not: id } } });
      if (conflict) return NextResponse.json({ success: false, error: "该 slug 已存在" }, { status: 400 });
    }

    const taste = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (name !== undefined || slug !== undefined) {
      await syncCollectionForTag("taste", id, { name, slug });
    }

    return NextResponse.json({ success: true, data: taste });
  } catch (error) {
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    await handleCollectionOnTagDelete("taste", id);
    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
