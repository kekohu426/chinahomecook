/**
 * 博客大纲生成 API
 *
 * POST /api/admin/blog/[id]/generate-outline - 生成博客大纲
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
    // 兼容前端：支持 locale, topic, keywords
    const { locale, topic, keywords } = body;

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

    const title = topic || post.title;
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title or topic is required" },
        { status: 400 }
      );
    }

    const provider = getTextProvider();

    // 根据语言选择提示词
    const isEnglish = locale === "en";
    const prompt = isEnglish
      ? `You are a professional food blogger. Please generate a high-quality blog article outline for the following topic.

Topic: ${title}
${keywords ? `Keywords: ${keywords}` : ""}

Requirements:
1. Generate 5-8 main sections
2. Each section should have a clear heading and 2-3 key points
3. Content should be valuable to readers with practical advice
4. SEO optimized

Please return in JSON format:
{
  "outline": [
    {
      "level": 2,
      "heading": "Section Title",
      "points": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "suggestedExcerpt": "Article summary (50-100 words)",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedTitle": "SEO optimized title"
}`
      : `你是一位专业的美食博客作者。请为以下主题生成一篇高质量博客文章的大纲。

主题：${title}
${keywords ? `关键词：${keywords}` : ""}

要求：
1. 生成 5-8 个主要章节
2. 每个章节有清晰的标题和 2-3 个要点
3. 内容应该对读者有价值，包含实用建议
4. 适合 SEO 优化

请以 JSON 格式返回：
{
  "outline": [
    {
      "level": 2,
      "heading": "章节标题",
      "points": ["要点1", "要点2", "要点3"]
    }
  ],
  "suggestedExcerpt": "文章摘要（50-100字）",
  "suggestedTags": ["标签1", "标签2", "标签3"],
  "suggestedTitle": "SEO优化后的标题"
}`;

    const response = await provider.chat({
      messages: [
        {
          role: "system",
          content: isEnglish
            ? "You are a professional food blog content strategist. Always respond with valid JSON format."
            : "你是一位专业的美食博客内容策划师，擅长创作引人入胜的美食文章大纲。请始终以有效的 JSON 格式回复。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 解析 JSON 响应
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON response from AI" },
        { status: 500 }
      );
    }

    // 确保 outline 中每个项都有 level 属性
    const outline = (result.outline || []).map((item: any, idx: number) => ({
      level: item.level || 2,
      heading: item.heading || item.title || `Section ${idx + 1}`,
      points: item.points || [],
    }));

    // 如果有翻译，保存大纲到翻译记录
    // 注意：当前数据库模型没有 outline 字段，所以这里只返回数据

    return NextResponse.json({
      success: true,
      data: {
        outline,
        suggestedExcerpt: result.suggestedExcerpt || "",
        suggestedTags: result.suggestedTags || [],
        suggestedTitle: result.suggestedTitle || title,
      },
    });
  } catch (error) {
    console.error("Failed to generate outline:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate outline" },
      { status: 500 }
    );
  }
}
