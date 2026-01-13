/**
 * 获取某分类下的菜谱列表 (适配新 Schema)
 *
 * GET /api/admin/stats/recipes-by-category?type=cuisine|location|scene|method|taste|crowd|occasion&value=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "cuisine";
    const value = searchParams.get("value") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (!value) {
      return NextResponse.json({ success: false, error: "value 参数必填" }, { status: 400 });
    }

    let where: Record<string, unknown> = { status: "published" };

    if (type === "cuisine") {
      // 通过 slug 查找 cuisineId
      const cuisine = await prisma.cuisine.findFirst({ where: { slug: value } });
      if (cuisine) {
        where.cuisineId = cuisine.id;
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    } else if (type === "location") {
      const location = await prisma.location.findFirst({ where: { slug: value } });
      if (location) {
        where.locationId = location.id;
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    } else if (["scene", "method", "taste", "crowd", "occasion"].includes(type)) {
      // 通过 RecipeTag 关联查询
      const tag = await prisma.tag.findFirst({ where: { slug: value, type } });
      if (tag) {
        where.tags = { some: { tagId: tag.id } };
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    const recipes = await prisma.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        coverImage: true,
        viewCount: true,
      },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    // 兼容前端格式
    const data = recipes.map((r) => ({
      ...r,
      titleZh: r.title,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("获取菜谱失败:", error);
    return NextResponse.json({ success: false, error: "获取菜谱失败" }, { status: 500 });
  }
}
