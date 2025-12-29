/**
 * 食谱 API 路由
 *
 * GET  /api/recipes - 获取所有食谱（支持分页、搜索）
 * POST /api/recipes - 创建新食谱（PRD Schema v1.1.0 验证）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { safeValidateRecipe } from "@/lib/validators/recipe";

/**
 * GET /api/recipes
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 10）
 * - search: 搜索关键词（搜索标题）
 * - published: 是否已发布（true/false）
 * - location: 地点筛选（川渝、江浙等）
 * - cuisine: 菜系筛选（川菜、粤菜等）
 * - ingredient: 食材筛选（支持多个，用逗号分隔）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const publishedParam = searchParams.get("published");
    const location = searchParams.get("location");
    const cuisine = searchParams.get("cuisine");
    const ingredientParam = searchParams.get("ingredient");

    // 构建查询条件
    const where: any = {};

    // 搜索
    if (search) {
      where.OR = [
        { titleZh: { contains: search } },
        { titleEn: { contains: search } },
      ];
    }

    // 发布状态
    if (publishedParam !== null) {
      where.isPublished = publishedParam === "true";
    }

    // 地点筛选
    if (location) {
      where.location = location;
    }

    // 菜系筛选
    if (cuisine) {
      where.cuisine = cuisine;
    }

    // 食材筛选（支持多个食材，必须包含所有指定的食材）
    if (ingredientParam) {
      const ingredients = ingredientParam.split(",").map((i) => i.trim());
      where.mainIngredients = {
        hasEvery: ingredients,
      };
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询数据
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.recipe.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取食谱列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食谱列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 *
 * 创建新食谱（使用 PRD Schema v1.1.0 Zod 验证）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 使用 Zod 验证 PRD Schema v1.1.0
    const validation = safeValidateRecipe(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "数据验证失败",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // 生成 slug（如果未提供）
    const slug =
      body.slug ||
      `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 创建食谱（PRD v1.1.0 格式 + 扩展字段）
    const recipe = await prisma.recipe.create({
      data: {
        schemaVersion: validation.data.schemaVersion,
        titleZh: validation.data.titleZh,
        titleEn: validation.data.titleEn,
        summary: validation.data.summary,
        story: validation.data.story,
        ingredients: validation.data.ingredients,
        steps: validation.data.steps,
        styleGuide: validation.data.styleGuide,
        imageShots: validation.data.imageShots,
        // 扩展字段
        location: body.location,
        cuisine: body.cuisine,
        mainIngredients: body.mainIngredients || [],
        slug,
        coverImage: body.coverImage,
        aiGenerated: body.aiGenerated || false,
        author: body.author,
        isPublished: body.isPublished || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error("创建食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "创建食谱失败" },
      { status: 500 }
    );
  }
}
