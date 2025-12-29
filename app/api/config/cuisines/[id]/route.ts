/**
 * 单个菜系配置 API
 *
 * GET    /api/config/cuisines/[id] - 获取单个菜系
 * PUT    /api/config/cuisines/[id] - 更新菜系
 * DELETE /api/config/cuisines/[id] - 删除菜系
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/config/cuisines/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const cuisine = await prisma.cuisine.findUnique({
      where: { id },
    });

    if (!cuisine) {
      return NextResponse.json(
        { success: false, error: "菜系不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cuisine,
    });
  } catch (error) {
    console.error("获取菜系失败:", error);
    return NextResponse.json(
      { success: false, error: "获取菜系失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/config/cuisines/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const cuisine = await prisma.cuisine.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        slug: body.slug,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: cuisine,
    });
  } catch (error) {
    console.error("更新菜系失败:", error);
    return NextResponse.json(
      { success: false, error: "更新菜系失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/config/cuisines/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.cuisine.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "菜系已删除",
    });
  } catch (error) {
    console.error("删除菜系失败:", error);
    return NextResponse.json(
      { success: false, error: "删除菜系失败" },
      { status: 500 }
    );
  }
}
