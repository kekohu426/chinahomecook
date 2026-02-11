/**
 * AI API URL 验证器
 *
 * 防止 SSRF 攻击，只允许访问白名单内的 AI 服务
 */

// 允许的 AI 服务域名白名单
const ALLOWED_AI_HOSTS = [
  // OpenAI
  "api.openai.com",
  // DeepSeek
  "api.deepseek.com",
  // 智谱 AI (GLM)
  "open.bigmodel.cn",
  // Azure OpenAI
  "openai.azure.com",
  // Anthropic
  "api.anthropic.com",
  // 阿里云 DashScope
  "dashscope.aliyuncs.com",
  // 百度文心
  "aip.baidubce.com",
  // 腾讯混元
  "hunyuan.tencentcloudapi.com",
];

// 允许的域名后缀（用于支持子域名）
const ALLOWED_HOST_SUFFIXES = [
  ".openai.azure.com", // Azure OpenAI 区域端点
];

/**
 * 验证 AI API 的 Base URL 是否安全
 *
 * @param url - 要验证的 URL
 * @returns 是否为允许的 URL
 */
export function isValidAIBaseUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);

    // 必须是 HTTPS（生产环境安全要求）
    if (parsed.protocol !== "https:") {
      // 允许本地开发使用 HTTP
      if (
        parsed.protocol === "http:" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
      ) {
        return true;
      }
      return false;
    }

    // 检查是否在白名单中
    if (ALLOWED_AI_HOSTS.includes(parsed.host)) {
      return true;
    }

    // 检查是否匹配允许的后缀
    for (const suffix of ALLOWED_HOST_SUFFIXES) {
      if (parsed.host.endsWith(suffix)) {
        return true;
      }
    }

    return false;
  } catch {
    // URL 解析失败
    return false;
  }
}

/**
 * 验证并返回安全的 AI API URL
 *
 * @param url - 要验证的 URL
 * @param fallback - 验证失败时的回退 URL
 * @returns 安全的 URL
 * @throws {Error} 如果 URL 无效且没有提供回退
 */
export function getSafeAIBaseUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  if (isValidAIBaseUrl(url)) {
    return url!;
  }

  if (fallback && isValidAIBaseUrl(fallback)) {
    return fallback;
  }

  throw new Error(
    `无效的 AI 服务地址: ${url}。请使用白名单内的 AI 服务提供商。`
  );
}
