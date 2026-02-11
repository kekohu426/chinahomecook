/**
 * 简单的内存速率限制器
 *
 * 用于限制 API 请求频率，防止滥用
 * 注意：在 Serverless 环境中，每个实例有独立的内存，
 * 生产环境建议使用 Redis 实现
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// 内存存储（Serverless 环境下每个实例独立）
const rateLimitStore = new Map<string, RateLimitRecord>();

// 定期清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface RateLimitOptions {
  /** 时间窗口内允许的最大请求数 */
  limit: number;
  /** 时间窗口（毫秒） */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * 获取客户端标识符
 */
function getClientId(request: Request): string {
  // 优先使用 X-Forwarded-For（代理后的真实 IP）
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // 其次使用 X-Real-IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // 降级使用 User-Agent 作为标识（不太可靠）
  return request.headers.get("user-agent") || "unknown";
}

/**
 * 检查速率限制
 *
 * @param request - 请求对象
 * @param options - 速率限制选项
 * @returns 速率限制结果
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  const clientId = getClientId(request);
  const key = `rate-limit:${clientId}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // 如果没有记录或已过期，创建新记录
  if (!record || record.resetAt < now) {
    record = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt: record.resetAt,
    };
  }

  // 检查是否超过限制
  if (record.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // 增加计数
  record.count++;
  return {
    success: true,
    remaining: options.limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * 速率限制中间件（用于 API 路由）
 *
 * 默认配置：每分钟 30 次请求
 */
export function rateLimit(
  request: Request,
  options: Partial<RateLimitOptions> = {}
): RateLimitResult {
  const defaultOptions: RateLimitOptions = {
    limit: 30,
    windowMs: 60 * 1000, // 1 分钟
  };

  return checkRateLimit(request, { ...defaultOptions, ...options });
}
