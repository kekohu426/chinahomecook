/**
 * 推荐位管理 API (适配新 Schema)
 *
 * HomeConfig 使用 section 而不是 key，内容存储在独立字段
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// 推荐位 section 名称
const FEATURED_SECTIONS = {
  HOME_HOT: "featured_hot",
  HOME_CUSTOM: "featured_custom",
  HOME_GALLERY: "featured_gallery",
  RECIPE_PAGE: "recipe_page_config",
};

// 默认配置
const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  [FEATURED_SECTIONS.HOME_HOT]: {
    recipeIds: [],
    autoFill: true,
    maxCount: 12,
  },
  [FEATURED_SECTIONS.HOME_CUSTOM]: {
    recipeIds: [],
    maxCount: 8,
  },
  [FEATURED_SECTIONS.HOME_GALLERY]: {
    recipeIds: [],
    maxCount: 16,
  },
  [FEATURED_SECTIONS.RECIPE_PAGE]: {
    defaultSort: "latest",
    pinnedRecipeIds: [],
    h1: "中国美食食谱大全",
    subtitle: "系统整理中国各地家常菜做法，按菜系/场景快速找到适合做的菜。",
    footerText: "Recipe Zen 收录了中国各地经典家常菜做法...",
  },
};

// GET: 获取所有推荐位配置
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || searchParams.get("key");

    if (section) {
      // 获取单个配置
      const config = await prisma.homeConfig.findFirst({
        where: { section },
      });

      if (!config) {
        return NextResponse.json({
          success: true,
          data: DEFAULT_CONFIGS[section] ?? null,
        });
      }

      // 合并 content JSON 和默认配置
      const content = (config.content as Record<string, unknown>) || {};
      return NextResponse.json({
        success: true,
        data: {
          ...DEFAULT_CONFIGS[section],
          ...content,
          title: config.title,
          subtitle: config.subtitle,
          recipeIds: config.recipeIds,
        },
      });
    }

    // 获取所有推荐位配置
    const configs = await prisma.homeConfig.findMany({
      where: {
        section: { in: Object.values(FEATURED_SECTIONS) },
      },
    });

    // 合并默认配置和数据库配置
    const result: Record<string, Record<string, unknown>> = {};
    for (const sectionKey of Object.values(FEATURED_SECTIONS)) {
      result[sectionKey] = { ...DEFAULT_CONFIGS[sectionKey] };
    }

    for (const config of configs) {
      const content = (config.content as Record<string, unknown>) || {};
      result[config.section] = {
        ...result[config.section],
        ...content,
        title: config.title,
        subtitle: config.subtitle,
        recipeIds: config.recipeIds,
      };
    }

    // 获取推荐的食谱详情
    const allRecipeIds = new Set<string>();
    for (const sectionKey of Object.values(FEATURED_SECTIONS)) {
      const ids = (result[sectionKey]?.recipeIds as string[]) || [];
      ids.forEach((id) => allRecipeIds.add(id));
    }

    let recipesMap: Record<string, unknown> = {};
    if (allRecipeIds.size > 0) {
      const recipes = await prisma.recipe.findMany({
        where: { id: { in: Array.from(allRecipeIds) } },
        select: {
          id: true,
          title: true,
          coverImage: true,
          cuisineId: true,
          status: true,
          viewCount: true,
          createdAt: true,
        },
      });
      recipesMap = Object.fromEntries(
        recipes.map((r) => [
          r.id,
          {
            ...r,
            titleZh: r.title, // 兼容前端
            isPublished: r.status === "published",
          },
        ])
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      recipesMap,
    });
  } catch (error) {
    console.error("获取推荐位配置失败:", error);
    return NextResponse.json({ success: false, error: "获取推荐位配置失败" }, { status: 500 });
  }
}

// POST: 更新推荐位配置
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { key, section: sectionFromBody, value } = body;
    const section = sectionFromBody || key;

    if (!section || !Object.values(FEATURED_SECTIONS).includes(section)) {
      return NextResponse.json({ success: false, error: "无效的配置 section" }, { status: 400 });
    }

    if (value === undefined) {
      return NextResponse.json({ success: false, error: "value 不能为空" }, { status: 400 });
    }

    // 提取特定字段
    const { title, subtitle, recipeIds, ...restContent } = value as Record<string, unknown>;

    // 查找现有配置
    const existing = await prisma.homeConfig.findFirst({ where: { section } });

    if (existing) {
      const config = await prisma.homeConfig.update({
        where: { id: existing.id },
        data: {
          title: title as string | null,
          subtitle: subtitle as string | null,
          recipeIds: (recipeIds as string[]) || [],
          content: restContent as object,
        },
      });
      return NextResponse.json({ success: true, data: config });
    } else {
      const config = await prisma.homeConfig.create({
        data: {
          section,
          title: title as string | null,
          subtitle: subtitle as string | null,
          recipeIds: (recipeIds as string[]) || [],
          content: restContent as object,
        },
      });
      return NextResponse.json({ success: true, data: config });
    }
  } catch (error) {
    console.error("更新推荐位配置失败:", error);
    return NextResponse.json({ success: false, error: "更新推荐位配置失败" }, { status: 500 });
  }
}
