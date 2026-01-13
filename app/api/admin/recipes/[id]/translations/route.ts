/**
 * 食谱翻译管理 API
 *
 * GET  /api/admin/recipes/[id]/translations - 获取所有翻译
 * POST /api/admin/recipes/[id]/translations - 创建/更新翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 检查管理员权限
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "需要管理员权限" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * GET /api/admin/recipes/[id]/translations
 * 获取食谱的所有翻译
 *
 * Query params:
 * - locale: 只获取指定语言的翻译
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const locale = request.nextUrl.searchParams.get("locale");

    // 检查食谱是否存在
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { id: true, title: true, transStatus: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { recipeId: id };
    if (locale) {
      where.locale = locale;
    }

    const translations = await prisma.recipeTranslation.findMany({
      where,
      orderBy: { locale: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        transStatus: recipe.transStatus,
        translations,
      },
    });
  } catch (error) {
    console.error("获取翻译失败:", error);
    return NextResponse.json(
      { success: false, error: "获取翻译失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/recipes/[id]/translations
 * 创建或更新翻译（upsert）
 *
 * Body:
 * {
 *   locale: string,           // 必填，目标语言
 *   title: string,            // 翻译标题
 *   slug?: string,            // 翻译后的 slug
 *   description?: string,     // 翻译描述
 *   difficulty?: string,      // 翻译难度
 *   summary?: object,         // 翻译摘要
 *   story?: object,           // 翻译故事
 *   ingredients?: object,     // 翻译食材
 *   steps?: object,           // 翻译步骤
 *   transMethod?: string,     // ai/manual/hybrid
 *   isReviewed?: boolean,     // 是否已审核
 *   reviewNote?: string,      // 审核备注
 * }
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const body = await request.json();

    // 验证必填字段
    if (!body.locale) {
      return NextResponse.json(
        { success: false, error: "locale 为必填项" },
        { status: 400 }
      );
    }
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "title 为必填项" },
        { status: 400 }
      );
    }

    // 检查食谱是否存在
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { id: true, slug: true, transStatus: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "食谱不存在" },
        { status: 404 }
      );
    }

    // 生成 slug（如果没有提供）
    const slug = body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 100) ||
      `${recipe.slug}-${body.locale}`;

    // 获取当前用户信息
    const session = await auth();
    const reviewedBy = session?.user?.email || "admin";

    // Upsert 翻译
    const translation = await prisma.recipeTranslation.upsert({
      where: {
        recipeId_locale: {
          recipeId: id,
          locale: body.locale,
        },
      },
      update: {
        title: body.title,
        slug,
        description: body.description,
        difficulty: body.difficulty,
        summary: body.summary,
        story: body.story,
        ingredients: body.ingredients,
        steps: body.steps,
        transMethod: body.transMethod || "manual",
        isReviewed: body.isReviewed !== undefined ? body.isReviewed : undefined,
        reviewedBy: body.isReviewed ? reviewedBy : undefined,
        reviewedAt: body.isReviewed ? new Date() : undefined,
        reviewNote: body.reviewNote,
      },
      create: {
        recipeId: id,
        locale: body.locale,
        title: body.title,
        slug,
        description: body.description,
        difficulty: body.difficulty,
        summary: body.summary,
        story: body.story,
        ingredients: body.ingredients,
        steps: body.steps,
        transMethod: body.transMethod || "manual",
        isReviewed: body.isReviewed || false,
        reviewedBy: body.isReviewed ? reviewedBy : null,
        reviewedAt: body.isReviewed ? new Date() : null,
        reviewNote: body.reviewNote,
      },
    });

    // 更新主表的翻译状态
    const currentTransStatus = (recipe.transStatus as Record<string, string>) || {};
    currentTransStatus[body.locale] = body.isReviewed ? "completed" : "pending_review";
    await prisma.recipe.update({
      where: { id },
      data: { transStatus: currentTransStatus },
    });

    return NextResponse.json({
      success: true,
      data: translation,
    });
  } catch (error) {
    console.error("保存翻译失败:", error);
    return NextResponse.json(
      { success: false, error: "保存翻译失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/recipes/[id]/translations
 * 删除指定语言的翻译
 *
 * Query params:
 * - locale: 要删除的语言（必填）
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await context.params;
    const locale = request.nextUrl.searchParams.get("locale");

    if (!locale) {
      return NextResponse.json(
        { success: false, error: "locale 参数为必填项" },
        { status: 400 }
      );
    }

    // 检查翻译是否存在
    const translation = await prisma.recipeTranslation.findUnique({
      where: {
        recipeId_locale: {
          recipeId: id,
          locale,
        },
      },
    });

    if (!translation) {
      return NextResponse.json(
        { success: false, error: "翻译不存在" },
        { status: 404 }
      );
    }

    // 删除翻译
    await prisma.recipeTranslation.delete({
      where: {
        recipeId_locale: {
          recipeId: id,
          locale,
        },
      },
    });

    // 更新主表的翻译状态
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { transStatus: true },
    });
    if (recipe) {
      const currentTransStatus = (recipe.transStatus as Record<string, string>) || {};
      delete currentTransStatus[locale];
      await prisma.recipe.update({
        where: { id },
        data: { transStatus: currentTransStatus },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${locale} 翻译已删除`,
    });
  } catch (error) {
    console.error("删除翻译失败:", error);
    return NextResponse.json(
      { success: false, error: "删除翻译失败" },
      { status: 500 }
    );
  }
}
