/**
 * AI 智能主厨流式 API 路由
 *
 * POST /api/ai/chef/stream
 * 支持实时流式响应
 */

import { NextRequest } from "next/server";
import { chatStream } from "@/lib/ai";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, recipeTitle, recipeContext } = body;

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "问题不能为空" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

    // 创建可读流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await chatStream(
            applied?.prompt || fullQuestion,
            (chunk) => {
              // 将每个文本块发送给客户端
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            },
            {
              systemPrompt: applied?.systemPrompt || undefined,
              temperature: 0.7,
              maxTokens: 500,
            }
          );

          // 发送完成标记
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Chef Stream API Error:", error);

    if (error instanceof Error && error.message.includes("API_KEY")) {
      return new Response(
        JSON.stringify({ error: "AI 服务未配置" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "AI 服务暂时不可用" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
