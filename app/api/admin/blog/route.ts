/**
 * 博客管理 API
 *
 * GET /api/admin/blog - 获取博客列表
 * POST /api/admin/blog - 创建博客草稿
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

// 数据库状态到前端状态的映射
function toFrontendStatus(dbStatus: string): string {
  const map: Record<string, string> = {
    draft: "DRAFT",
    published: "PUBLISHED",
    scheduled: "SCHEDULED",
    review_pending: "REVIEW_PENDING",
    content_ready: "CONTENT_READY",
    outline_ready: "OUTLINE_READY",
  };
  return map[dbStatus] || "DRAFT";
}

// 获取博客列表
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    // 前端传大写状态，转换为小写查询
    if (status && status !== "all" && status !== "") {
      where.status = status.toLowerCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    // 转换为前端期望的格式
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      primaryKeyword: post.title,
      status: toFrontendStatus(post.status),
      publishAt: null,
      publishedAt: post.publishedAt?.toISOString() || null,
      authorName: post.author,
      createdAt: post.createdAt.toISOString(),
      translations: post.translations.map((t) => ({
        id: t.id,
        locale: t.locale,
        title: t.title,
        slug: t.slug,
        isApproved: t.isReviewed,
      })),
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      data: {
        posts: formattedPosts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// 创建博客草稿
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    // 兼容前端：支持 title 或 primaryKeyword 作为标题
    const title = body.title || body.primaryKeyword;
    const slug = body.slug;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // 生成 slug（添加时间戳确保唯一性）
    let baseSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!baseSlug) {
      baseSlug = `blog-${Date.now()}`;
    }

    // 检查 slug 是否已存在，如果存在则添加时间戳
    let finalSlug = baseSlug;
    const existing = await prisma.blogPost.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      finalSlug = `${baseSlug}-${Date.now()}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        status: "draft",
        author: body.author || body.authorName || null,
        excerpt: body.excerpt || null,
        content: body.content || null,
        coverImage: body.coverImage || null,
      },
    });

    // 返回前端期望的格式
    const formattedPost = {
      id: post.id,
      primaryKeyword: post.title,
      status: "DRAFT",
      publishAt: null,
      publishedAt: null,
      authorName: post.author,
      createdAt: post.createdAt.toISOString(),
      translations: [],
      imageAssets: [],
    };

    return NextResponse.json({
      success: true,
      data: formattedPost,
      post: formattedPost,
    });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
