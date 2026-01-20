/**
 * 口味标签管理 API (适配新 Schema)
 *
 * Taste 模型已迁移到 Tag 模型 (type="taste")
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { createCollectionForTag } from "@/lib/collection/sync";

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  return null;
}

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const tastes = await prisma.tag.findMany({
      where: { type: "taste" },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
      },
    });

    const tasteIds = tastes.map((taste) => taste.id);
    const counts = tasteIds.length
      ? await prisma.recipeTag.groupBy({
          by: ["tagId"],
          where: {
            tagId: { in: tasteIds },
            recipe: { status: "published" },
          },
          _count: { _all: true },
        })
      : [];
    const countMap = new Map(counts.map((item) => [item.tagId, item._count._all]));

    const data = tastes.map((taste) => ({
      id: taste.id,
      name: taste.name,
      slug: taste.slug,
      icon: taste.icon,
      sortOrder: taste.sortOrder,
      isActive: taste.isActive,
      translations: taste.translations,
      recipeCount: countMap.get(taste.id) || 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取口味列表失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { name, slug, description, sortOrder, isActive, icon } = await request.json();
    if (!name || !slug) return NextResponse.json({ success: false, error: "名称和 slug 为必填项" }, { status: 400 });

    if (await prisma.tag.findFirst({ where: { slug, type: "taste" } })) {
      return NextResponse.json({ success: false, error: "该 slug 已存在" }, { status: 400 });
    }

    const taste = await prisma.tag.create({
      data: {
        name,
        slug,
        type: "taste",
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    // 自动创建对应的 Collection
    await createCollectionForTag("taste", {
      id: taste.id,
      name: taste.name,
      slug: taste.slug,
      description: description || null,
    });

    return NextResponse.json({ success: true, data: taste });
  } catch (error) {
    console.error("创建口味失败:", error);
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
