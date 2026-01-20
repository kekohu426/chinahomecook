/**
 * AI 提示词列表 API
 *
 * GET /api/admin/config/ai/prompts - 获取所有提示词配置
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllPromptConfigs } from "@/lib/ai/prompt-manager";
import { CATEGORY_LABELS } from "@/lib/ai/default-prompts";

export async function GET() {
  try {
    // 验证登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "请先登录" } },
        { status: 401 }
      );
    }

    // 获取所有提示词配置
    const prompts = await getAllPromptConfigs();

    // 按分类分组
    const grouped: Record<string, typeof prompts> = {};
    for (const prompt of prompts) {
      if (!grouped[prompt.category]) {
        grouped[prompt.category] = [];
      }
      grouped[prompt.category].push(prompt);
    }

    return NextResponse.json({
      success: true,
      data: {
        prompts,
        grouped,
        categoryLabels: CATEGORY_LABELS,
      },
    });
  } catch (error) {
    console.error("获取提示词列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "获取提示词列表失败" },
      },
      { status: 500 }
    );
  }
}
