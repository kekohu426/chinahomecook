/**
 * 关于我们区块 API (Stubbed)
 *
 * AboutSection 模型不存在，此 API 暂时返回 501
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, error: "AboutSection 模型尚未实现" }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "AboutSection 模型尚未实现" }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "AboutSection 模型尚未实现" }, { status: 501 });
}
