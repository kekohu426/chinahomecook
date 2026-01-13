/**
 * 博客详情 API (Stub)
 *
 * 注意：BlogPost 模型在新 Schema 中不存在
 *
 * GET /api/admin/blog/[id] - 获取博客详情
 * PUT /api/admin/blog/[id] - 更新博客
 * DELETE /api/admin/blog/[id] - 删除博客
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

// 获取博客详情 - 返回未找到
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

// 更新博客 - 返回未实现
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

// 删除博客 - 返回未实现
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
