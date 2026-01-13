/**
 * 标签管理 API
 *
 * GET  /api/admin/tags - 获取标签列表
 * POST /api/admin/tags - 创建标签
 *
 * 标签类型: scene/taste/method/crowd/occasion
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/tags
 *
 * Query params:
 * - type: 标签类型 (scene/taste/method/crowd/occasion)
 * - active: 是否只返回启用的标签
 * - locale: 返回指定语言的翻译
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const activeOnly = searchParams.get("active") === "true";
    const locale = searchParams.get("locale");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (activeOnly) where.isActive = true;

    const tags = await prisma.tag.findMany({
      where,
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      include: {
        translations: locale ? { where: { locale } } : true,
      },
    });

    const formatted = tags.map((tag) => {
      const translation = locale
        ? tag.translations.find((t) => t.locale === locale)
        : null;

      return {
        id: tag.id,
        type: tag.type,
        name: translation?.name || tag.name,
        originalName: tag.name,
        slug: tag.slug,
        icon: tag.icon,
        color: tag.color,
        isActive: tag.isActive,
        sortOrder: tag.sortOrder,
        transStatus: tag.transStatus,
        translations: tag.translations,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("获取标签列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tags
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, slug, icon, color, isActive, sortOrder } = body;

    if (!type || !name || !slug) {
      return NextResponse.json(
        { success: false, error: "type, name, slug 为必填项" },
        { status: 400 }
      );
    }

    // 验证标签类型
    const validTypes = ["scene", "taste", "method", "crowd", "occasion"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `type 必须是: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // 检查 slug 是否已存在
    const existing = await prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该 slug 已存在" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        type,
        name,
        slug,
        icon: icon || null,
        color: color || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        transStatus: {},
      },
    });

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("创建标签失败:", error);
    return NextResponse.json(
      { success: false, error: "创建标签失败" },
      { status: 500 }
    );
  }
}
