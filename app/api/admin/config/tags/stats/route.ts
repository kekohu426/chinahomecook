/**
 * 标签统计 API (适配新 Schema)
 *
 * 所有标签已迁移到统一的 Tag 模型
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "需要管理员权限" }, { status: 403 });
  return null;
}

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const [sceneCount, methodCount, tasteCount, crowdCount, occasionCount] =
      await Promise.all([
        prisma.tag.count({ where: { type: "scene" } }),
        prisma.tag.count({ where: { type: "method" } }),
        prisma.tag.count({ where: { type: "taste" } }),
        prisma.tag.count({ where: { type: "crowd" } }),
        prisma.tag.count({ where: { type: "occasion" } }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        scene: sceneCount,
        method: methodCount,
        taste: tasteCount,
        crowd: crowdCount,
        occasion: occasionCount,
      },
    });
  } catch (error) {
    console.error("获取标签统计失败:", error);
    return NextResponse.json({ success: false, error: "获取标签统计失败" }, { status: 500 });
  }
}
