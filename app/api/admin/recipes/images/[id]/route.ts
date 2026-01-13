/**
 * 后台食谱图片管理 API
 *
 * PATCH /api/admin/recipes/images/[id] - 更新食谱图片字段
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 检查管理员权限
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "需要管理员权限" },
      { status: 403 }
    );
  }
  return null;
}

const ImageShotSchema = z.object({
  key: z.string().optional().default(""),
  imagePrompt: z.string().optional().default(""),
  ratio: z.enum(["16:9", "4:3", "3:2"]).default("4:3"),
  imageUrl: z.string().optional().nullable(),
});

const BodySchema = z.object({
  imageShots: z.array(ImageShotSchema).optional(),
  coverImage: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "数据验证失败", details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (parsed.data.imageShots === undefined && parsed.data.coverImage === undefined) {
      return NextResponse.json(
        { success: false, error: "至少需要更新一个字段" },
        { status: 400 }
      );
    }

    const existing = await prisma.recipe.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (parsed.data.imageShots !== undefined) {
      data.imageShots = parsed.data.imageShots.map((shot) => ({
        ...shot,
        imageUrl: shot.imageUrl || undefined,
      }));
    }

    if (parsed.data.coverImage !== undefined) {
      data.coverImage = parsed.data.coverImage || null;
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data,
      select: {
        id: true,
        coverImage: true,
        imageShots: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: recipe });
  } catch (error) {
    console.error("更新食谱图片失败:", error);
    return NextResponse.json(
      { success: false, error: "更新食谱图片失败" },
      { status: 500 }
    );
  }
}
