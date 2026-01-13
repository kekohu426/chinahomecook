/**
 * 获取菜谱分类统计 (适配新 Schema)
 *
 * GET /api/admin/stats/recipe-counts?type=cuisine|location|scene
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

    const counts: Record<string, number> = {};

    if (type === "cuisine") {
      // 通过 cuisineId 关联查询
      const rows = await prisma.recipe.groupBy({
        by: ["cuisineId"],
        where: { status: "published", cuisineId: { not: null } },
        _count: { id: true },
      });

      // 获取 cuisine 信息
      const cuisineIds = rows.map((r) => r.cuisineId).filter(Boolean) as string[];
      const cuisines = await prisma.cuisine.findMany({
        where: { id: { in: cuisineIds } },
        select: { id: true, slug: true },
      });
      const cuisineMap = new Map(cuisines.map((c) => [c.id, c.slug]));

      for (const row of rows) {
        if (row.cuisineId) {
          const slug = cuisineMap.get(row.cuisineId);
          if (slug) {
            counts[slug] = row._count.id;
          }
        }
      }
    } else if (type === "location") {
      const rows = await prisma.recipe.groupBy({
        by: ["locationId"],
        where: { status: "published", locationId: { not: null } },
        _count: { id: true },
      });

      const locationIds = rows.map((r) => r.locationId).filter(Boolean) as string[];
      const locations = await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, slug: true },
      });
      const locationMap = new Map(locations.map((l) => [l.id, l.slug]));

      for (const row of rows) {
        if (row.locationId) {
          const slug = locationMap.get(row.locationId);
          if (slug) {
            counts[slug] = row._count.id;
          }
        }
      }
    } else if (type === "scene" || type === "method" || type === "taste" || type === "crowd" || type === "occasion") {
      // 通过 RecipeTag 关联查询
      const tagCounts = await prisma.recipeTag.groupBy({
        by: ["tagId"],
        where: {
          recipe: { status: "published" },
          tag: { type },
        },
        _count: { recipeId: true },
      });

      const tagIds = tagCounts.map((t) => t.tagId);
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true, slug: true },
      });
      const tagMap = new Map(tags.map((t) => [t.id, t.slug]));

      for (const row of tagCounts) {
        const slug = tagMap.get(row.tagId);
        if (slug) {
          counts[slug] = row._count.recipeId;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("获取统计失败:", error);
    return NextResponse.json({ success: false, error: "获取统计失败" }, { status: 500 });
  }
}
