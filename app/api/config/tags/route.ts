/**
 * 标签配置 API
 *
 * GET /api/config/tags - 获取所有标签字典数据
 *
 * 返回所有激活的标签，按类型分组
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get("locale") || "zh-CN";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereActive = includeInactive ? {} : { isActive: true };

    // 使用统一的 Tag 模型获取所有标签
    const tags = await prisma.tag.findMany({
      where: whereActive,
      orderBy: { sortOrder: "asc" },
      include: {
        translations: {
          where: { locale },
          select: { name: true },
        },
      },
    });

    // 按类型分组
    const groupedTags: Record<string, any[]> = {
      scenes: [],
      cookingMethods: [],
      tastes: [],
      crowds: [],
      occasions: [],
    };

    // 格式化并分组
    for (const tag of tags) {
      const formatted = {
        id: tag.id,
        slug: tag.slug,
        name: tag.translations[0]?.name || tag.name,
        iconUrl: tag.icon,
        isActive: tag.isActive,
      };

      switch (tag.type) {
        case "scene":
          groupedTags.scenes.push(formatted);
          break;
        case "method":
          groupedTags.cookingMethods.push(formatted);
          break;
        case "taste":
          groupedTags.tastes.push(formatted);
          break;
        case "crowd":
          groupedTags.crowds.push(formatted);
          break;
        case "occasion":
          groupedTags.occasions.push(formatted);
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: groupedTags,
    });
  } catch (error) {
    console.error("获取标签配置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签配置失败" },
      { status: 500 }
    );
  }
}
