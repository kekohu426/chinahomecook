/**
 * Collection 操作 API
 *
 * POST /api/admin/collections/[id]/operations - 执行置顶/排除等操作
 *
 * Actions:
 * - pin: 置顶食谱
 * - unpin: 取消置顶
 * - exclude: 排除食谱
 * - include: 取消排除
 * - reorder: 调整置顶顺序
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

/**
 * POST /api/admin/collections/[id]/operations
 * 执行操作
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { action, recipeId, recipeIds, order } = body;

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "聚合页不存在" },
        { status: 404 }
      );
    }

    let pinnedRecipeIds = [...collection.pinnedRecipeIds];
    let excludedRecipeIds = [...collection.excludedRecipeIds];

    switch (action) {
      case "pin": {
        // 置顶食谱
        if (!recipeId) {
          return NextResponse.json(
            { success: false, error: "缺少 recipeId" },
            { status: 400 }
          );
        }

        // 验证食谱存在
        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe) {
          return NextResponse.json(
            { success: false, error: "食谱不存在" },
            { status: 404 }
          );
        }

        // 如果已经置顶，先移除
        pinnedRecipeIds = pinnedRecipeIds.filter((rid) => rid !== recipeId);

        // 插入到指定位置或末尾
        if (typeof order === "number" && order >= 0) {
          pinnedRecipeIds.splice(order, 0, recipeId);
        } else {
          pinnedRecipeIds.push(recipeId);
        }

        // 从排除列表中移除（如果存在）
        excludedRecipeIds = excludedRecipeIds.filter((rid) => rid !== recipeId);
        break;
      }

      case "unpin": {
        // 取消置顶
        if (!recipeId) {
          return NextResponse.json(
            { success: false, error: "缺少 recipeId" },
            { status: 400 }
          );
        }
        pinnedRecipeIds = pinnedRecipeIds.filter((rid) => rid !== recipeId);
        break;
      }

      case "exclude": {
        // 排除食谱
        if (!recipeId) {
          return NextResponse.json(
            { success: false, error: "缺少 recipeId" },
            { status: 400 }
          );
        }

        // 从置顶列表中移除
        pinnedRecipeIds = pinnedRecipeIds.filter((rid) => rid !== recipeId);

        // 添加到排除列表
        if (!excludedRecipeIds.includes(recipeId)) {
          excludedRecipeIds.push(recipeId);
        }
        break;
      }

      case "include": {
        // 取消排除
        if (!recipeId) {
          return NextResponse.json(
            { success: false, error: "缺少 recipeId" },
            { status: 400 }
          );
        }
        excludedRecipeIds = excludedRecipeIds.filter((rid) => rid !== recipeId);
        break;
      }

      case "reorder": {
        // 调整置顶顺序
        if (!recipeIds || !Array.isArray(recipeIds)) {
          return NextResponse.json(
            { success: false, error: "缺少 recipeIds 数组" },
            { status: 400 }
          );
        }
        pinnedRecipeIds = recipeIds;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "未知操作: " + action },
          { status: 400 }
        );
    }

    // 更新聚合页
    const updated = await prisma.collection.update({
      where: { id },
      data: {
        pinnedRecipeIds,
        excludedRecipeIds,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        pinnedRecipeIds: updated.pinnedRecipeIds,
        excludedRecipeIds: updated.excludedRecipeIds,
      },
    });
  } catch (error) {
    console.error("执行操作失败:", error);
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}
