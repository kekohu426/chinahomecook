/**
 * 博客一键生成 API
 *
 * POST /api/admin/blog/[id]/generate-all - 一次性生成所有博客内容
 * 包含：标题优化、大纲、正文、摘要、SEO、标签、封面图、插图
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import {
  AIGenerationLogger,
  calculateCost,
} from "@/lib/ai/generation-logger";
import { evolinkClient } from "@/lib/ai/evolink";

interface InlineImage {
  position: number;
  altText: string;
  prompt: string;
}

interface GeneratedContent {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  outline: Array<{ level: number; heading: string; points: string[] }>;
  content: string;
  coverImagePrompt: string;
  inlineImages?: InlineImage[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { locale = "zh-CN" } = body;

    // 检查博客是否存在
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // 使用 primaryKeyword 或 title 作为关键词
    const keyword = post.primaryKeyword || post.title;
    if (!keyword) {
      return NextResponse.json(
        { success: false, error: "关键词不能为空" },
        { status: 400 }
      );
    }

    // 创建日志记录器
    const logger = new AIGenerationLogger(undefined, {
      metadata: { blogPostId: id, locale },
    });

    // 获取提示词配置
    const language = locale === "zh-CN" ? "简体中文" : locale === "en" ? "English" : locale;
    const promptConfig = await getAppliedPrompt("blog_generate_full", {
      keyword,
      language,
    });

    if (!promptConfig) {
      return NextResponse.json(
        { success: false, error: "未找到博客生成提示词配置" },
        { status: 500 }
      );
    }

    const provider = getTextProvider();
    const modelName = provider.getModel();
    const startTime = Date.now();

    // 调用 AI 生成
    const response = await provider.chat({
      messages: [
        ...(promptConfig.systemPrompt
          ? [{ role: "system" as const, content: promptConfig.systemPrompt }]
          : []),
        { role: "user" as const, content: promptConfig.prompt },
      ],
      temperature: 0.7,
      maxTokens: 8000,
    });

    const durationMs = Date.now() - startTime;

    // 解析 AI 响应
    let generated: GeneratedContent;
    try {
      // 清理可能的 markdown 代码块
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      generated = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", response.content);
      logger.logFailure("blog_generate_full", modelName, parseError as Error, {
        prompt: promptConfig.prompt.substring(0, 500),
        resultText: response.content.substring(0, 1000),
        durationMs,
      });
      return NextResponse.json(
        { success: false, error: "AI 返回格式解析失败，请重试" },
        { status: 500 }
      );
    }

    // 记录成功日志
    const tokenUsage = response.usage
      ? {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        }
      : undefined;

    logger.logSuccess("blog_generate_full", modelName, {
      prompt: promptConfig.prompt.substring(0, 500),
      result: {
        title: generated.title,
        slug: generated.slug,
        tags: generated.tags,
        contentLength: generated.content?.length || 0,
      },
      tokenUsage,
      cost: tokenUsage ? calculateCost(modelName, tokenUsage) : undefined,
      durationMs,
      provider: provider.getName(),
    });

    // ========== 生成图片 ==========
    let finalContent = generated.content || "";
    let coverImageUrl: string | undefined;
    const generatedImages: { position: number; url: string; altText: string }[] = [];

    // 1. 生成封面图
    if (generated.coverImagePrompt) {
      console.log(`[BlogGenerate] 开始生成封面图...`);
      try {
        const coverResult = await evolinkClient.generateImage({
          prompt: generated.coverImagePrompt,
          width: 1792,
          height: 1024,
          timeoutMs: 60000,
          retries: 2,
          logger,
          stepName: "blog_cover_generation",
        });

        if (coverResult.success && coverResult.imageUrl) {
          coverImageUrl = coverResult.imageUrl;
          console.log(`[BlogGenerate] 封面图生成成功: ${coverImageUrl}`);
        } else {
          console.error(`[BlogGenerate] 封面图生成失败: ${coverResult.error}`);
        }
      } catch (err) {
        console.error(`[BlogGenerate] 封面图生成异常:`, err);
      }
    }

    // 2. 生成插图（并发）
    const inlineImages = generated.inlineImages || [];
    if (inlineImages.length > 0) {
      console.log(`[BlogGenerate] 开始生成 ${inlineImages.length} 张插图...`);

      const imagePromises = inlineImages.map(async (img) => {
        try {
          const result = await evolinkClient.generateImage({
            prompt: img.prompt,
            width: 1024,
            height: 768,
            timeoutMs: 60000,
            retries: 1,
            logger,
            stepName: `blog_inline_image_${img.position}`,
          });

          if (result.success && result.imageUrl) {
            console.log(`[BlogGenerate] 插图 ${img.position} 生成成功`);
            return { position: img.position, url: result.imageUrl, altText: img.altText };
          } else {
            console.error(`[BlogGenerate] 插图 ${img.position} 生成失败: ${result.error}`);
            return null;
          }
        } catch (err) {
          console.error(`[BlogGenerate] 插图 ${img.position} 生成异常:`, err);
          return null;
        }
      });

      const results = await Promise.allSettled(imagePromises);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          generatedImages.push(result.value);
        }
      }

      console.log(`[BlogGenerate] 插图生成完成: ${generatedImages.length}/${inlineImages.length} 成功`);
    }

    // 3. 替换正文中的占位符
    for (const img of generatedImages) {
      const placeholder = `[IMAGE_${img.position}]`;
      const markdownImage = `\n\n![${img.altText}](${img.url})\n\n`;
      finalContent = finalContent.replace(placeholder, markdownImage);
    }

    // 移除未生成的占位符
    finalContent = finalContent.replace(/\[IMAGE_\d+\]/g, "");

    // 保存到数据库
    const targetLocale = locale || "zh-CN";

    // 更新翻译表（只保存数据库中存在的字段）
    await prisma.blogPostTranslation.upsert({
      where: {
        postId_locale: {
          postId: id,
          locale: targetLocale,
        },
      },
      create: {
        postId: id,
        locale: targetLocale,
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        content: finalContent,
        transMethod: "ai",
      },
      update: {
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        content: finalContent,
        transMethod: "ai",
      },
    });

    // 更新主表（seo 字段存储 SEO 相关信息，包括封面图提示词）
    await prisma.blogPost.update({
      where: { id },
      data: {
        title: generated.title,
        slug: generated.slug,
        content: finalContent,
        excerpt: generated.excerpt,
        coverImage: coverImageUrl || undefined,
        seo: {
          metaTitle: generated.metaTitle,
          metaDescription: generated.metaDescription,
          tags: generated.tags,
          outline: generated.outline,
          coverImagePrompt: generated.coverImagePrompt,
          inlineImages: generated.inlineImages,
        },
        status: "CONTENT_READY",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        tags: generated.tags,
        outline: generated.outline,
        content: finalContent,
        coverImagePrompt: generated.coverImagePrompt,
        coverImageUrl,
        inlineImagesCount: generatedImages.length,
        wordCount: finalContent?.length || 0,
        sessionId: logger.getSessionId(),
      },
    });
  } catch (error) {
    console.error("Failed to generate blog content:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "生成失败，请重试",
      },
      { status: 500 }
    );
  }
}
