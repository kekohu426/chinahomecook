/**
 * 博客翻译详情 API (Stub)
 *
 * 注意：BlogPost 模型在新 Schema 中不存在
 *
 * GET /api/admin/blog/[id]/translation - 获取翻译
 * PUT /api/admin/blog/[id]/translation - 更新翻译
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

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
