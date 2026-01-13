/**
 * 关于我们区块列表 API (Stubbed)
 *
 * AboutSection 模型不存在，此 API 暂时返回空数据
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: false, error: "AboutSection 模型尚未实现" }, { status: 501 });
}
