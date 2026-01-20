/**
 * 烹饪方式管理 API (适配新 Schema)
 *
 * CookingMethod 模型已迁移到 Tag 模型 (type="method")
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

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    // 使用 Tag 模型查询 type="method"
    const methods = await prisma.tag.findMany({
      where: { type: "method" },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
      },
    });

    const methodIds = methods.map((method) => method.id);
    const counts = methodIds.length
      ? await prisma.recipeTag.groupBy({
          by: ["tagId"],
          where: {
            tagId: { in: methodIds },
            recipe: { status: "published" },
          },
          _count: { _all: true },
        })
      : [];
    const countMap = new Map(counts.map((item) => [item.tagId, item._count._all]));

    const data = methods.map((method) => ({
      id: method.id,
      name: method.name,
      slug: method.slug,
      icon: method.icon,
      sortOrder: method.sortOrder,
      isActive: method.isActive,
      translations: method.translations,
      recipeCount: countMap.get(method.id) || 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get cooking methods error:", error);
    return NextResponse.json(
      { success: false, error: "获取烹饪方式失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();

    // 创建新的 Tag with type="method"
    const method = await prisma.tag.create({
      data: {
        name: body.name,
        slug: body.slug,
        type: "method",
        icon: body.icon || null,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive ?? true,
      },
    });

    // 创建对应的聚合页
    await createCollectionForTag("method", {
      id: method.id,
      name: method.name,
      slug: method.slug,
    });

    return NextResponse.json({ success: true, data: method });
  } catch (error) {
    console.error("Create cooking method error:", error);
    return NextResponse.json(
      { success: false, error: "创建烹饪方式失败" },
      { status: 500 }
    );
  }
}
