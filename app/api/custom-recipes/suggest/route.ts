/**
 * 定制菜谱 - 推荐食谱名称 API
 *
 * POST /api/custom-recipes/suggest - 根据用户需求推荐食谱名称
 */

import { NextRequest, NextResponse } from "next/server";
import { getTextProvider } from "@/lib/ai/provider";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "请输入您的需求（至少2个字符）" },
        { status: 400 }
      );
    }

    const provider = await getTextProvider();

    const applied = await getAppliedPrompt("custom_recipe_suggest", {
      userPrompt: prompt.trim(),
    });

    const response = await provider.chat({
      messages: [
        ...(applied?.systemPrompt
          ? [{ role: "system" as const, content: applied.systemPrompt }]
          : []),
        { role: "user" as const, content: applied?.prompt || `用户需求：${prompt.trim()}` },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    // 解析响应
    let suggestions;
    try {
      const content = response.content.trim();
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法解析响应");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      suggestions = parsed.suggestions;

      if (!Array.isArray(suggestions)) {
        throw new Error("响应格式错误");
      }
    } catch (parseError) {
      console.error("解析 AI 响应失败:", parseError);
      return NextResponse.json(
        { success: false, error: "AI 响应解析失败，请重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("推荐食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "推荐食谱失败，请稍后重试" },
      { status: 500 }
    );
  }
}
