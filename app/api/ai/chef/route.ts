/**
 * AI 智能主厨 API 路由
 *
 * POST /api/ai/chef
 * 用于回答用户关于食谱的问题
 */

import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";

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

    let fullQuestion = question;
    if (recipeTitle) {
      fullQuestion = `关于《${recipeTitle}》这道菜的问题：\n\n${question}`;
    }
    if (recipeContext) {
      fullQuestion += `\n\n相关信息：${recipeContext}`;
    }

    const applied = await getAppliedPrompt("chef_chat", {
      question: fullQuestion,
      recipeTitle,
      recipeContext,
    });

    const answer = await chat(applied?.prompt || fullQuestion, {
      systemPrompt: applied?.systemPrompt || undefined,
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
