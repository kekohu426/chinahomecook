/**
 * AI 配置管理 API
 *
 * GET  /api/admin/config/ai - 获取配置
 * PUT  /api/admin/config/ai - 更新配置
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { DEFAULT_RECIPE_PROMPT, DEFAULT_SEO_PROMPT } from "@/lib/ai/prompts";
import { clearImageConfigCache } from "@/lib/ai/evolink";

const DEFAULT_CONFIG_ID = "default";

function normalizeText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return String(value);
}

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

    const resolvedConfig = {
      ...config,
      recipePrompt: config.recipePrompt?.trim()
        ? config.recipePrompt
        : DEFAULT_RECIPE_PROMPT,
      seoPrompt: config.seoPrompt?.trim() ? config.seoPrompt : DEFAULT_SEO_PROMPT,
    };

    return NextResponse.json({ success: true, data: resolvedConfig });
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
        recipePrompt: normalizeText(body.recipePrompt ?? body.recipePromptTemplate),
        recipeSystemPrompt: normalizeText(body.recipeSystemPrompt),
        transPrompt: normalizeText(body.transPrompt),
        seoPrompt: normalizeText(body.seoPrompt),
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
        recipePrompt: normalizeText(body.recipePrompt ?? body.recipePromptTemplate),
        recipeSystemPrompt: normalizeText(body.recipeSystemPrompt),
        transPrompt: normalizeText(body.transPrompt),
        seoPrompt: normalizeText(body.seoPrompt),
      },
    });

    // 清除图像配置缓存，使新配置立即生效
    clearImageConfigCache();

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("更新 AI 配置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新 AI 配置失败" },
      { status: 500 }
    );
  }
}
