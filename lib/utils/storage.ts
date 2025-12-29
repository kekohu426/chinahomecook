/**
 * Cloudflare R2 图片存储工具
 *
 * 基于 S3-compatible API 实现图片上传和管理
 * 文档：https://developers.cloudflare.com/r2/api/s3/api/
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 客户端配置
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "recipe-zen-images";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * 上传图片到 R2
 *
 * @param file - 图片文件
 * @param path - 存储路径（例：recipes/beer-duck/step-1.jpg）
 * @returns 图片的公开访问 URL
 */
export async function uploadImage(
  file: File | Buffer,
  path: string
): Promise<string> {
  // 验证配置
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID) {
    throw new Error("R2 配置未完成，请检查环境变量");
  }

  try {
    // 准备文件数据
    let buffer: Buffer;
    let contentType: string;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = file.type || "image/jpeg";
    } else {
      buffer = file;
      contentType = getContentTypeFromPath(path);
    }

    // 上传到 R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // 返回公开访问 URL
    return `${PUBLIC_URL}/${path}`;
  } catch (error) {
    console.error("R2 上传失败:", error);
    throw new Error("图片上传失败");
  }
}

/**
 * 删除 R2 中的图片
 *
 * @param path - 图片路径
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error("R2 删除失败:", error);
    throw new Error("图片删除失败");
  }
}

/**
 * 生成预签名上传 URL
 *
 * 允许客户端直接上传到 R2（更安全，不经过服务器）
 *
 * @param path - 存储路径
 * @param expiresIn - URL 有效期（秒，默认 1 小时）
 * @returns 预签名 URL
 */
export async function generatePresignedUploadUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * 根据文件路径推断 Content-Type
 */
function getContentTypeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * 生成安全的文件名
 *
 * @param originalName - 原始文件名
 * @param prefix - 路径前缀（例：recipes/beer-duck）
 * @returns 安全的存储路径
 */
export function generateSafeFilename(originalName: string, prefix = ""): string {
  // 生成时间戳 + 随机字符串
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  // 提取文件扩展名
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";

  // 组合路径
  const filename = `${timestamp}-${random}.${ext}`;
  return prefix ? `${prefix}/${filename}` : filename;
}
