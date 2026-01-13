/**
 * 排除食谱 API
 *
 * POST   /api/admin/collections/[id]/exclude - 排除食谱
 * DELETE /api/admin/collections/[id]/exclude - 取消排除
 *
 * 请求体：
 * POST:   { recipeIds: string[] }
 * DELETE: { recipeIds: string[] }
 *
 * 响应：
 * { success: true, excludedRecipeIds: string[], message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import type { ApiResponse, ApiError } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ExcludeRequest {
  recipeIds: string[];
}

interface ExcludeResponse {
  excludedRecipeIds: string[];
  message: string;
}

/**
 * POST /api/admin/collections/[id]/exclude
 * 排除食谱
 */
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
    const body: ExcludeRequest = await request.json();
    const { recipeIds } = body;

    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "recipeIds 不能为空" },
        },
        { status: 400 }
      );
    }

    // 获取合集
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { excludedRecipeIds: true, pinnedRecipeIds: true },
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

    // 验证食谱是否存在
    const existingRecipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingRecipes.map((r) => r.id));
    const invalidIds = recipeIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `以下食谱不存在: ${invalidIds.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // 合并排除列表（去重）
    const currentExcluded = collection.excludedRecipeIds || [];
    const newIds = recipeIds.filter((id) => !currentExcluded.includes(id));
    const updatedExcluded = [...currentExcluded, ...newIds];

    // 如果排除的食谱在置顶列表中，也需要从置顶列表移除
    const excludeSet = new Set(recipeIds);
    const updatedPinned = (collection.pinnedRecipeIds || []).filter(
      (id) => !excludeSet.has(id)
    );

    // 更新合集
    await prisma.collection.update({
      where: { id },
      data: {
        excludedRecipeIds: updatedExcluded,
        pinnedRecipeIds: updatedPinned,
      },
    });

    return NextResponse.json<ApiResponse<ExcludeResponse>>({
      success: true,
      data: {
        excludedRecipeIds: updatedExcluded,
        message: `已排除 ${newIds.length} 个食谱`,
      },
    });
  } catch (error) {
    console.error("排除食谱失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "排除食谱失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections/[id]/exclude
 * 取消排除
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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
    const body: { recipeIds: string[] } = await request.json();
    const { recipeIds } = body;

    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "recipeIds 不能为空" },
        },
        { status: 400 }
      );
    }

    // 获取合集
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { excludedRecipeIds: true },
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

    // 移除指定的食谱
    const removeSet = new Set(recipeIds);
    const updatedExcluded = (collection.excludedRecipeIds || []).filter(
      (id) => !removeSet.has(id)
    );

    // 更新合集
    await prisma.collection.update({
      where: { id },
      data: { excludedRecipeIds: updatedExcluded },
    });

    return NextResponse.json<ApiResponse<ExcludeResponse>>({
      success: true,
      data: {
        excludedRecipeIds: updatedExcluded,
        message: `已取消排除 ${recipeIds.length} 个食谱`,
      },
    });
  } catch (error) {
    console.error("取消排除失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "取消排除失败" },
      },
      { status: 500 }
    );
  }
}
