/**
 * 单个团队成员 API
 *
 * GET    /api/config/team/[id] - 获取单个成员
 * PUT    /api/config/team/[id] - 更新成员
 * DELETE /api/config/team/[id] - 删除成员
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个成员
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const member = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exploredRecipes: true,
            reviewedRecipes: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "成员不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("获取成员失败:", error);
    return NextResponse.json(
      { success: false, error: "获取成员失败" },
      { status: 500 }
    );
  }
}

// 更新成员
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // 检查成员是否存在
    const existing = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "成员不存在" },
        { status: 404 }
      );
    }

    // 如果修改了 slug，检查是否与其他成员冲突
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.teamMember.findUnique({
        where: { slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: "该 slug 已被其他成员使用" },
          { status: 400 }
        );
      }
    }

    // 验证角色
    if (role) {
      const validRoles = ["founder", "explorer", "chef", "nutritionist", "photographer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: `角色必须是: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(nameZh !== undefined && { nameZh }),
        ...(nameEn !== undefined && { nameEn }),
        ...(role !== undefined && { role }),
        ...(bioZh !== undefined && { bioZh: bioZh || null }),
        ...(bioEn !== undefined && { bioEn: bioEn || null }),
        ...(mottoZh !== undefined && { mottoZh: mottoZh || null }),
        ...(mottoEn !== undefined && { mottoEn: mottoEn || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
        ...(specialtyCuisines !== undefined && { specialtyCuisines }),
        ...(specialtyRegions !== undefined && { specialtyRegions }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("更新成员失败:", error);
    return NextResponse.json(
      { success: false, error: "更新成员失败" },
      { status: 500 }
    );
  }
}

// 删除成员
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 检查成员是否存在
    const existing = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exploredRecipes: true,
            reviewedRecipes: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "成员不存在" },
        { status: 404 }
      );
    }

    // 检查是否有关联的食谱
    const totalRecipes =
      existing._count.exploredRecipes + existing._count.reviewedRecipes;

    if (totalRecipes > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `该成员已关联 ${totalRecipes} 个食谱，请先解除关联后再删除`,
        },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除成员失败:", error);
    return NextResponse.json(
      { success: false, error: "删除成员失败" },
      { status: 500 }
    );
  }
}
