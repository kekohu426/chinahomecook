/**
 * HomeTestimonial 翻译 API (Stubbed)
 *
 * HomeTestimonial 模型不存在，此 API 暂时返回 501
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  return NextResponse.json({ success: false, error: "HomeTestimonial 模型尚未实现" }, { status: 501 });
}

export async function POST() {
  const authError = await requireAdmin();
  if (authError) return authError;
  return NextResponse.json({ success: false, error: "HomeTestimonial 模型尚未实现" }, { status: 501 });
}
