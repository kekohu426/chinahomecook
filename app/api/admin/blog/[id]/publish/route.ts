/**
 * 博客发布 API
 *
 * POST /api/admin/blog/[id]/publish - 发布博客
 *
 * 支持的 action:
 * - approve: 审核通过当前语言版本
 * - submit_review: 提交审核
 * - schedule: 排期发布
 * - publish_now: 立即发布
 * - publish: 发布（同 publish_now）
 * - unpublish: 取消发布
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, locale, publishAt } = body;

    // 检查博客是否存在
    const existing = await prisma.blogPost.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        // 审核通过指定语言版本
        if (!locale) {
          return NextResponse.json(
            { success: false, error: "Locale is required for approve action" },
            { status: 400 }
          );
        }

        await prisma.blogPostTranslation.updateMany({
          where: { postId: id, locale },
          data: { isReviewed: true },
        });

        return NextResponse.json({
          success: true,
          message: `${locale} version approved`,
        });
      }

      case "submit_review": {
        // 提交审核
        const post = await prisma.blogPost.update({
          where: { id },
          data: { status: "review_pending" },
        });

        return NextResponse.json({
          success: true,
          data: post,
          message: "Submitted for review",
        });
      }

      case "schedule": {
        // 排期发布
        if (!publishAt) {
          return NextResponse.json(
            { success: false, error: "publishAt is required for schedule action" },
            { status: 400 }
          );
        }

        const post = await prisma.blogPost.update({
          where: { id },
          data: {
            status: "scheduled",
            publishedAt: new Date(publishAt),
          },
        });

        return NextResponse.json({
          success: true,
          data: post,
          message: "Scheduled for publishing",
        });
      }

      case "publish":
      case "publish_now": {
        // 立即发布
        // 检查是否有已审核的翻译或主内容
        const hasApprovedTranslation = existing.translations.some(t => t.isReviewed);
        const hasContent = existing.content && existing.content.length > 0;

        if (!hasContent && !hasApprovedTranslation) {
          return NextResponse.json(
            { success: false, error: "需要内容或至少一个已审核的翻译才能发布" },
            { status: 400 }
          );
        }

        const post = await prisma.blogPost.update({
          where: { id },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: post,
          message: "Published successfully",
        });
      }

      case "unpublish": {
        // 取消发布
        const post = await prisma.blogPost.update({
          where: { id },
          data: { status: "draft" },
        });

        return NextResponse.json({
          success: true,
          data: post,
          message: "Unpublished successfully",
        });
      }

      default: {
        // 默认行为：发布
        if (!existing.title) {
          return NextResponse.json(
            { success: false, error: "Title is required to publish" },
            { status: 400 }
          );
        }

        const post = await prisma.blogPost.update({
          where: { id },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: post,
          message: "Published successfully",
        });
      }
    }
  } catch (error) {
    console.error("Failed to publish blog post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish blog post" },
      { status: 500 }
    );
  }
}
