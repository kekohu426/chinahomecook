/**
 * 定制菜谱 - 推荐食谱名称 API
 *
 * POST /api/custom-recipes/suggest - 根据用户需求推荐食谱名称
 */

import { NextRequest, NextResponse } from "next/server";
import { getTextProvider } from "@/lib/ai/provider";

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

    const systemPrompt = `你是一位专业的中国美食顾问，精通各地菜系和健康饮食。
用户会告诉你他们的饮食需求或限制，你需要推荐3-5个合适的中国菜谱名称。

要求：
1. 菜谱名称要具体、地道，是真实存在的中国菜
2. 考虑用户的健康需求（如糖尿病、减肥、低盐等）
3. 提供简短的推荐理由（1-2句话）
4. 返回纯 JSON 格式，不要包含其他文字

返回格式：
{
  "suggestions": [
    { "name": "菜谱名称", "reason": "推荐理由" }
  ]
}`;

    const response = await provider.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `用户需求：${prompt.trim()}` },
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
