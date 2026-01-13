/**
 * HomeBrowseItem 详情 API (Stubbed)
 *
 * HomeBrowseItem 模型不存在，此 API 暂时返回 501
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, error: "HomeBrowseItem 模型尚未实现" }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "HomeBrowseItem 模型尚未实现" }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "HomeBrowseItem 模型尚未实现" }, { status: 501 });
}
