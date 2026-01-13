/**
 * 食材图标库 API
 *
 * 设计：直接复用 Ingredient 表的 iconKey/iconUrl 字段，不单独建 Icon 表。
 * - GET  返回带 icon 信息的食材列表（可作为图标库使用）
 * - POST 新增/更新指定食材的图标（按 name upsert，避免重复）
 *
 * 额外元数据（aliases/source/prompt/sortOrder/isActive）保存在 Ingredient.transStatus 中的 icon* 字段。
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IconMeta = {
  iconAliases?: string[];
  iconSource?: string | null;
  iconPrompt?: string | null;
  iconSortOrder?: number;
  iconActive?: boolean;
};

const normalizeAliases = (aliases?: unknown): string[] =>
  Array.isArray(aliases)
    ? aliases.map((a) => String(a).trim()).filter(Boolean)
    : [];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "") || "icon";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });

    const data = ingredients.map((item) => {
      const meta = (item.transStatus as IconMeta) || {};
      return {
        id: item.id,
        name: item.name,
        aliases: normalizeAliases(meta.iconAliases),
        iconUrl: item.iconUrl,
        prompt: meta.iconPrompt || null,
        source: meta.iconSource || null,
        sortOrder: meta.iconSortOrder ?? 0,
        isActive: meta.iconActive ?? true,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("获取食材图标失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食材图标失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const name = (body.name as string)?.trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "名称为必填项" },
        { status: 400 }
      );
    }

    const aliases = normalizeAliases(body.aliases);
    const iconUrl = (body.iconUrl as string | undefined)?.trim() || null;
    const iconKey = (body.iconKey as string | undefined)?.trim() || slugify(name);
    const meta: IconMeta = {
      iconAliases: aliases,
      iconSource: (body.source as string | undefined) || null,
      iconPrompt: (body.prompt as string | undefined) || null,
      iconSortOrder: Number(body.sortOrder) || 0,
      iconActive: body.isActive ?? true,
    };

    // 按名称 upsert，避免重复食材
    const existing = await prisma.ingredient.findUnique({ where: { name } });

    const ingredient = existing
      ? await prisma.ingredient.update({
          where: { id: existing.id },
          data: {
            name,
            iconKey,
            iconUrl,
            transStatus: { ...(existing.transStatus as object), ...meta },
          },
        })
      : await prisma.ingredient.create({
          data: {
            name,
            iconKey,
            iconUrl,
            transStatus: meta,
          },
        });

    return NextResponse.json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        aliases,
        iconUrl: ingredient.iconUrl,
        prompt: meta.iconPrompt || null,
        source: meta.iconSource || null,
        sortOrder: meta.iconSortOrder ?? 0,
        isActive: meta.iconActive ?? true,
      },
    });
  } catch (error) {
    console.error("保存食材图标失败:", error);
    return NextResponse.json(
      { success: false, error: "保存食材图标失败" },
      { status: 500 }
    );
  }
}
