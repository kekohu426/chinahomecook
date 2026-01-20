/**
 * 预览聚合规则匹配数量 API
 *
 * POST /api/admin/collections/preview - 预览规则匹配的菜谱数量
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildRuleWhereClause } from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules, cuisineId, locationId, tagId } = body;

    if (!rules) {
      return NextResponse.json(
        { success: false, error: "rules 为必填项" },
        { status: 400 }
      );
    }

    // 构建查询条件
    const where = buildRuleWhereClause(rules as RuleConfig, {
      cuisineId,
      locationId,
      tagId,
    });

    // 只统计已发布的菜谱
    where.status = "published";

    // 计数
    const count = await prisma.recipe.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        count,
        hasRules: Object.keys(where).length > 1, // 除了 status 之外还有其他条件
      },
    });
  } catch (error) {
    console.error("预览规则失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "预览规则失败",
      },
      { status: 500 }
    );
  }
}
