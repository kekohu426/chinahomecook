/**
 * 博客内容生成 API (Stub)
 *
 * 注意：BlogPost 模型在新 Schema 中不存在
 *
 * POST /api/admin/blog/[id]/generate-content - 生成内容
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

export async function POST(
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
