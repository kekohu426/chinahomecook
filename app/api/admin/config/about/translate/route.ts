/**
 * AI 翻译关于我们区块 (Stubbed)
 *
 * AboutSection 模型不存在，此 API 暂时返回 501
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

export async function POST() {
  const authError = await requireAdmin();
  if (authError) return authError;

  return NextResponse.json(
    { success: false, error: "AboutSection 模型尚未实现" },
    { status: 501 }
  );
}
