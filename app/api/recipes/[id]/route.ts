/**
 * 单个食谱 API 路由
 *
 * GET    /api/recipes/[id] - 获取单个食谱
 * PUT    /api/recipes/[id] - 更新食谱（PRD Schema v1.1.0 验证）
 * DELETE /api/recipes/[id] - 删除食谱
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { safeValidateRecipe } from "@/lib/validators/recipe";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/recipes/[id]
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error("获取食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食谱失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recipes/[id]
 *
 * 更新食谱（使用 PRD Schema v1.1.0 Zod 验证）
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // 检查食谱是否存在
    const existing = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

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

    // 更新食谱（PRD v1.1.0 格式 + 扩展字段）
    const recipe = await prisma.recipe.update({
      where: { id },
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
        location: body.location !== undefined ? body.location : existing.location,
        cuisine: body.cuisine !== undefined ? body.cuisine : existing.cuisine,
        mainIngredients: body.mainIngredients !== undefined ? body.mainIngredients : existing.mainIngredients,
        slug: body.slug !== undefined ? body.slug : existing.slug,
        coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
        aiGenerated: body.aiGenerated !== undefined ? body.aiGenerated : existing.aiGenerated,
        author: body.author,
        isPublished: body.isPublished !== undefined ? body.isPublished : existing.isPublished,
      },
    });

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error("更新食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "更新食谱失败" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/recipes/[id]
 *
 * 快捷更新发布状态
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (typeof body.isPublished !== "boolean") {
      return NextResponse.json(
        { success: false, error: "isPublished 必须为 boolean" },
        { status: 400 }
      );
    }

    const existing = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        isPublished: body.isPublished,
      },
    });

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error("更新发布状态失败:", error);
    return NextResponse.json(
      { success: false, error: "更新发布状态失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 检查食谱是否存在
    const existing = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 删除食谱
    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "食谱已删除",
    });
  } catch (error) {
    console.error("删除食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "删除食谱失败" },
      { status: 500 }
    );
  }
}
