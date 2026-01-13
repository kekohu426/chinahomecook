/**
 * 场景标签详情 API (适配新 Schema)
 *
 * Scene 模型已迁移到 Tag 模型 (type="scene")
 *
 * GET /api/admin/config/tags/scenes/[id] - 获取场景详情
 * PUT /api/admin/config/tags/scenes/[id] - 更新场景
 * DELETE /api/admin/config/tags/scenes/[id] - 删除场景
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  syncCollectionForTag,
  handleCollectionOnTagDelete,
} from "@/lib/collection/sync";

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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const scene = await prisma.tag.findFirst({
      where: { id, type: "scene" },
      include: { translations: true },
    });

    if (!scene) {
      return NextResponse.json(
        { success: false, error: "场景不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: scene });
  } catch (error) {
    console.error("获取场景失败:", error);
    return NextResponse.json(
      { success: false, error: "获取场景失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();
    const { name, slug, sortOrder, isActive, icon } = body;

    // 检查是否存在
    const existing = await prisma.tag.findFirst({
      where: { id, type: "scene" },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "场景不存在" },
        { status: 404 }
      );
    }

    // 如果修改了 slug，检查是否与其他记录冲突
    if (slug && slug !== existing.slug) {
      const conflict = await prisma.tag.findFirst({
        where: { slug, type: "scene", id: { not: id } },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: "该 slug 已存在" },
          { status: 400 }
        );
      }
    }

    const scene = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // 同步 Collection 信息
    if (name !== undefined || slug !== undefined) {
      await syncCollectionForTag("scene", id, { name, slug });
    }

    return NextResponse.json({ success: true, data: scene });
  } catch (error) {
    console.error("更新场景失败:", error);
    return NextResponse.json(
      { success: false, error: "更新场景失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;

    // 检查是否存在
    const existing = await prisma.tag.findFirst({
      where: { id, type: "scene" },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "场景不存在" },
        { status: 404 }
      );
    }

    // 处理关联的 Collection（标记为孤立，不删除）
    await handleCollectionOnTagDelete("scene", id);

    // 删除场景及其翻译（级联删除）
    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    console.error("删除场景失败:", error);
    return NextResponse.json(
      { success: false, error: "删除场景失败" },
      { status: 500 }
    );
  }
}
