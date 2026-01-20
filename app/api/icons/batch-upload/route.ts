/**
 * 批量上传食材图标 API
 *
 * 行为：
 * - 接受 multipart/form-data，字段 files[]
 * - 为每个文件生成 URL（云存储失败则落本地 public/uploads/ingredient-icons）
 * - 以文件名（去扩展名）作为食材名，更新/创建 Ingredient.iconUrl
 */

import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { Buffer } from "buffer";
import { Readable } from "stream";
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

const decodeFilename = (value: string) => {
  if (!value) return "icon";
  try {
    const decoded = Buffer.from(value, "latin1").toString("utf8");
    return decoded.replace(/\u0000/g, "") || value;
  } catch {
    return value;
  }
};

type IncomingFile = {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
};

type ParseResult = {
  files: IncomingFile[];
  errors: Array<{ name: string; iconUrl: null; success: false; error: string }>;
};

async function uploadToImageHost(file: IncomingFile): Promise<string | null> {
  const imgbbKey = process.env.IMGBB_API_KEY;
  if (!imgbbKey) return null;

  try {
    const formData = new FormData();
    const base64 = file.buffer.toString("base64");
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

async function saveToLocal(file: IncomingFile, category: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, file.buffer);

  return `/uploads/${category}/${filename}`;
}

const stripExt = (filename: string) =>
  (filename || "icon").replace(/\.[^.]+$/, "");

async function parseMultipart(request: NextRequest): Promise<ParseResult> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return { files: [], errors: [] };
  }

  return new Promise((resolve, reject) => {
    const files: IncomingFile[] = [];
    const errors: ParseResult["errors"] = [];
    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: { fileSize: MAX_SIZE },
    });

    busboy.on("file", (_fieldname, file, info) => {
      const filename = decodeFilename(info.filename || "icon");
      const mimeType = info.mimeType || "application/octet-stream";
      const baseName = stripExt(filename);

      if (!ALLOWED_TYPES.includes(mimeType)) {
        errors.push({
          name: baseName,
          iconUrl: null,
          success: false,
          error: "文件类型不支持",
        });
        file.resume();
        return;
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;
      let tooLarge = false;

      file.on("limit", () => {
        tooLarge = true;
        file.resume();
      });

      file.on("data", (data: Buffer) => {
        if (tooLarge) return;
        totalSize += data.length;
        if (totalSize > MAX_SIZE) {
          tooLarge = true;
          return;
        }
        chunks.push(data);
      });

      file.on("end", () => {
        if (tooLarge) {
          errors.push({
            name: baseName,
            iconUrl: null,
            success: false,
            error: "文件过大（>5MB）",
          });
          return;
        }
        files.push({
          name: filename,
          type: mimeType,
          size: totalSize,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("error", (error) => reject(error));
    busboy.on("finish", () => resolve({ files, errors }));

    if (!request.body) {
      resolve({ files: [], errors });
      return;
    }

    Readable.fromWeb(request.body as any).pipe(busboy);
  });
}

async function parseJson(request: NextRequest): Promise<ParseResult> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { files: [], errors: [] };
  }

  let body: { files?: unknown } | null = null;
  try {
    const buffer = await request.arrayBuffer();
    const text = Buffer.from(buffer).toString("utf8");
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("解析 JSON 失败:", error);
  }

  const items = Array.isArray(body?.files) ? body.files : [];
  const files: IncomingFile[] = [];
  const errors: ParseResult["errors"] = [];

  items.forEach((item: { name?: string; type?: string; data?: string }) => {
    if (!item?.data) return;
    const base64 = item.data.includes(",") ? item.data.split(",")[1] : item.data;
    const buffer = Buffer.from(base64, "base64");
    const name = item.name || "icon";
    const type = item.type || "image/png";
    files.push({
      name,
      type,
      size: buffer.length,
      buffer,
    });
  });

  return { files, errors };
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const contentType = request.headers.get("content-type") || "";
    const parsed = contentType.includes("multipart/form-data")
      ? await parseMultipart(request)
      : await parseJson(request);

    const files = parsed.files;
    const results: Array<{ name: string; iconUrl: string | null; success: boolean; error?: string }> = [
      ...parsed.errors,
    ];

    if (files.length === 0 && results.length === 0) {
      return NextResponse.json(
        { success: false, error: "未找到文件" },
        { status: 400 }
      );
    }

    for (const file of files) {
      const baseName = stripExt(file.name);

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
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { success: false, error: `批量上传失败: ${message}` },
      { status: 500 }
    );
  }
}
