/**
 * 置顶食谱 API
 *
 * POST   /api/admin/collections/[id]/pin - 置顶食谱
 * DELETE /api/admin/collections/[id]/pin - 取消置顶
 * PUT    /api/admin/collections/[id]/pin - 重排序置顶食谱
 *
 * 请求体：
 * POST:   { recipeIds: string[], position: "start" | "end" }
 * DELETE: { recipeIds: string[] }
 * PUT:    { recipeIds: string[] } // 完整有序数组
 *
 * 响应：
 * { success: true, pinnedRecipeIds: string[], message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import type { ApiResponse, ApiError } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PinRequest {
  recipeIds: string[];
  position?: "start" | "end";
}

interface PinResponse {
  pinnedRecipeIds: string[];
  message: string;
}

/**
 * POST /api/admin/collections/[id]/pin
 * 置顶食谱
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
    const body: PinRequest = await request.json();
    const { recipeIds, position = "end" } = body;

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
      select: { pinnedRecipeIds: true },
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

    // 合并置顶列表（去重）
    const currentPinned = collection.pinnedRecipeIds || [];
    const newIds = recipeIds.filter((id) => !currentPinned.includes(id));

    let updatedPinned: string[];
    if (position === "start") {
      updatedPinned = [...newIds, ...currentPinned];
    } else {
      updatedPinned = [...currentPinned, ...newIds];
    }

    // 更新合集
    await prisma.collection.update({
      where: { id },
      data: { pinnedRecipeIds: updatedPinned },
    });

    return NextResponse.json<ApiResponse<PinResponse>>({
      success: true,
      data: {
        pinnedRecipeIds: updatedPinned,
        message: `已置顶 ${newIds.length} 个食谱`,
      },
    });
  } catch (error) {
    console.error("置顶食谱失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "置顶食谱失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections/[id]/pin
 * 取消置顶
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
      select: { pinnedRecipeIds: true },
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
    const updatedPinned = (collection.pinnedRecipeIds || []).filter(
      (id) => !removeSet.has(id)
    );

    // 更新合集
    await prisma.collection.update({
      where: { id },
      data: { pinnedRecipeIds: updatedPinned },
    });

    return NextResponse.json<ApiResponse<PinResponse>>({
      success: true,
      data: {
        pinnedRecipeIds: updatedPinned,
        message: `已取消置顶 ${recipeIds.length} 个食谱`,
      },
    });
  } catch (error) {
    console.error("取消置顶失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "取消置顶失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/collections/[id]/pin
 * 重排序置顶食谱（提交完整有序数组）
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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

    if (!recipeIds || !Array.isArray(recipeIds)) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "recipeIds 必须是数组" },
        },
        { status: 400 }
      );
    }

    // 获取合集
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { pinnedRecipeIds: true, updatedAt: true },
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

    // 验证新数组包含的 ID 与原数组一致（防止意外添加/删除）
    const currentSet = new Set(collection.pinnedRecipeIds || []);
    const newSet = new Set(recipeIds);

    if (currentSet.size !== newSet.size) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "重排序不能添加或删除食谱，请使用 POST/DELETE 接口",
          },
        },
        { status: 400 }
      );
    }

    for (const id of recipeIds) {
      if (!currentSet.has(id)) {
        return NextResponse.json<ApiError>(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `食谱 ${id} 不在当前置顶列表中`,
            },
          },
          { status: 400 }
        );
      }
    }

    // 更新合集
    await prisma.collection.update({
      where: { id },
      data: { pinnedRecipeIds: recipeIds },
    });

    return NextResponse.json<ApiResponse<PinResponse>>({
      success: true,
      data: {
        pinnedRecipeIds: recipeIds,
        message: "排序已更新",
      },
    });
  } catch (error) {
    console.error("重排序失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "重排序失败" },
      },
      { status: 500 }
    );
  }
}
