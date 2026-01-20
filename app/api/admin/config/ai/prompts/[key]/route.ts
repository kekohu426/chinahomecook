/**
 * 单个提示词 API
 *
 * GET /api/admin/config/ai/prompts/[key] - 获取单个提示词
 * PUT /api/admin/config/ai/prompts/[key] - 更新提示词
 * DELETE /api/admin/config/ai/prompts/[key] - 重置为默认值
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPromptConfig, savePromptConfig, resetPromptConfig } from "@/lib/ai/prompt-manager";
import { getDefaultPrompt } from "@/lib/ai/default-prompts";

interface RouteContext {
  params: Promise<{ key: string }>;
}

// 获取单个提示词
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "请先登录" } },
        { status: 401 }
      );
    }

    const { key } = await context.params;
    const config = await getPromptConfig(key);

    if (!config) {
      return NextResponse.json(
        { success: false, error: { message: "提示词不存在" } },
        { status: 404 }
      );
    }

    // 同时返回默认值，方便前端对比
    const defaultPrompt = getDefaultPrompt(key);

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        defaultPrompt: defaultPrompt?.prompt,
        defaultSystemPrompt: defaultPrompt?.systemPrompt,
      },
    });
  } catch (error) {
    console.error("获取提示词失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "获取提示词失败" },
      },
      { status: 500 }
    );
  }
}

// 更新提示词
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "请先登录" } },
        { status: 401 }
      );
    }

    // 检查管理员权限
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "需要管理员权限" } },
        { status: 403 }
      );
    }

    const { key } = await context.params;
    const body = await request.json();
    const { prompt, systemPrompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: { message: "提示词内容不能为空" } },
        { status: 400 }
      );
    }

    const config = await savePromptConfig(key, {
      prompt,
      systemPrompt: systemPrompt || null,
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("更新提示词失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "更新提示词失败" },
      },
      { status: 500 }
    );
  }
}

// 重置为默认值
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "请先登录" } },
        { status: 401 }
      );
    }

    // 检查管理员权限
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "需要管理员权限" } },
        { status: 403 }
      );
    }

    const { key } = await context.params;
    const config = await resetPromptConfig(key);

    return NextResponse.json({
      success: true,
      data: config,
      message: "已重置为默认值",
    });
  } catch (error) {
    console.error("重置提示词失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "重置提示词失败" },
      },
      { status: 500 }
    );
  }
}
