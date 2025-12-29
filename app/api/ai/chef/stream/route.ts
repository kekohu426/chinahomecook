/**
 * AI 智能主厨流式 API 路由
 *
 * POST /api/ai/chef/stream
 * 支持实时流式响应
 */

import { NextRequest } from "next/server";
import { chatStream } from "@/lib/ai";

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
      return new Response(
        JSON.stringify({ error: "问题不能为空" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

    // 创建可读流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await chatStream(
            fullPrompt,
            (chunk) => {
              // 将每个文本块发送给客户端
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            },
            {
              systemPrompt: CHEF_SYSTEM_PROMPT,
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
