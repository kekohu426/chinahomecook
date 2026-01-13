/**
 * 图片下载 API（带水印）
 *
 * GET /api/gallery/download/[id] - 下载带水印的图片
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 获取食谱
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        coverImage: true,
      },
    });

    if (!recipe || !recipe.coverImage) {
      return NextResponse.json(
        { success: false, error: "图片不存在" },
        { status: 404 }
      );
    }

    // 获取原图
    const imageResponse = await fetch(recipe.coverImage);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, error: "获取图片失败" },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // 尝试添加水印（如果 sharp 可用）
    let finalBuffer: ArrayBuffer | Buffer = imageBuffer;

    try {
      const sharp = (await import("sharp")).default;

      const image = sharp(Buffer.from(imageBuffer));
      const metadata = await image.metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      // 创建水印 SVG
      const watermarkText = "Recipe Zen";
      const fontSize = Math.max(24, Math.floor(width * 0.04));
      const padding = Math.floor(fontSize * 0.5);

      const watermarkSvg = `
        <svg width="${width}" height="${height}">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
            </filter>
          </defs>
          <text
            x="${width - padding}"
            y="${height - padding}"
            font-family="serif"
            font-size="${fontSize}"
            fill="white"
            fill-opacity="0.7"
            text-anchor="end"
            filter="url(#shadow)"
          >${watermarkText}</text>
        </svg>
      `;

      finalBuffer = await image
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            gravity: "southeast",
          },
        ])
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (sharpError) {
      // sharp 不可用，返回原图
      console.warn("Sharp not available, returning original image:", sharpError);
      finalBuffer = imageBuffer;
    }

    // 生成安全的文件名
    const safeFileName = recipe.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
    const fileName = `${safeFileName}_RecipeZen.jpg`;

    // 返回图片 - 复制到新 ArrayBuffer 以兼容 BodyInit 类型
    const uint8Array = Buffer.isBuffer(finalBuffer)
      ? new Uint8Array(finalBuffer.buffer.slice(finalBuffer.byteOffset, finalBuffer.byteOffset + finalBuffer.length))
      : new Uint8Array(finalBuffer);
    return new Response(uint8Array as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("下载图片失败:", error);
    return NextResponse.json(
      { success: false, error: "下载图片失败" },
      { status: 500 }
    );
  }
}
