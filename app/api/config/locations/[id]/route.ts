/**
 * 单个地点配置 API
 *
 * GET    /api/config/locations/[id] - 获取单个地点
 * PUT    /api/config/locations/[id] - 更新地点
 * DELETE /api/config/locations/[id] - 删除地点
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { syncCollectionForTag, handleCollectionOnTagDelete } from "@/lib/collection/sync";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/config/locations/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: "地点不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("获取地点失败:", error);
    return NextResponse.json(
      { success: false, error: "获取地点失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/config/locations/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const location = await prisma.location.update({
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

    // 同步 Collection 信息
    if (body.name !== undefined || body.slug !== undefined) {
      await syncCollectionForTag("region", id, { name: body.name, slug: body.slug });
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("更新地点失败:", error);
    return NextResponse.json(
      { success: false, error: "更新地点失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/config/locations/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 处理关联的 Collection
    await handleCollectionOnTagDelete("region", id);

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "地点已删除",
    });
  } catch (error) {
    console.error("删除地点失败:", error);
    return NextResponse.json(
      { success: false, error: "删除地点失败" },
      { status: 500 }
    );
  }
}
