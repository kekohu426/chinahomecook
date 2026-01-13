/**
 * 前台博客详情 API (Stubbed)
 *
 * BlogPost 模型不存在，此 API 暂时返回 404
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
}
