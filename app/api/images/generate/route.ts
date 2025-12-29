/**
 * AI 图片生成 API 路由
 *
 * POST /api/images/generate
 * 使用 Evolink API 生成食谱图片
 */

import { NextRequest, NextResponse } from "next/server";
import { evolinkClient } from "@/lib/ai/evolink";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, width, height } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "缺少 prompt 参数" },
        { status: 400 }
      );
    }

    // 调用 Evolink API 生成图片
    const result = await evolinkClient.generateImage({
      prompt,
      negativePrompt,
      width,
      height,
      timeoutMs: 20000,
      retries: 1,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
    });
  } catch (error) {
    console.error("图片生成失败:", error);
    return NextResponse.json(
      { success: false, error: "图片生成失败" },
      { status: 500 }
    );
  }
}
