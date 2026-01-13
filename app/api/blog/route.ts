/**
 * 前台博客 API (Stubbed)
 *
 * BlogPost 模型不存在，此 API 暂时返回空数据
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
  });
}
