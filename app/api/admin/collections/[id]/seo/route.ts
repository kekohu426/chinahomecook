/**
 * 合集 SEO 配置 API
 *
 * GET  /api/admin/collections/[id]/seo - 获取 SEO 配置
 * PUT  /api/admin/collections/[id]/seo - 更新 SEO 配置
 * POST /api/admin/collections/[id]/seo/generate - AI 生成 SEO 内容
 *
 * SEO 配置字段：
 * - titleZh/titleEn: SEO 标题
 * - descriptionZh/descriptionEn: Meta 描述
 * - keywords: 关键词列表
 * - h1Zh/h1En: H1 标题
 * - subtitleZh/subtitleEn: 副标题
 * - footerTextZh/footerTextEn: 底部收口文案
 * - noIndex: 是否禁止索引
 * - sitemapPriority: Sitemap 优先级
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { DEFAULT_SEO, SEO_LIMITS, type SeoConfig } from "@/lib/types/collection";
import type { ApiResponse, ApiError, UpdateSeoRequest } from "@/lib/types/collection-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface SeoResponse {
  seo: SeoConfig;
  validation: {
    titleZh?: { length: number; status: "ok" | "warn" | "error" };
    titleEn?: { length: number; status: "ok" | "warn" | "error" };
    descriptionZh?: { length: number; status: "ok" | "warn" | "error" };
    descriptionEn?: { length: number; status: "ok" | "warn" | "error" };
    keywords?: { count: number; status: "ok" | "warn" | "error" };
  };
}

/**
 * 验证 SEO 字段长度
 */
function validateSeoField(
  value: string | undefined,
  maxLength: number,
  warnLength: number
): { length: number; status: "ok" | "warn" | "error" } {
  if (!value) return { length: 0, status: "ok" };
  const length = value.length;
  if (length > maxLength) return { length, status: "error" };
  if (length > warnLength) return { length, status: "warn" };
  return { length, status: "ok" };
}

/**
 * GET /api/admin/collections/[id]/seo
 * 获取 SEO 配置
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nameEn: true,
        type: true,
        seo: true,
      },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // 合并默认值和存储的配置
    const storedSeo = (collection.seo as SeoConfig) || {};
    const seo: SeoConfig = { ...DEFAULT_SEO, ...storedSeo };

    // 验证字段
    const validation: SeoResponse["validation"] = {
      titleZh: validateSeoField(seo.titleZh, SEO_LIMITS.TITLE_MAX, SEO_LIMITS.TITLE_WARN),
      titleEn: validateSeoField(seo.titleEn, SEO_LIMITS.TITLE_MAX, SEO_LIMITS.TITLE_WARN),
      descriptionZh: validateSeoField(seo.descriptionZh, SEO_LIMITS.DESC_MAX, SEO_LIMITS.DESC_WARN),
      descriptionEn: validateSeoField(seo.descriptionEn, SEO_LIMITS.DESC_MAX, SEO_LIMITS.DESC_WARN),
      keywords: {
        count: seo.keywords?.length || 0,
        status: (seo.keywords?.length || 0) > SEO_LIMITS.KEYWORDS_MAX ? "error" : "ok",
      },
    };

    return NextResponse.json<ApiResponse<SeoResponse>>({
      success: true,
      data: { seo, validation },
    });
  } catch (error) {
    console.error("获取 SEO 配置失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "获取 SEO 配置失败" },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/collections/[id]/seo
 * 更新 SEO 配置
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 权限检查
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "需要管理员权限" },
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body: UpdateSeoRequest = await request.json();

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { id: true, seo: true },
    });

    if (!collection) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "合集不存在" },
        },
        { status: 404 }
      );
    }

    // 验证字段长度
    const errors: Record<string, string[]> = {};

    if (body.seo?.titleZh && body.seo.titleZh.length > SEO_LIMITS.TITLE_MAX) {
      errors.titleZh = [`标题不能超过 ${SEO_LIMITS.TITLE_MAX} 字符`];
    }
    if (body.seo?.titleEn && body.seo.titleEn.length > SEO_LIMITS.TITLE_MAX) {
      errors.titleEn = [`Title cannot exceed ${SEO_LIMITS.TITLE_MAX} characters`];
    }
    if (body.seo?.descriptionZh && body.seo.descriptionZh.length > SEO_LIMITS.DESC_MAX) {
      errors.descriptionZh = [`描述不能超过 ${SEO_LIMITS.DESC_MAX} 字符`];
    }
    if (body.seo?.descriptionEn && body.seo.descriptionEn.length > SEO_LIMITS.DESC_MAX) {
      errors.descriptionEn = [`Description cannot exceed ${SEO_LIMITS.DESC_MAX} characters`];
    }
    if (body.seo?.keywords && body.seo.keywords.length > SEO_LIMITS.KEYWORDS_MAX) {
      errors.keywords = [`关键词不能超过 ${SEO_LIMITS.KEYWORDS_MAX} 个`];
    }
    if (body.seo?.footerTextZh && body.seo.footerTextZh.length > SEO_LIMITS.FOOTER_MAX) {
      errors.footerTextZh = [`底部文案不能超过 ${SEO_LIMITS.FOOTER_MAX} 字符`];
    }
    if (body.seo?.footerTextEn && body.seo.footerTextEn.length > SEO_LIMITS.FOOTER_MAX) {
      errors.footerTextEn = [`Footer text cannot exceed ${SEO_LIMITS.FOOTER_MAX} characters`];
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json<ApiError>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "SEO 配置验证失败",
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // 合并现有配置和新配置
    const existingSeo = (collection.seo as SeoConfig) || {};
    const updatedSeo = { ...existingSeo, ...body.seo };

    // 更新数据库
    await prisma.collection.update({
      where: { id },
      data: { seo: updatedSeo as object },
    });

    // 验证更新后的字段
    const validation: SeoResponse["validation"] = {
      titleZh: validateSeoField(updatedSeo.titleZh, SEO_LIMITS.TITLE_MAX, SEO_LIMITS.TITLE_WARN),
      titleEn: validateSeoField(updatedSeo.titleEn, SEO_LIMITS.TITLE_MAX, SEO_LIMITS.TITLE_WARN),
      descriptionZh: validateSeoField(updatedSeo.descriptionZh, SEO_LIMITS.DESC_MAX, SEO_LIMITS.DESC_WARN),
      descriptionEn: validateSeoField(updatedSeo.descriptionEn, SEO_LIMITS.DESC_MAX, SEO_LIMITS.DESC_WARN),
      keywords: {
        count: updatedSeo.keywords?.length || 0,
        status: (updatedSeo.keywords?.length || 0) > SEO_LIMITS.KEYWORDS_MAX ? "error" : "ok",
      },
    };

    return NextResponse.json<ApiResponse<SeoResponse>>({
      success: true,
      data: { seo: updatedSeo, validation },
    });
  } catch (error) {
    console.error("更新 SEO 配置失败:", error);
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "更新 SEO 配置失败" },
      },
      { status: 500 }
    );
  }
}
