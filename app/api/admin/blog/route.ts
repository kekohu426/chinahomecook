/**
 * 博客管理 API (Stub)
 *
 * 注意：BlogPost 模型在新 Schema 中不存在
 * 返回空列表/占位响应
 *
 * GET /api/admin/blog - 获取博客列表
 * POST /api/admin/blog - 创建博客草稿
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

// 获取博客列表 - 返回空列表
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  // BlogPost 模型不存在，返回空列表
  return NextResponse.json({
    success: true,
    data: {
      posts: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    },
    message: "Blog feature not available - model does not exist in schema",
  });
}

// 创建博客草稿 - 返回未实现
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  return NextResponse.json(
    {
      success: false,
      error: "Blog feature not available - model does not exist in schema",
    },
    { status: 501 }
  );
}
