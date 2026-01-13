/**
 * 场景标签管理 API (适配新 Schema)
 *
 * Scene 模型已迁移到 Tag 模型 (type="scene")
 *
 * GET /api/admin/config/tags/scenes - 获取所有场景
 * POST /api/admin/config/tags/scenes - 创建场景
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { createCollectionForTag } from "@/lib/collection/sync";

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

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    // 使用 Tag 模型查询 type="scene"
    const scenes = await prisma.tag.findMany({
      where: { type: "scene" },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
        _count: { select: { recipes: true } },
      },
    });

    const data = scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      slug: scene.slug,
      icon: scene.icon,
      sortOrder: scene.sortOrder,
      isActive: scene.isActive,
      translations: scene.translations,
      recipeCount: scene._count.recipes,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取场景列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取场景列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { name, slug, description, sortOrder, isActive, icon } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "名称和 slug 为必填项" },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existing = await prisma.tag.findFirst({
      where: { slug, type: "scene" },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该 slug 已存在" },
        { status: 400 }
      );
    }

    const scene = await prisma.tag.create({
      data: {
        name,
        slug,
        type: "scene",
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    // 自动创建对应的 Collection
    await createCollectionForTag("scene", {
      id: scene.id,
      name: scene.name,
      slug: scene.slug,
      description: description || null,
    });

    return NextResponse.json({ success: true, data: scene });
  } catch (error) {
    console.error("创建场景失败:", error);
    return NextResponse.json(
      { success: false, error: "创建场景失败" },
      { status: 500 }
    );
  }
}
