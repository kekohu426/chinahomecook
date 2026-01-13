/**
 * 单个标签 API
 *
 * GET    /api/admin/tags/[id] - 获取单个标签
 * PUT    /api/admin/tags/[id] - 更新标签
 * DELETE /api/admin/tags/[id] - 删除标签
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tags/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("获取标签失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tags/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // 如果要更新 slug，检查是否已存在
    if (body.slug) {
      const existing = await prisma.tag.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "该 slug 已存在" },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        type: body.type,
        name: body.name,
        slug: body.slug,
        icon: body.icon,
        color: body.color,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      },
      include: { translations: true },
    });

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("更新标签失败:", error);
    return NextResponse.json(
      { success: false, error: "更新标签失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tags/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 检查是否有关联的菜谱
    const recipeCount = await prisma.recipeTag.count({
      where: { tagId: id },
    });

    if (recipeCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `无法删除：该标签关联了 ${recipeCount} 个菜谱`,
        },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "标签已删除",
    });
  } catch (error) {
    console.error("删除标签失败:", error);
    return NextResponse.json(
      { success: false, error: "删除标签失败" },
      { status: 500 }
    );
  }
}
