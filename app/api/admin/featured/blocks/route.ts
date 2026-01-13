/**
 * 推荐位区块管理 API
 *
 * GET  /api/admin/featured/blocks - 获取所有区块配置
 * PUT  /api/admin/featured/blocks - 批量更新区块配置
 * PUT  /api/admin/featured/blocks/reorder - 重排序区块
 *
 * 区块类型：
 * - home_hero: 首页 Hero
 * - home_featured_hot: 首页热门精选
 * - home_featured_custom: 首页定制精选
 * - home_featured_gallery: 首页图库精选
 * - home_browse: 首页浏览入口
 * - home_tools: 首页工具介绍
 * - home_testimonials: 首页用户证言
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// 区块类型
type HomeBlockType =
  | "home_hero"
  | "home_featured_hot"
  | "home_featured_custom"
  | "home_featured_gallery"
  | "home_browse"
  | "home_tools"
  | "home_testimonials";

// 区块配置
interface HomeBlockConfig {
  type: HomeBlockType;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  settings?: Record<string, unknown>;
}

// 默认区块配置
const DEFAULT_BLOCKS: HomeBlockConfig[] = [
  { type: "home_hero", enabled: true, order: 1, title: "做饭，可以更简单" },
  { type: "home_featured_custom", enabled: true, order: 2, title: "AI 定制食谱精选" },
  { type: "home_browse", enabled: true, order: 3, title: "或者，直接浏览食谱" },
  { type: "home_featured_hot", enabled: true, order: 4, title: "本周精选家常菜" },
  { type: "home_featured_gallery", enabled: true, order: 5, title: "高清美食图片库" },
  { type: "home_tools", enabled: true, order: 6, title: "烹饪模式" },
  { type: "home_testimonials", enabled: true, order: 7, title: "用户证言" },
];

const CONFIG_SECTION = "home_blocks_config";

/**
 * GET /api/admin/featured/blocks
 * 获取所有区块配置
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const config = await prisma.homeConfig.findFirst({
      where: { section: CONFIG_SECTION },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_BLOCKS,
      });
    }

    const content = (config.content as Record<string, unknown>) || {};
    const blocks = (content.blocks as HomeBlockConfig[]) || DEFAULT_BLOCKS;

    return NextResponse.json({
      success: true,
      data: blocks,
    });
  } catch (error) {
    console.error("获取区块配置失败:", error);
    return NextResponse.json({ success: false, error: "获取区块配置失败" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/featured/blocks
 * 批量更新区块配置
 */
export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { blocks } = body as { blocks: HomeBlockConfig[] };

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json(
        { success: false, error: "blocks 必须是数组" },
        { status: 400 }
      );
    }

    // 验证区块配置
    for (const block of blocks) {
      if (!block.type || typeof block.enabled !== "boolean" || typeof block.order !== "number") {
        return NextResponse.json(
          { success: false, error: "区块配置格式错误" },
          { status: 400 }
        );
      }
    }

    // 查找现有配置
    const existing = await prisma.homeConfig.findFirst({
      where: { section: CONFIG_SECTION },
    });

    if (existing) {
      await prisma.homeConfig.update({
        where: { id: existing.id },
        data: {
          content: { blocks } as object,
        },
      });
    } else {
      await prisma.homeConfig.create({
        data: {
          section: CONFIG_SECTION,
          content: { blocks } as object,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "区块配置已更新",
      data: blocks,
    });
  } catch (error) {
    console.error("更新区块配置失败:", error);
    return NextResponse.json({ success: false, error: "更新区块配置失败" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/featured/blocks
 * 更新单个区块配置
 */
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { type, ...updates } = body as { type: HomeBlockType } & Partial<HomeBlockConfig>;

    if (!type) {
      return NextResponse.json(
        { success: false, error: "type 不能为空" },
        { status: 400 }
      );
    }

    // 获取现有配置
    const config = await prisma.homeConfig.findFirst({
      where: { section: CONFIG_SECTION },
    });

    let blocks: HomeBlockConfig[] = DEFAULT_BLOCKS;
    if (config) {
      const content = (config.content as Record<string, unknown>) || {};
      blocks = (content.blocks as HomeBlockConfig[]) || DEFAULT_BLOCKS;
    }

    // 更新指定区块
    const blockIndex = blocks.findIndex((b) => b.type === type);
    if (blockIndex === -1) {
      return NextResponse.json(
        { success: false, error: "区块不存在" },
        { status: 404 }
      );
    }

    blocks[blockIndex] = { ...blocks[blockIndex], ...updates };

    // 保存
    if (config) {
      await prisma.homeConfig.update({
        where: { id: config.id },
        data: {
          content: { blocks } as object,
        },
      });
    } else {
      await prisma.homeConfig.create({
        data: {
          section: CONFIG_SECTION,
          content: { blocks } as object,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "区块已更新",
      data: blocks[blockIndex],
    });
  } catch (error) {
    console.error("更新区块失败:", error);
    return NextResponse.json({ success: false, error: "更新区块失败" }, { status: 500 });
  }
}
