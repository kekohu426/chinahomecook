/**
 * 博客封面图生成 API
 *
 * POST /api/admin/blog/[id]/generate-cover - 使用 AI 生成封面图
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { evolinkClient } from "@/lib/ai/evolink";
import { AIGenerationLogger } from "@/lib/ai/generation-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { prompt, locale = "zh-CN" } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "封面图提示词不能为空" },
        { status: 400 }
      );
    }

    // 检查博客是否存在
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: {
          where: { locale },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // 创建日志记录器
    const logger = new AIGenerationLogger(undefined, {
      metadata: { blogPostId: id, locale, type: "cover_image" },
    });

    console.log(`[BlogCover] 开始生成封面图，博客ID: ${id}`);
    console.log(`[BlogCover] 提示词: ${prompt.substring(0, 100)}...`);

    // 调用图片生成服务
    // 封面图使用 16:9 比例 (1792x1024)
    const result = await evolinkClient.generateImage({
      prompt,
      width: 1792,
      height: 1024,
      timeoutMs: 60000, // 60秒超时
      retries: 2,
      logger,
      stepName: "blog_cover_generation",
    });

    if (!result.success || !result.imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "封面图生成失败",
        },
        { status: 500 }
      );
    }

    console.log(`[BlogCover] 生成成功: ${result.imageUrl}`);

    // 更新主表的 coverImage 字段
    await prisma.blogPost.update({
      where: { id },
      data: {
        coverImage: result.imageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        prompt,
        sessionId: logger.getSessionId(),
      },
    });
  } catch (error) {
    console.error("[BlogCover] 生成失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "封面图生成失败",
      },
      { status: 500 }
    );
  }
}
