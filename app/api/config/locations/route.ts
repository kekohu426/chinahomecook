/**
 * 地点配置 API
 *
 * GET  /api/config/locations - 获取所有地点
 * POST /api/config/locations - 创建地点
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/config/locations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const locations = await prisma.location.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("获取地点列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取地点列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/locations
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

    const location = await prisma.location.create({
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
      data: location,
    });
  } catch (error) {
    console.error("创建地点失败:", error);
    return NextResponse.json(
      { success: false, error: "创建地点失败" },
      { status: 500 }
    );
  }
}
