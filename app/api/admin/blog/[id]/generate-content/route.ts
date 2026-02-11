/**
 * 博客内容生成 API
 *
 * POST /api/admin/blog/[id]/generate-content - 生成博客正文
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getTextProvider } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    // 兼容前端：支持 locale, outline, style
    const { locale, outline, style } = body;

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

    if (!post.title) {
      return NextResponse.json(
        { success: false, error: "Blog title is required" },
        { status: 400 }
      );
    }

    const provider = getTextProvider();
    const isEnglish = locale === "en";

    // 构建大纲文本
    let outlineText = "";
    if (outline && Array.isArray(outline)) {
      outlineText = outline
        .map((section: any, idx: number) => {
          const points = section.points?.join("\n  - ") || "";
          return `${idx + 1}. ${section.heading}\n  - ${points}`;
        })
        .join("\n\n");
    }

    const prompt = isEnglish
      ? `You are a professional food blogger. Please write complete content for the blog article "${post.title}" based on the following outline.

${outlineText ? `Outline:\n${outlineText}\n\n` : ""}
Writing style: ${style || "Professional yet approachable, easy to read"}

Requirements:
1. Use Markdown format
2. Use ## for section headings
3. Each section should be 200-400 words
4. Include practical tips and advice
5. Engaging and vivid language
6. Use lists and emphasis appropriately
7. Total word count: 1500-2500 words

Please output Markdown formatted blog content directly, no JSON wrapper needed.`
      : `你是一位专业的美食博客作者。请根据以下大纲，为博客文章"${post.title}"撰写完整的内容。

${outlineText ? `大纲：\n${outlineText}\n\n` : ""}
写作风格：${style || "专业但亲切，易于阅读"}

要求：
1. 使用 Markdown 格式
2. 每个章节使用 ## 作为标题
3. 内容详实，每个章节 200-400 字
4. 包含实用的建议和技巧
5. 语言生动，吸引读者
6. 适当使用列表和强调
7. 总字数约 1500-2500 字

请直接输出 Markdown 格式的博客正文内容，不需要 JSON 包装。`;

    const response = await provider.chat({
      messages: [
        {
          role: "system",
          content: isEnglish
            ? "You are an experienced food blogger who writes engaging and informative articles. Your writing style is professional yet approachable, with vivid descriptions of food."
            : "你是一位资深美食博客作者，擅长撰写引人入胜、内容丰富的美食文章。你的文章风格专业但不失亲和力，善于用生动的语言描述美食。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      maxTokens: 4000,
    });

    const content = response.content.trim();

    // 保存到翻译表或主表
    const targetLocale = locale || "zh-CN";

    if (targetLocale === "zh-CN" || targetLocale === "zh") {
      // 中文保存到主表
      await prisma.blogPost.update({
        where: { id },
        data: {
          content,
          status: "content_ready",
        },
      });
    }

    // 同时保存到翻译表
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
        title: post.title,
        slug: post.slug + (targetLocale !== "zh-CN" && targetLocale !== "zh" ? `-${targetLocale}` : ""),
        content,
        transMethod: "ai",
      },
      update: {
        content,
        transMethod: "ai",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        content,
        wordCount: content.length,
      },
    });
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
