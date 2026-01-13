/**
 * AI 配置管理 API
 *
 * GET  /api/admin/config/ai - 获取配置
 * PUT  /api/admin/config/ai - 更新配置
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

const DEFAULT_CONFIG_ID = "default";

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

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    let config = await prisma.aIConfig.findUnique({
      where: { id: DEFAULT_CONFIG_ID },
    });

    if (!config) {
      config = await prisma.aIConfig.create({
        data: { id: DEFAULT_CONFIG_ID },
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("获取 AI 配置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取 AI 配置失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();

    const config = await prisma.aIConfig.upsert({
      where: { id: DEFAULT_CONFIG_ID },
      update: {
        textProvider: body.textProvider ?? null,
        textApiKey: body.textApiKey ?? null,
        textBaseUrl: body.textBaseUrl ?? null,
        textModel: body.textModel ?? null,
        imageProvider: body.imageProvider ?? null,
        imageApiKey: body.imageApiKey ?? null,
        imageBaseUrl: body.imageBaseUrl ?? null,
        imageModel: body.imageModel ?? null,
        imageNegativePrompt: body.imageNegativePrompt ?? null,
        transProvider: body.transProvider ?? null,
        transApiKey: body.transApiKey ?? null,
        transBaseUrl: body.transBaseUrl ?? null,
        transModel: body.transModel ?? null,
        recipePrompt: body.recipePrompt ?? body.recipePromptTemplate ?? null,
        recipeSystemPrompt: body.recipeSystemPrompt ?? null,
        transPrompt: body.transPrompt ?? null,
      },
      create: {
        id: DEFAULT_CONFIG_ID,
        textProvider: body.textProvider ?? null,
        textApiKey: body.textApiKey ?? null,
        textBaseUrl: body.textBaseUrl ?? null,
        textModel: body.textModel ?? null,
        imageProvider: body.imageProvider ?? null,
        imageApiKey: body.imageApiKey ?? null,
        imageBaseUrl: body.imageBaseUrl ?? null,
        imageModel: body.imageModel ?? null,
        imageNegativePrompt: body.imageNegativePrompt ?? null,
        transProvider: body.transProvider ?? null,
        transApiKey: body.transApiKey ?? null,
        transBaseUrl: body.transBaseUrl ?? null,
        transModel: body.transModel ?? null,
        recipePrompt: body.recipePrompt ?? body.recipePromptTemplate ?? null,
        recipeSystemPrompt: body.recipeSystemPrompt ?? null,
        transPrompt: body.transPrompt ?? null,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("更新 AI 配置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新 AI 配置失败" },
      { status: 500 }
    );
  }
}
