/**
 * 图片URL处理工具
 *
 * 支持配置：
 * - IMAGE_PROXY_URL: 图片代理地址（可选）
 * - IMAGE_SOURCE: 图片来源 "auto" | "r2" | "origin"
 *
 * 将来配置 R2 后，只需设置环境变量即可切换
 */

// R2 配置（将来使用）
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

// 图片代理配置（可选，用于解决跨域/被墙问题）
const IMAGE_PROXY_URL = process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || "";

// 图片来源配置: "auto" | "r2" | "origin"
const IMAGE_SOURCE = process.env.NEXT_PUBLIC_IMAGE_SOURCE || "auto";

/**
 * 处理图片URL
 *
 * @param url 原始图片URL
 * @returns 处理后的URL
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // 如果配置了 R2 且来源设置为 r2
  if (IMAGE_SOURCE === "r2" && R2_PUBLIC_URL) {
    // 如果已经是 R2 URL，直接返回
    if (url.startsWith(R2_PUBLIC_URL)) {
      return url;
    }
    // 否则尝试构建 R2 URL（需要图片已迁移到 R2）
    // 这里假设 R2 中的路径结构与原始 URL 的文件名相同
    const filename = url.split("/").pop();
    if (filename) {
      return `${R2_PUBLIC_URL}/images/${filename}`;
    }
  }

  // 如果配置了代理
  if (IMAGE_PROXY_URL && IMAGE_SOURCE === "auto") {
    // 对外部图片使用代理
    if (url.startsWith("http") && !url.includes("localhost")) {
      return `${IMAGE_PROXY_URL}?url=${encodeURIComponent(url)}`;
    }
  }

  // 默认返回原始URL
  return url;
}

/**
 * 检查URL是否为外部图片
 */
export function isExternalImage(url: string): boolean {
  if (!url) return false;
  return url.startsWith("http") && !url.includes("localhost");
}

/**
 * 获取占位图URL
 */
export function getPlaceholderImage(type: "cover" | "step" | "ingredient" = "cover"): string {
  const placeholders: Record<string, string> = {
    cover: "/images/placeholder-cover.svg",
    step: "/images/placeholder-step.svg",
    ingredient: "/images/placeholder-ingredient.svg",
  };
  return placeholders[type] || placeholders.cover;
}

/**
 * 图片配置信息（用于调试）
 */
export function getImageConfig() {
  return {
    source: IMAGE_SOURCE,
    proxyUrl: IMAGE_PROXY_URL,
    r2Url: R2_PUBLIC_URL,
  };
}
