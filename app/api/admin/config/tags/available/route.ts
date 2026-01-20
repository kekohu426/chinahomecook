/**
 * 获取所有可用标签 API
 *
 * GET /api/admin/config/tags/available - 获取所有标签类型的可用标签
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // 从 Tag 表获取所有活跃的标签
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // 按类型分组标签，返回完整的标签对象（包含 id 和 name）
    const tagsByType = {
      scenes: [] as Array<{ id: string; name: string; slug: string }>,
      cookingMethods: [] as Array<{ id: string; name: string; slug: string }>,
      tastes: [] as Array<{ id: string; name: string; slug: string }>,
      crowds: [] as Array<{ id: string; name: string; slug: string }>,
      occasions: [] as Array<{ id: string; name: string; slug: string }>,
    };

    tags.forEach((tag) => {
      const tagObj = { id: tag.id, name: tag.name, slug: tag.slug };
      switch (tag.type) {
        case 'scene':
          tagsByType.scenes.push(tagObj);
          break;
        case 'method':
          tagsByType.cookingMethods.push(tagObj);
          break;
        case 'taste':
          tagsByType.tastes.push(tagObj);
          break;
        case 'crowd':
          tagsByType.crowds.push(tagObj);
          break;
        case 'occasion':
          tagsByType.occasions.push(tagObj);
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: tagsByType,
    });
  } catch (error) {
    console.error("获取可用标签失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取可用标签失败",
      },
      { status: 500 }
    );
  }
}
