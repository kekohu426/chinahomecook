/**
 * AI 智能主厨 API 路由
 *
 * POST /api/ai/chef
 * 用于回答用户关于食谱的问题
 */

import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai";

// 系统提示词：定义 AI 主厨的角色和行为
const CHEF_SYSTEM_PROMPT = `你是一位经验丰富的中国美食主厨，专注于帮助用户理解和制作中国菜肴。

你的特点：
- 专业但亲切，像朋友一样温柔地解答问题
- 提供实用的烹饪技巧和替代方案
- 关注食材的特性和烹饪原理
- 用简单易懂的语言解释复杂的烹饪概念

回答要求：
- 简洁明了，控制在 100-200 字
- 如果涉及替代食材，说明可能的味道差异
- 如果涉及技巧，解释背后的原理
- 保持温暖治愈的语气`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, recipeTitle, recipeContext } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "问题不能为空" },
        { status: 400 }
      );
    }

    // 构建完整的提示词
    let fullPrompt = question;

    if (recipeTitle) {
      fullPrompt = `关于《${recipeTitle}》这道菜的问题：\n\n${question}`;
    }

    if (recipeContext) {
      fullPrompt += `\n\n相关信息：${recipeContext}`;
    }

    // 调用 AI
    const answer = await chat(fullPrompt, {
      systemPrompt: CHEF_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 500,
    });

    return NextResponse.json({
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Chef API Error:", error);

    // 友好的错误提示
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return NextResponse.json(
        { error: "AI 服务未配置，请联系管理员" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "AI 服务暂时不可用，请稍后再试" },
      { status: 500 }
    );
  }
}
