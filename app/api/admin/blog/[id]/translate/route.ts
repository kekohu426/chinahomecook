/**
 * 博客翻译 API
 *
 * POST /api/admin/blog/[id]/translate - AI 翻译博客到目标语言
 *
 * 支持两种调用方式：
 * 1. { targetLocale: "en" } - 单个目标语言
 * 2. { sourceLocale: "zh-CN", targetLocales: ["en", "ja"] } - 批量翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai";

const LOCALE_NAMES: Record<string, string> = {
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  "en": "English",
  "ja": "Japanese",
  "ko": "Korean",
  "es": "Spanish",
  "fr": "French",
  "de": "German",
  "pt": "Portuguese",
  "ru": "Russian",
};

async function translateToLocale(
  post: any,
  sourceContent: { title: string; excerpt: string | null; content: string },
  targetLocale: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getTextProvider();
    const targetLanguage = LOCALE_NAMES[targetLocale] || "English";

    const prompt = `Please translate the following blog article to ${targetLanguage}.

Title: ${sourceContent.title}

Summary: ${sourceContent.excerpt || ""}

Content:
${sourceContent.content}

Requirements:
1. Keep Markdown format
2. Maintain article structure and tone
3. Translation should be natural and fluent
4. Professional terms should be accurate
5. Preserve the original style and emotion

Please return in JSON format:
{
  "title": "Translated title",
  "excerpt": "Translated summary",
  "content": "Translated content (Markdown format)"
}`;

    const response = await provider.chat({
      messages: [
        {
          role: "system",
          content: `You are a professional food content translator, fluent in Chinese and ${targetLanguage}. Your translations are accurate and natural, perfectly preserving the original style and emotion. Always respond with valid JSON.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 6000,
    });

    // 解析 JSON 响应
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse AI response" };
    }

    let translated;
    try {
      translated = JSON.parse(jsonMatch[0]);
    } catch {
      return { success: false, error: "Invalid JSON response from AI" };
    }

    // 生成翻译的 slug
    const translationSlug = translated.title
      ? translated.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 100)
      : `${post.slug}-${targetLocale}`;

    // 保存翻译
    await prisma.blogPostTranslation.upsert({
      where: {
        postId_locale: {
          postId: post.id,
          locale: targetLocale,
        },
      },
      create: {
        postId: post.id,
        locale: targetLocale,
        title: translated.title || sourceContent.title,
        slug: translationSlug,
        content: translated.content || null,
        excerpt: translated.excerpt || null,
        transMethod: "ai",
      },
      update: {
        title: translated.title || sourceContent.title,
        slug: translationSlug,
        content: translated.content || null,
        excerpt: translated.excerpt || null,
        transMethod: "ai",
      },
    });

    // 更新博客的翻译状态
    const transStatus = (post.transStatus as Record<string, string>) || {};
    transStatus[targetLocale] = "completed";

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { transStatus },
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to translate to ${targetLocale}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // 支持两种调用方式
    const targetLocale = body.targetLocale;
    const targetLocales = body.targetLocales || (targetLocale ? [targetLocale] : []);
    const sourceLocale = body.sourceLocale || "zh-CN";

    if (targetLocales.length === 0) {
      return NextResponse.json(
        { success: false, error: "Target locale(s) required" },
        { status: 400 }
      );
    }

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

    // 获取源内容 - 统一从 translations 表读取
    let sourceContent: { title: string; excerpt: string | null; content: string };

    const sourceTranslation = post.translations.find(t => t.locale === sourceLocale);

    if (sourceTranslation && (sourceTranslation.content || sourceTranslation.contentMarkdown)) {
      // 优先使用 contentMarkdown，其次是 content
      const content = sourceTranslation.contentMarkdown || sourceTranslation.content;
      sourceContent = {
        title: sourceTranslation.title,
        excerpt: sourceTranslation.excerpt || sourceTranslation.summary,
        content: content!,
      };
    } else if ((sourceLocale === "zh-CN" || sourceLocale === "zh") && post.title && post.content) {
      // 回退到主表（兼容旧数据）
      sourceContent = {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
      };
    } else {
      return NextResponse.json(
        { success: false, error: `Source content for ${sourceLocale} not found. Please ensure the blog has content in this language.` },
        { status: 400 }
      );
    }

    // 批量翻译
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const locale of targetLocales) {
      if (locale === sourceLocale) {
        results[locale] = { success: true };
        continue;
      }
      results[locale] = await translateToLocale(post, sourceContent, locale);
    }

    // 检查结果
    const successCount = Object.values(results).filter(r => r.success).length;
    const allSuccess = successCount === targetLocales.length;

    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess
        ? `Successfully translated to ${targetLocales.length} language(s)`
        : `Translated ${successCount}/${targetLocales.length} language(s)`,
    });
  } catch (error) {
    console.error("Failed to translate blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to translate blog post" },
      { status: 500 }
    );
  }
}
