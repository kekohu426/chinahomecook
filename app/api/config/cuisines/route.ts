/**
 * 菜系配置 API
 *
 * GET  /api/config/cuisines - 获取所有菜系
 * POST /api/config/cuisines - 创建菜系
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/config/cuisines
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const cuisines = await prisma.cuisine.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: cuisines,
    });
  } catch (error) {
    console.error("获取菜系列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取菜系列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/cuisines
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, slug, isActive, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "name 和 slug 为必填项" },
        { status: 400 }
      );
    }

    const cuisine = await prisma.cuisine.create({
      data: {
        name,
        description,
        slug,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: cuisine,
    });
  } catch (error) {
    console.error("创建菜系失败:", error);
    return NextResponse.json(
      { success: false, error: "创建菜系失败" },
      { status: 500 }
    );
  }
}
