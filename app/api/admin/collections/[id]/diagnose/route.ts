/**
 * Collection 诊断 API (简化版)
 *
 * 注意：原版使用的 scenes/cookingMethods/tastes 等数组字段不存在
 * 新版通过 RecipeTag 关系实现，需要完全重写
 *
 * GET /api/admin/collections/[id]/diagnose - 获取聚合页诊断信息
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

// 权限验证
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

// 构建匹配查询条件（适配新 Schema）
function buildMatchQuery(
  rules: { type: string; value: string },
  excludedRecipeIds: string[]
): Record<string, unknown> {
  const baseWhere: Record<string, unknown> = {};

  if ("type" in rules && "value" in rules) {
    const { type, value } = rules;
    switch (type) {
      case "cuisine":
        // 通过 cuisineId 关联查询
        baseWhere.cuisine = { slug: value };
        break;
      case "scene":
      case "method":
      case "taste":
      case "crowd":
      case "occasion":
        // 通过 RecipeTag 关系查询
        baseWhere.tags = {
          some: {
            tag: { slug: value, type },
          },
        };
        break;
    }
  }

  if (excludedRecipeIds.length > 0) {
    baseWhere.id = { notIn: excludedRecipeIds };
  }

  return baseWhere;
}

/**
 * GET /api/admin/collections/[id]/diagnose
 * 获取聚合页诊断信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "聚合页不存在" },
        { status: 404 }
      );
    }

    const rules = collection.rules as { type: string; value: string };
    const baseWhere = buildMatchQuery(rules, collection.excludedRecipeIds);

    // 漏斗统计（适配新 Schema: status 字段）
    const [published, pending, draft] = await Promise.all([
      prisma.recipe.count({
        where: { ...baseWhere, status: "published" },
      }),
      prisma.recipe.count({
        where: { ...baseWhere, status: "pending" },
      }),
      prisma.recipe.count({
        where: { ...baseWhere, status: "draft" },
      }),
    ]);

    const gap = Math.max(0, collection.targetCount - published);
    const isMinReached = published >= collection.minRequired;

    // 生成建议
    const suggestions: Array<{
      type: string;
      message: string;
      action: { type: string; url?: string; count?: number };
    }> = [];

    if (pending > 0) {
      suggestions.push({
        type: "publish_pending",
        message: `有 ${pending} 篇待审核食谱，通过后可达 ${published + pending} 篇`,
        action: {
          type: "link",
          url: `/admin/recipes?status=pending&${rules.type}=${rules.value}`,
        },
      });
    }

    if (draft > 0) {
      suggestions.push({
        type: "complete_draft",
        message: `有 ${draft} 篇草稿，完善后可发布`,
        action: {
          type: "link",
          url: `/admin/recipes?status=draft&${rules.type}=${rules.value}`,
        },
      });
    }

    if (gap > 0) {
      const suggestedCount = Math.min(gap, 20);
      suggestions.push({
        type: "generate",
        message: `建议生成 ${gap} 篇填充缺口`,
        action: {
          type: "generate",
          count: suggestedCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        collection: {
          id: collection.id,
          name: collection.name,
          type: collection.type,
          minRequired: collection.minRequired,
          targetCount: collection.targetCount,
        },
        funnel: {
          target: collection.targetCount,
          published,
          pending,
          draft,
          gap,
        },
        status: {
          isMinReached,
          minRequired: collection.minRequired,
          targetCount: collection.targetCount,
        },
        suggestions,
        // 子分类分布暂不支持（需要完全重写）
        byMethod: [],
        lowCoverage: [],
        note: "Tag-based method distribution not yet implemented for new schema",
      },
    });
  } catch (error) {
    console.error("Collection diagnose error:", error);
    return NextResponse.json(
      { success: false, error: "获取诊断信息失败" },
      { status: 500 }
    );
  }
}
