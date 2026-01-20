/**
 * Collection 匹配食谱 API
 *
 * GET /api/admin/collections/[id]/recipes - 获取匹配的食谱列表
 *
 * 使用规则引擎构建查询条件
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { buildRuleWhereClause } from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";
import type { ApiResponse, ApiError, PaginationMeta } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface RecipeItem {
  id: string;
  title: string;
  titleZh: string;
  titleEn: string | null;
  coverImage: string | null;
  status: string;
  isPinned: boolean;
  pinnedOrder: number;
  isExcluded: boolean;
  cuisineName: string | null;
  locationName: string | null;
  tags: string[];
  createdAt: string;
}

interface RecipesResponse {
  recipes: RecipeItem[];
}

/**
 * GET /api/admin/collections/[id]/recipes
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const status = searchParams.get("status"); // published/pending/draft/all
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 获取合集
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // 使用规则引擎构建基础查询条件
    const baseWhere = buildRuleWhereClause(collection.rules as unknown as RuleConfig, {
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds: collection.excludedRecipeIds,
    });

    const pinnedIds = collection.pinnedRecipeIds || [];
    const excludedIds = collection.excludedRecipeIds || [];
    const conditions: Record<string, unknown>[] = [];

    let baseCondition: Record<string, unknown> = baseWhere;
    if (pinnedIds.length > 0) {
      baseCondition = { OR: [baseWhere, { id: { in: pinnedIds } }] };
    }
    conditions.push(baseCondition);

    if (excludedIds.length > 0) {
      conditions.push({ id: { notIn: excludedIds } });
    }

    if (status && status !== "all") {
      conditions.push({ status });
    }

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where = conditions.length > 1 ? { AND: conditions } : conditions[0];

    // 获取总数
    const total = await prisma.recipe.count({ where });

    // 构建排序
    const orderBy: Record<string, string> = {};
    if (["createdAt", "updatedAt", "title", "viewCount"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // 获取食谱列表
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        cuisine: { select: { name: true } },
        location: { select: { name: true } },
        tags: {
          include: { tag: { select: { name: true, type: true } } },
        },
        translations: {
          where: { locale: "en" },
          select: { title: true },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 标记置顶和排除状态
    const pinnedSet = new Set(collection.pinnedRecipeIds);
    const excludedSet = new Set(collection.excludedRecipeIds);

    const formattedRecipes: RecipeItem[] = recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      titleZh: recipe.title,
      titleEn: recipe.translations[0]?.title || null,
      coverImage: recipe.coverImage,
      status: recipe.status,
      isPinned: pinnedSet.has(recipe.id),
      pinnedOrder: collection.pinnedRecipeIds.indexOf(recipe.id),
      isExcluded: excludedSet.has(recipe.id),
      cuisineName: recipe.cuisine?.name || null,
      locationName: recipe.location?.name || null,
      tags: recipe.tags.map((t: { tag: { name: string } }) => t.tag.name),
      createdAt: recipe.createdAt.toISOString(),
    }));

    // 重新排序：置顶的排在前面
    formattedRecipes.sort((a, b) => {
      if (a.isPinned && b.isPinned) return a.pinnedOrder - b.pinnedOrder;
      if (a.isPinned) return -1;
      if (b.isPinned) return 1;
      return 0;
    });

    const meta: PaginationMeta = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json<ApiResponse<RecipesResponse> & { meta: PaginationMeta }>({
      success: true,
      data: { recipes: formattedRecipes },
      meta,
    });
  } catch (error) {
    console.error("获取匹配食谱失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取失败" },
      },
      { status: 500 }
    );
  }
}
