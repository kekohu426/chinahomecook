/**
 * TranslationJob 执行器
 *
 * 负责执行翻译任务：
 * 1. 获取任务详情
 * 2. 更新状态为 processing
 * 3. 调用翻译服务
 * 4. 保存结果和质量分数
 * 5. 处理重试逻辑
 */

import { prisma } from "@/lib/db/prisma";
import { translateEntity, type SupportedLocale } from "./translate";

/**
 * 任务执行结果
 */
export interface TranslationJobResult {
  success: boolean;
  data?: Record<string, unknown>;
  qualityScore?: number;
  error?: string;
}

/**
 * 检查任务是否已取消
 */
async function isJobCancelled(jobId: string): Promise<boolean> {
  const job = await prisma.translationJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  return job?.status === "cancelled";
}

/**
 * 执行单个翻译任务
 */
export async function executeTranslationJob(jobId: string): Promise<TranslationJobResult> {
  try {
    // 1. 获取任务详情
    const job = await prisma.translationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return { success: false, error: "任务不存在" };
    }

    // 检查任务状态
    if (job.status !== "pending") {
      return {
        success: false,
        error: `任务状态异常: ${job.status}`,
      };
    }

    // 2. 更新状态为 processing
    await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        startedAt: new Date(),
      },
    });

    // 检查取消状态
    if (await isJobCancelled(jobId)) {
      return { success: false, error: "任务已取消" };
    }

    console.log(`[TranslationJob ${jobId}] 开始翻译 ${job.entityType}:${job.entityId} -> ${job.targetLang}`);

    // 3. 调用翻译服务
    const result = await translateEntity(
      job.entityType,
      job.entityId,
      job.targetLang as SupportedLocale,
      { autoReview: false }
    );

    if (result.success) {
      // 4. 保存成功结果
      await prisma.translationJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          completedAt: new Date(),
          result: result.data as object,
          qualityScore: result.qualityScore,
        },
      });

      console.log(`[TranslationJob ${jobId}] 翻译完成，质量分数: ${result.qualityScore}`);

      return {
        success: true,
        data: result.data,
        qualityScore: result.qualityScore,
      };
    } else {
      // 翻译失败，检查是否可以重试
      const newRetryCount = job.retryCount + 1;
      const canRetry = newRetryCount < job.maxRetries;

      await prisma.translationJob.update({
        where: { id: jobId },
        data: {
          status: canRetry ? "pending" : "failed",
          retryCount: newRetryCount,
          errorMessage: result.error,
          completedAt: canRetry ? null : new Date(),
        },
      });

      console.error(`[TranslationJob ${jobId}] 翻译失败: ${result.error}, 重试次数: ${newRetryCount}/${job.maxRetries}`);

      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`[TranslationJob ${jobId}] 执行异常:`, error);

    // 更新任务状态为失败
    try {
      const job = await prisma.translationJob.findUnique({
        where: { id: jobId },
        select: { retryCount: true, maxRetries: true },
      });

      if (job) {
        const newRetryCount = job.retryCount + 1;
        const canRetry = newRetryCount < job.maxRetries;

        await prisma.translationJob.update({
          where: { id: jobId },
          data: {
            status: canRetry ? "pending" : "failed",
            retryCount: newRetryCount,
            errorMessage: (error as Error).message,
            completedAt: canRetry ? null : new Date(),
          },
        });
      }
    } catch (updateError) {
      console.error(`[TranslationJob ${jobId}] 更新失败状态失败:`, updateError);
    }

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 异步执行任务（不等待完成）
 */
export function executeTranslationJobAsync(jobId: string): void {
  setImmediate(() => {
    executeTranslationJob(jobId).catch((error) => {
      console.error(`[TranslationJob ${jobId}] 异步执行失败:`, error);
    });
  });
}

/**
 * 取消任务
 */
export async function cancelTranslationJob(jobId: string): Promise<boolean> {
  try {
    const job = await prisma.translationJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    if (!job) {
      return false;
    }

    // 只有 pending 或 processing 状态的任务可以取消
    if (job.status !== "pending" && job.status !== "processing") {
      return false;
    }

    await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        completedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error(`[TranslationJob ${jobId}] 取消失败:`, error);
    return false;
  }
}

/**
 * 重试失败的任务
 */
export async function retryTranslationJob(jobId: string): Promise<boolean> {
  try {
    const job = await prisma.translationJob.findUnique({
      where: { id: jobId },
      select: { status: true, retryCount: true, maxRetries: true },
    });

    if (!job) {
      return false;
    }

    // 只有 failed 状态的任务可以重试
    if (job.status !== "failed") {
      return false;
    }

    // 重置为 pending 状态
    await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: "pending",
        errorMessage: null,
        completedAt: null,
        // 可选：重置重试计数或保留
      },
    });

    return true;
  } catch (error) {
    console.error(`[TranslationJob ${jobId}] 重试失败:`, error);
    return false;
  }
}

/**
 * 处理待翻译队列
 *
 * 按优先级获取并执行待翻译任务
 *
 * @param limit 一次处理的最大任务数
 * @returns 处理的任务数量
 */
export async function processTranslationQueue(limit: number = 10): Promise<number> {
  try {
    // 获取待翻译任务（按优先级排序，优先级数字越小越优先）
    const pendingJobs = await prisma.translationJob.findMany({
      where: { status: "pending" },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    if (pendingJobs.length === 0) {
      return 0;
    }

    console.log(`[TranslationQueue] 发现 ${pendingJobs.length} 个待翻译任务`);

    let processedCount = 0;

    for (const job of pendingJobs) {
      const result = await executeTranslationJob(job.id);
      if (result.success) {
        processedCount++;
      }

      // 任务之间添加延迟，避免 API 限流
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`[TranslationQueue] 完成 ${processedCount}/${pendingJobs.length} 个翻译任务`);

    return processedCount;
  } catch (error) {
    console.error("[TranslationQueue] 处理队列失败:", error);
    return 0;
  }
}

/**
 * 创建翻译任务
 *
 * @param entityType 实体类型
 * @param entityId 实体 ID
 * @param targetLang 目标语言
 * @param priority 优先级（1-10，越小越优先）
 * @returns 创建的任务 ID，如果已存在则返回现有任务 ID
 */
export async function createTranslationJob(
  entityType: string,
  entityId: string,
  targetLang: string,
  priority: number = 5
): Promise<string> {
  // 检查是否已存在相同的待翻译任务
  const existingJob = await prisma.translationJob.findFirst({
    where: {
      entityType,
      entityId,
      targetLang,
      status: { in: ["pending", "processing"] },
    },
  });

  if (existingJob) {
    return existingJob.id;
  }

  // 创建新任务
  const job = await prisma.translationJob.create({
    data: {
      entityType,
      entityId,
      targetLang,
      priority,
      status: "pending",
    },
  });

  return job.id;
}

/**
 * 批量创建翻译任务
 */
export async function createTranslationJobsBatch(
  jobs: Array<{
    entityType: string;
    entityId: string;
    targetLang: string;
    priority?: number;
  }>
): Promise<string[]> {
  const jobIds: string[] = [];

  for (const job of jobs) {
    const jobId = await createTranslationJob(
      job.entityType,
      job.entityId,
      job.targetLang,
      job.priority ?? 5
    );
    jobIds.push(jobId);
  }

  return jobIds;
}
