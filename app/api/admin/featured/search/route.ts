/**
 * 食谱搜索 API（用于推荐位管理）(适配新 Schema)
 *
 * GET /api/admin/featured/search?q=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const excludeIds = searchParams.get("exclude")?.split(",").filter(Boolean) || [];
    const sort = searchParams.get("sort") || "hot";
    const isCustom = searchParams.get("custom") === "true";

    const where: Record<string, unknown> = {
      status: "published",
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { cuisine: { name: { contains: query, mode: "insensitive" } } },
        { location: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    // 筛选 AI 定制食谱
    if (isCustom) {
      where.aiGenerated = true;
      where.slug = { startsWith: "custom-" };
    }

    // 排序方式
    const orderBy = sort === "latest"
      ? [{ createdAt: "desc" as const }]
      : [{ viewCount: "desc" as const }, { createdAt: "desc" as const }];

    const recipes = await prisma.recipe.findMany({
      where,
      select: {
        id: true,
        title: true,
        coverImage: true,
        cuisineId: true,
        locationId: true,
        viewCount: true,
        createdAt: true,
        cuisine: { select: { name: true, slug: true } },
        location: { select: { name: true, slug: true } },
      },
      orderBy,
      take: limit,
    });

    // 兼容前端格式
    const data = recipes.map((r) => ({
      id: r.id,
      titleZh: r.title,
      title: r.title,
      coverImage: r.coverImage,
      cuisine: r.cuisine?.slug || null,
      location: r.location?.slug || null,
      viewCount: r.viewCount,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("搜索食谱失败:", error);
    return NextResponse.json({ success: false, error: "搜索食谱失败" }, { status: 500 });
  }
}
