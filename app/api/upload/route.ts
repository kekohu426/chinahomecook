/**
 * 图片上传 API 路由
 *
 * POST /api/upload
 * 支持单图片上传到 Cloudflare R2
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadImage, generateSafeFilename } from "@/lib/utils/storage";

export async function POST(request: NextRequest) {
  try {
    // 验证 Content-Type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type 必须是 multipart/form-data" },
        { status: 400 }
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { error: "未找到文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅支持 JPG、PNG、WebP、GIF" },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件过大，最大支持 5MB" },
        { status: 400 }
      );
    }

    // 生成安全的文件路径
    const path = generateSafeFilename(file.name, category);

    // 上传到 R2
    const url = await uploadImage(file, path);

    return NextResponse.json({
      success: true,
      url,
      path,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("图片上传错误:", error);

    // 友好的错误提示
    if (error instanceof Error && error.message.includes("R2 配置")) {
      return NextResponse.json(
        { error: "图片存储服务未配置，请联系管理员" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "图片上传失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 配置最大请求体大小（10MB）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
