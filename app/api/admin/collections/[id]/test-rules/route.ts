/**
 * 规则测试 API
 *
 * POST /api/admin/collections/[id]/test-rules
 * 测试规则配置，返回匹配结果预览
 *
 * 请求体：
 * {
 *   rules: RuleConfig,           // 要测试的规则
 *   excludedRecipeIds?: string[] // 排除的食谱ID
 *   limit?: number               // 返回样本数量，默认 10
 * }
 *
 * 响应：
 * {
 *   success: true,
 *   data: {
 *     counts: { matched, published, pending, draft },
 *     samples: Recipe[],
 *     validation: { valid, errors }
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  buildRuleWhereClause,
  validateRuleConfig,
  getRuleDescription,
} from "@/lib/collection/rule-engine";
import type { RuleConfig } from "@/lib/types/collection";
import type { ApiResponse, ApiError } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface TestRulesRequest {
  rules: RuleConfig;
  excludedRecipeIds?: string[];
  limit?: number;
}

interface RecipeSample {
  id: string;
  title: string;
  status: string;
  coverImage: string | null;
  cuisineName: string | null;
  locationName: string | null;
  tags: string[];
}

interface TestRulesResponse {
  counts: {
    matched: number;
    published: number;
    pending: number;
    draft: number;
  };
  samples: RecipeSample[];
  validation: {
    valid: boolean;
    errors: string[];
  };
  description: string;
}

export async function POST(request: NextRequest, context: RouteContext) {
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
    const body: TestRulesRequest = await request.json();
    const { rules, excludedRecipeIds = [], limit = 10 } = body;

    // 获取合集信息（用于 auto 规则的关联字段）
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        cuisineId: true,
        locationId: true,
        tagId: true,
      },
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

    // 验证规则
    const validation = validateRuleConfig(rules);

    // 如果规则无效，仍然返回验证结果但不执行查询
    if (!validation.valid) {
      return NextResponse.json<ApiResponse<TestRulesResponse>>({
        success: true,
        data: {
          counts: { matched: 0, published: 0, pending: 0, draft: 0 },
          samples: [],
          validation,
          description: "规则配置无效",
        },
      });
    }

    // 构建查询条件
    const baseWhere = buildRuleWhereClause(rules, {
      cuisineId: collection.cuisineId,
      locationId: collection.locationId,
      tagId: collection.tagId,
      excludedRecipeIds,
    });

    // 并行执行统计和样本查询
    const [published, pending, draft, samples] = await Promise.all([
      prisma.recipe.count({ where: { ...baseWhere, status: "published" } }),
      prisma.recipe.count({ where: { ...baseWhere, status: "pending" } }),
      prisma.recipe.count({ where: { ...baseWhere, status: "draft" } }),
      prisma.recipe.findMany({
        where: baseWhere,
        take: Math.min(limit, 50), // 最多返回 50 条
        orderBy: { updatedAt: "desc" },
        include: {
          cuisine: { select: { name: true } },
          location: { select: { name: true } },
          tags: {
            include: { tag: { select: { name: true } } },
          },
        },
      }),
    ]);

    // 格式化样本数据
    const formattedSamples: RecipeSample[] = samples.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      status: recipe.status,
      coverImage: recipe.coverImage,
      cuisineName: recipe.cuisine?.name || null,
      locationName: recipe.location?.name || null,
      tags: recipe.tags.map((t: { tag: { name: string } }) => t.tag.name),
    }));

    // 获取规则描述
    const description = getRuleDescription(rules);

    return NextResponse.json<ApiResponse<TestRulesResponse>>({
      success: true,
      data: {
        counts: {
          matched: published + pending + draft,
          published,
          pending,
          draft,
        },
        samples: formattedSamples,
        validation,
        description,
      },
    });
  } catch (error) {
    console.error("规则测试失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "规则测试失败" },
      },
      { status: 500 }
    );
  }
}
