/**
 * 团队成员配置 API
 *
 * GET  /api/config/team - 获取所有团队成员
 * POST /api/config/team - 新增团队成员
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// 获取所有团队成员
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const members = await prisma.teamMember.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            exploredRecipes: true,
            reviewedRecipes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("获取团队成员失败:", error);
    return NextResponse.json(
      { success: false, error: "获取团队成员失败" },
      { status: 500 }
    );
  }
}

// 新增团队成员
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      nameZh,
      nameEn,
      role,
      bioZh,
      bioEn,
      mottoZh,
      mottoEn,
      avatarUrl,
      specialtyCuisines,
      specialtyRegions,
      sortOrder,
      isActive,
    } = body;

    // 验证必填字段
    if (!slug || !nameZh || !nameEn || !role) {
      return NextResponse.json(
        { success: false, error: "slug、中文名、英文名和角色为必填项" },
        { status: 400 }
      );
    }

    // 验证角色
    const validRoles = ["founder", "explorer", "chef", "nutritionist", "photographer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `角色必须是: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existing = await prisma.teamMember.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "该 slug 已存在" },
        { status: 400 }
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        slug,
        nameZh,
        nameEn,
        role,
        bioZh: bioZh || null,
        bioEn: bioEn || null,
        mottoZh: mottoZh || null,
        mottoEn: mottoEn || null,
        avatarUrl: avatarUrl || null,
        specialtyCuisines: specialtyCuisines || [],
        specialtyRegions: specialtyRegions || [],
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("新增团队成员失败:", error);
    return NextResponse.json(
      { success: false, error: "新增团队成员失败" },
      { status: 500 }
    );
  }
}
