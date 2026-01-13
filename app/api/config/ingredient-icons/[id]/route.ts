/**
 * 单个食材图标 API
 *
 * 直接操作 Ingredient 表的 iconKey/iconUrl，并将扩展字段保存在 transStatus.icon* 中。
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeAliases = (aliases?: unknown): string[] =>
  Array.isArray(aliases)
    ? aliases.map((a) => String(a).trim()).filter(Boolean)
    : [];

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "未找到食材图标" },
        { status: 404 }
      );
    }

    const meta = (ingredient.transStatus as any) || {};
    return NextResponse.json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        aliases: normalizeAliases(meta.iconAliases),
        iconUrl: ingredient.iconUrl,
        prompt: meta.iconPrompt || null,
        source: meta.iconSource || null,
        sortOrder: meta.iconSortOrder ?? 0,
        isActive: meta.iconActive ?? true,
      },
    });
  } catch (error) {
    console.error("获取食材图标失败:", error);
    return NextResponse.json(
      { success: false, error: "获取食材图标失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const name = (body.name as string | undefined)?.trim();
    const aliases = normalizeAliases(body.aliases);
    const iconUrl = (body.iconUrl as string | undefined)?.trim() || null;

    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "未找到食材图标" },
        { status: 404 }
      );
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        iconUrl,
        iconKey: (body.iconKey as string | undefined)?.trim() || undefined,
        transStatus: {
          ...(existing.transStatus as object),
          iconAliases: aliases,
          iconSource: body.source ?? null,
          iconPrompt: body.prompt ?? null,
          iconSortOrder: Number(body.sortOrder) || 0,
          iconActive: body.isActive ?? true,
        },
      },
    });

    const meta = ingredient.transStatus as any;
    return NextResponse.json({
      success: true,
      data: {
        id: ingredient.id,
        name: ingredient.name,
        aliases: normalizeAliases(meta.iconAliases),
        iconUrl: ingredient.iconUrl,
        prompt: meta.iconPrompt || null,
        source: meta.iconSource || null,
        sortOrder: meta.iconSortOrder ?? 0,
        isActive: meta.iconActive ?? true,
      },
    });
  } catch (error) {
    console.error("更新食材图标失败:", error);
    return NextResponse.json(
      { success: false, error: "更新食材图标失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "未找到食材图标" },
        { status: 404 }
      );
    }

    await prisma.ingredient.update({
      where: { id },
      data: {
        iconUrl: null,
        iconKey: null,
        transStatus: {
          ...(existing.transStatus as object),
          iconAliases: [],
          iconSource: null,
          iconPrompt: null,
          iconSortOrder: 0,
          iconActive: false,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除食材图标失败:", error);
    return NextResponse.json(
      { success: false, error: "删除食材图标失败" },
      { status: 500 }
    );
  }
}
