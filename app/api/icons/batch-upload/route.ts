/**
 * 批量上传食材图标 API
 *
 * 行为：
 * - 接受 multipart/form-data，字段 files[]
 * - 为每个文件生成 URL（云存储失败则落本地 public/uploads/ingredient-icons）
 * - 以文件名（去扩展名）作为食材名，更新/创建 Ingredient.iconUrl
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { Buffer } from "buffer";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// 显式使用 Node 运行时，避免 Edge 环境缺少 Buffer/fs
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "") || "icon";

async function uploadToImageHost(file: File): Promise<string | null> {
  const imgbbKey = process.env.IMGBB_API_KEY;
  if (!imgbbKey) return null;

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
      return data.data.url as string;
    }
  } catch (error) {
    console.error("imgbb upload failed:", error);
  }

  return null;
}

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
        { success: false, error: "Content-Type 必须是 multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "未找到文件" },
        { status: 400 }
      );
    }

    const results: Array<{ name: string; iconUrl: string | null; success: boolean; error?: string }> = [];

    for (const file of files) {
      const baseName = (file.name || "icon").replace(/\.[^.]+$/, "");

      if (!ALLOWED_TYPES.includes(file.type)) {
        results.push({ name: baseName, iconUrl: null, success: false, error: "文件类型不支持" });
        continue;
      }

      try {
        if (file.size > MAX_SIZE) {
          results.push({ name: baseName, iconUrl: null, success: false, error: "文件过大（>5MB）" });
          continue;
        }

        let url = await uploadToImageHost(file);
        if (!url) {
          url = await saveToLocal(file, "ingredient-icons");
        }

        const iconKey = slugify(baseName);

        const existing = await prisma.ingredient.findUnique({
          where: { name: baseName },
        });

        const transStatus = existing?.transStatus ?? {};

        if (existing) {
          await prisma.ingredient.update({
            where: { id: existing.id },
            data: {
              iconUrl: url,
              iconKey,
              transStatus: {
                ...(transStatus as object),
                iconSource: "batch-upload",
                iconAliases: [],
                iconActive: true,
              },
            },
          });
        } else {
          await prisma.ingredient.create({
            data: {
              name: baseName,
              iconUrl: url,
              iconKey,
              transStatus: {
                iconSource: "batch-upload",
                iconAliases: [],
                iconActive: true,
              },
            },
          });
        }

        results.push({ name: baseName, iconUrl: url, success: true });
      } catch (error) {
        console.error("批量上传单个文件失败:", error);
        results.push({
          name: baseName,
          iconUrl: null,
          success: false,
          error: "保存失败",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("批量上传食材图标失败:", error);
    return NextResponse.json(
      { success: false, error: "批量上传失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}
