/**
 * 博客翻译管理 API
 *
 * GET /api/admin/blog/[id]/translation?locale=en - 获取指定语言翻译
 * POST /api/admin/blog/[id]/translation - 创建/更新翻译
 * PATCH /api/admin/blog/[id]/translation - 更新翻译（前端使用）
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

// 获取指定语言翻译
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";

    // 检查博客是否存在
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    const translation = await prisma.blogPostTranslation.findUnique({
      where: {
        postId_locale: {
          postId: id,
          locale,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    console.error("Failed to fetch translation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch translation" },
      { status: 500 }
    );
  }
}

// 创建/更新翻译的通用处理函数
async function upsertTranslation(id: string, body: any) {
  const {
    locale,
    title,
    slug,
    content,
    contentMarkdown,
    contentHtml,
    excerpt,
    summary,
    transMethod,
    metaTitle,
    metaDescription,
    ogImage,
    tags,
  } = body;

  if (!locale) {
    return NextResponse.json(
      { success: false, error: "Locale is required" },
      { status: 400 }
    );
  }

  // 检查博客是否存在
  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    return NextResponse.json(
      { success: false, error: "Blog post not found" },
      { status: 404 }
    );
  }

  // 确定标题（如果没有提供，使用博客标题）
  const finalTitle = title || post.title;

  // 生成翻译的 slug
  const translationSlug =
    slug ||
    (finalTitle
      ? finalTitle
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
          .replace(/^-|-$/g, "")
      : `${post.slug}-${locale}`);

  // 合并 content 和 contentMarkdown（前端可能用不同字段名）
  const finalContent = content || contentMarkdown || null;
  const finalExcerpt = excerpt || summary || null;

  // 使用 upsert 创建或更新翻译
  const translation = await prisma.blogPostTranslation.upsert({
    where: {
      postId_locale: {
        postId: id,
        locale,
      },
    },
    create: {
      postId: id,
      locale,
      title: finalTitle,
      slug: translationSlug,
      content: finalContent,
      excerpt: finalExcerpt,
      transMethod: transMethod || "manual",
    },
    update: {
      title: finalTitle,
      slug: translationSlug,
      content: finalContent,
      excerpt: finalExcerpt,
      transMethod: transMethod || "manual",
    },
  });

  // 更新博客的翻译状态
  const transStatus = (post.transStatus as Record<string, string>) || {};
  transStatus[locale] = "completed";

  // 如果是中文，也更新主表内容
  if (locale === "zh-CN" || locale === "zh") {
    await prisma.blogPost.update({
      where: { id },
      data: {
        transStatus,
        content: finalContent || post.content,
        excerpt: finalExcerpt || post.excerpt,
      },
    });
  } else {
    await prisma.blogPost.update({
      where: { id },
      data: { transStatus },
    });
  }

  return NextResponse.json({
    success: true,
    data: translation,
  });
}

// POST - 创建/更新翻译
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    return await upsertTranslation(id, body);
  } catch (error) {
    console.error("Failed to save translation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save translation" },
      { status: 500 }
    );
  }
}

// PATCH - 更新翻译（前端使用这个方法）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    return await upsertTranslation(id, body);
  } catch (error) {
    console.error("Failed to update translation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update translation" },
      { status: 500 }
    );
  }
}
