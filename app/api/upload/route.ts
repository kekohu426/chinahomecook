/**
 * 图片上传 API 路由
 *
 * POST /api/upload
 * 优先使用云存储，失败则保存到本地
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth/guard";

// 上传到图床（如 imgbb、smms 等免费服务）
async function uploadToImageHost(file: File): Promise<string | null> {
  // 如果配置了 IMGBB_API_KEY，使用 imgbb
  const imgbbKey = process.env.IMGBB_API_KEY;
  if (imgbbKey) {
    try {
      const formData = new FormData();
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      formData.append("image", base64);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.data.url;
      }
    } catch (e) {
      console.error("imgbb upload failed:", e);
    }
  }

  return null;
}

// 保存到本地
async function saveToLocal(file: File, category: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/${category}/${filename}`;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type 必须是 multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "blog";

    if (!file) {
      return NextResponse.json({ error: "未找到文件" }, { status: 400 });
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
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大，最大支持 5MB" }, { status: 400 });
    }

    // 尝试上传到图床，失败则保存本地
    let url = await uploadToImageHost(file);
    let storage = "cloud";

    if (!url) {
      url = await saveToLocal(file, category);
      storage = "local";
    }

    return NextResponse.json({
      success: true,
      url,
      storage,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("图片上传错误:", error);
    return NextResponse.json(
      { error: "图片上传失败: " + (error as Error).message },
      { status: 500 }
    );
  }
}
