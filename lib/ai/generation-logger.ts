/**
 * AI 生成日志工具类
 *
 * 提供简化的日志写入接口，支持异步写入，不阻塞主流程
 * 性能优化：批量写入、队列机制、错误容错
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db/prisma";

export interface LogStepParams {
  sessionId: string;
  stepName: string;
  modelName: string;
  status: "success" | "failed" | "partial";

  // 可选字段
  provider?: string;
  prompt?: string;
  promptUrl?: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
  resultUrl?: string;
  resultText?: string;
  resultImages?: string[];
  durationMs?: number;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  cost?: number;
  retryIndex?: number;
  recipeId?: string;
  jobId?: string;
  userId?: string;
  errorMessage?: string;
  errorStack?: string;
  warning?: string;
  metadata?: Record<string, unknown>;
}

// 日志队列（内存中暂存，批量写入）
class LogQueue {
  private queue: LogStepParams[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly maxQueueSize = 50; // 最大队列长度
  private readonly flushInterval = 5000; // 5秒自动刷新
  private isFlushing = false;

  add(log: LogStepParams): void {
    this.queue.push(log);

    // 队列满了，立即刷新
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    } else {
      // 否则延迟刷新
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;

    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 取出当前队列
    const logsToFlush = this.queue.splice(0, this.maxQueueSize);

    try {
      // 直接写入数据库（服务端环境）
      await prisma.aIGenerationLog.createMany({
        data: logsToFlush.map((log) => ({
          sessionId: log.sessionId,
          stepName: log.stepName,
          modelName: log.modelName,
          status: log.status,
          provider: log.provider,
          prompt: log.prompt,
          promptUrl: log.promptUrl,
          parameters: log.parameters as Record<string, unknown> | undefined,
          result: log.result as Record<string, unknown> | undefined,
          resultUrl: log.resultUrl,
          resultText: log.resultText,
          resultImages: log.resultImages,
          durationMs: log.durationMs,
          tokenUsage: log.tokenUsage as Record<string, unknown> | undefined,
          cost: log.cost,
          retryIndex: log.retryIndex,
          recipeId: log.recipeId,
          jobId: log.jobId,
          userId: log.userId,
          errorMessage: log.errorMessage,
          errorStack: log.errorStack,
          warning: log.warning,
          metadata: log.metadata as Record<string, unknown> | undefined,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error("Failed to flush logs to database:", error);
      // 失败了也不重试，避免内存泄漏
    } finally {
      this.isFlushing = false;

      // 如果还有日志，继续刷新
      if (this.queue.length > 0) {
        this.scheduleFlush();
      }
    }
  }

  // 强制刷新（用于进程退出前）
  async forceFlush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// 全局日志队列
const globalLogQueue = new LogQueue();

/**
 * 生成新的会话ID
 */
export function generateSessionId(): string {
  return `session_${uuidv4()}`;
}

/**
 * 写入日志步骤（异步，批量，不阻塞）
 */
export function logStep(params: LogStepParams): void {
  // 立即返回，不等待写入
  globalLogQueue.add(params);
}

/**
 * 强制刷新日志队列（用于进程退出前）
 */
export async function flushLogs(): Promise<void> {
  await globalLogQueue.forceFlush();
}

/**
 * 计算成本（基于 token 使用量）
 * 价格表更新于 2025-01
 */
export function calculateCost(
  modelName: string,
  tokenUsage: { input?: number; output?: number }
): number {
  // 模型价格表（每 1K tokens 的价格，单位：美元）
  // 2025-01 更新
  const MODEL_PRICING: Record<
    string,
    { input: number; output: number } | { perImage: number }
  > = {
    // OpenAI GPT 系列
    "gpt-4o": { input: 0.0025, output: 0.01 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "gpt-4": { input: 0.03, output: 0.06 },
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
    "o1": { input: 0.015, output: 0.06 },
    "o1-mini": { input: 0.003, output: 0.012 },
    "o1-preview": { input: 0.015, output: 0.06 },
    // Anthropic Claude 系列
    "claude-3-opus": { input: 0.015, output: 0.075 },
    "claude-3-5-sonnet": { input: 0.003, output: 0.015 },
    "claude-3-sonnet": { input: 0.003, output: 0.015 },
    "claude-3-haiku": { input: 0.00025, output: 0.00125 },
    "claude-3-5-haiku": { input: 0.0008, output: 0.004 },
    // Google Gemini 系列
    "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
    "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
    "gemini-2.0-flash": { input: 0.0001, output: 0.0004 },
    // DeepSeek 系列
    "deepseek-chat": { input: 0.00014, output: 0.00028 },
    "deepseek-reasoner": { input: 0.00055, output: 0.00219 },
    // 图像生成
    "dall-e-3": { perImage: 0.04 },
    "dall-e-3-hd": { perImage: 0.08 },
    "dall-e-2": { perImage: 0.02 },
    "flux-pro": { perImage: 0.055 },
    "flux-dev": { perImage: 0.025 },
    "flux-schnell": { perImage: 0.003 },
    "ideogram-v2": { perImage: 0.08 },
    "stable-diffusion-3": { perImage: 0.035 },
    "midjourney": { perImage: 0.05 },
  };

  // 尝试模糊匹配模型名称
  let pricing = MODEL_PRICING[modelName];
  if (!pricing) {
    // 尝试去掉版本号后缀匹配
    const baseName = modelName.replace(/-\d{4,}.*$/, "").replace(/-latest$/, "");
    pricing = MODEL_PRICING[baseName];
  }
  if (!pricing) {
    // 尝试前缀匹配
    for (const [key, value] of Object.entries(MODEL_PRICING)) {
      if (modelName.startsWith(key) || modelName.includes(key)) {
        pricing = value;
        break;
      }
    }
  }

  if (!pricing) {
    return 0;
  }

  if ("perImage" in pricing) {
    return pricing.perImage;
  }

  const inputCost = ((tokenUsage.input || 0) / 1000) * pricing.input;
  const outputCost = ((tokenUsage.output || 0) / 1000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * 测量执行时间的辅助函数
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const startTime = Date.now();
  const result = await fn();
  const durationMs = Date.now() - startTime;
  return { result, durationMs };
}

/**
 * 日志记录器类（支持链式调用）
 */
export class AIGenerationLogger {
  private sessionId: string;
  private defaultParams: Partial<LogStepParams>;

  constructor(sessionId?: string, defaultParams?: Partial<LogStepParams>) {
    this.sessionId = sessionId || generateSessionId();
    this.defaultParams = defaultParams || {};
  }

  getSessionId(): string {
    return this.sessionId;
  }

  log(params: Omit<LogStepParams, "sessionId">): void {
    logStep({
      ...this.defaultParams,
      ...params,
      sessionId: this.sessionId,
    });
  }

  logSuccess(
    stepName: string,
    modelName: string,
    data: Partial<LogStepParams>
  ): void {
    this.log({
      stepName,
      modelName,
      status: "success",
      ...data,
    });
  }

  logFailure(
    stepName: string,
    modelName: string,
    error: Error,
    data?: Partial<LogStepParams>
  ): void {
    this.log({
      stepName,
      modelName,
      status: "failed",
      errorMessage: error.message,
      errorStack: error.stack,
      ...data,
    });
  }

  async measure<T>(
    stepName: string,
    modelName: string,
    fn: () => Promise<T>,
    extraParams?: Partial<LogStepParams>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      this.logSuccess(stepName, modelName, {
        durationMs,
        ...extraParams,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logFailure(stepName, modelName, error as Error, {
        durationMs,
        ...extraParams,
      });

      throw error;
    }
  }
}

