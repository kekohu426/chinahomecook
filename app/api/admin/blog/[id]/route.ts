/**
 * 博客详情 API
 *
 * GET /api/admin/blog/[id] - 获取博客详情
 * PATCH /api/admin/blog/[id] - 更新博客
 * DELETE /api/admin/blog/[id] - 删除博客
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

// 获取博客详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // 解析 seo JSON 字段
    const seo = (post.seo as any) || {};

    // 转换为前端期望的格式
    const formattedPost = {
      id: post.id,
      primaryKeyword: post.title,
      secondaryKeywords: [],
      longTailQuestions: [],
      status: post.status === "published" ? "PUBLISHED" : post.status === "CONTENT_READY" ? "CONTENT_READY" : "DRAFT",
      publishAt: null,
      publishedAt: post.publishedAt?.toISOString() || null,
      authorName: post.author,
      createdAt: post.createdAt.toISOString(),
      coverImage: post.coverImage,
      translations: post.translations.map((t) => ({
        id: t.id,
        locale: t.locale,
        title: t.title,
        summary: t.excerpt,
        contentMarkdown: t.content,
        contentHtml: null,
        outline: seo.outline || null,
        faq: null,
        slug: t.slug,
        metaTitle: seo.metaTitle || null,
        metaDescription: seo.metaDescription || null,
        ogImage: post.coverImage || null,
        tags: seo.tags || [],
        isApproved: t.isReviewed,
      })),
      imageAssets: seo.coverImagePrompt ? [{
        id: "cover",
        locale: "zh-CN",
        prompt: seo.coverImagePrompt,
        style: "healing_aesthetic",
        aspectRatio: "16:9",
        altText: post.title,
        sectionHeading: "封面图",
        imageUrl: post.coverImage,
        position: 0,
      }] : [],
    };

    return NextResponse.json({
      success: true,
      data: formattedPost,
      post: formattedPost,
    });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// 更新博客
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // 检查博客是否存在
    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // 如果更新 slug，检查是否冲突
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    const allowedFields = [
      "title",
      "slug",
      "content",
      "excerpt",
      "coverImage",
      "author",
      "seo",
      "transStatus",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// 删除博客
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    // 检查博客是否存在
    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // 删除博客（翻译会级联删除）
    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
