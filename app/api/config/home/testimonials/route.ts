/**
 * 首页用户证言配置 API (Stubbed)
 *
 * HomeTestimonial 模型不存在，此 API 暂时返回空数据
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "HomeTestimonial 模型尚未实现" },
    { status: 501 }
  );
}
