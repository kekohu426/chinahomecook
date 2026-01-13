/**
 * 图片代理 API
 *
 * 用于解决跨域图片无法被 canvas 捕获的问题
 * html2canvas 会自动调用这个代理
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // 验证 URL 是否为有效的图片 URL
    const parsedUrl = new URL(url);
    const allowedHosts = [
      "files.evolink.ai",
      "lh3.googleusercontent.com",
    ];

    // 严格校验 host：必须完全匹配或是允许域名的子域名
    const isAllowed = allowedHosts.some((host) =>
      parsedUrl.hostname === host || parsedUrl.hostname.endsWith("." + host)
    );
    if (!isAllowed) {
      return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
    }

    // 获取图片
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RecipeZen/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    // 返回图片，添加 CORS 头
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
