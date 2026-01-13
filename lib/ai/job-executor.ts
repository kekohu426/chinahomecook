/**
 * GenerateJob 执行器
 *
 * 负责执行异步生成任务：
 * 1. 获取任务详情
 * 2. 更新状态为 running
 * 3. 循环生成食谱
 * 4. 检查取消状态
 * 5. 更新进度和结果
 *
 * 注意：标签关联现在使用统一的 RecipeTag 表
 */

import { prisma } from "@/lib/db/prisma";
import { generateRecipe } from "./generate-recipe";
import { validateAITags, extractTagsFromAIOutput, type ValidatedTags } from "./tag-validator";
import { enqueueUnknownTags } from "./tag-queue";

/**
 * 生成结果类型
 */
export interface GenerateResult {
  recipeName: string;
  status: "success" | "failed";
  recipeId?: string;
  error?: string;
}

/**
 * 任务执行结果
 */
export interface JobExecutionResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  results: GenerateResult[];
  error?: string;
}

/**
 * LockedTags 类型
 */
interface LockedTags {
  cuisine?: string;
  location?: string;
  scene?: string;
  method?: string;
  taste?: string;
  crowd?: string;
  occasion?: string;
}

/**
 * 创建标签关联记录 - 使用统一的 RecipeTag 表
 */
async function createTagRelations(
  recipeId: string,
  validatedTags: ValidatedTags["valid"]
): Promise<{ created: number; errors: string[] }> {
  let created = 0;
  const errors: string[] = [];

  // 收集所有标签 ID
  const tagIds: string[] = [];

  if (validatedTags.scenes) {
    tagIds.push(...validatedTags.scenes);
  }
  if (validatedTags.methods) {
    tagIds.push(...validatedTags.methods);
  }
  if (validatedTags.tastes) {
    tagIds.push(...validatedTags.tastes);
  }
  if (validatedTags.crowds) {
    tagIds.push(...validatedTags.crowds);
  }
  if (validatedTags.occasions) {
    tagIds.push(...validatedTags.occasions);
  }

  // 使用 RecipeTag 创建关联
  for (const tagId of tagIds) {
    try {
      await prisma.recipeTag.create({
        data: { recipeId, tagId },
      });
      created++;
    } catch (err: any) {
      // P2002 是唯一约束冲突，表示已存在，不需要报错
      if (err.code !== "P2002") {
        errors.push(`Tag ${tagId}: ${err.message}`);
      }
    }
  }

  return { created, errors };
}

/**
 * 检查任务是否已取消
 */
async function isJobCancelled(jobId: string): Promise<boolean> {
  const job = await prisma.generateJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  return job?.status === "cancelled";
}

/**
 * 更新任务进度
 */
async function updateJobProgress(
  jobId: string,
  successCount: number,
  failedCount: number,
  results: GenerateResult[]
): Promise<void> {
  await prisma.generateJob.update({
    where: { id: jobId },
    data: {
      successCount,
      failedCount,
      results: results as any,
    },
  });
}

/**
 * 执行生成任务
 */
export async function executeGenerateJob(jobId: string): Promise<JobExecutionResult> {
  const results: GenerateResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // 1. 获取任务详情
    const job = await prisma.generateJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return {
        success: false,
        successCount: 0,
        failedCount: 0,
        results: [],
        error: "任务不存在",
      };
    }

    // 检查任务状态
    if (job.status !== "pending") {
      return {
        success: false,
        successCount: job.successCount,
        failedCount: job.failedCount,
        results: (job.results as unknown as GenerateResult[]) || [],
        error: `任务状态异常: ${job.status}`,
      };
    }

    // 2. 更新状态为 running
    await prisma.generateJob.update({
      where: { id: jobId },
      data: {
        status: "running",
        startedAt: new Date(),
      },
    });

    // 解析锁定标签
    const lockedTags = (job.lockedTags as LockedTags) || {};
    const cuisineSlug = lockedTags.cuisine;
    const locationSlug = lockedTags.location;

    // 确定要生成的菜名列表
    const recipeNames = job.recipeNames && job.recipeNames.length > 0
      ? job.recipeNames
      : Array.from({ length: job.totalCount }, (_, i) => `菜品${i + 1}`);

    // 3. 循环生成食谱
    for (let i = 0; i < recipeNames.length; i++) {
      const dishName = recipeNames[i];

      // 4. 检查取消状态
      if (await isJobCancelled(jobId)) {
        await prisma.generateJob.update({
          where: { id: jobId },
          data: {
            status: "cancelled",
            completedAt: new Date(),
            successCount,
            failedCount,
            results: results as any,
          },
        });
        return {
          success: true,
          successCount,
          failedCount,
          results,
          error: "任务已取消",
        };
      }

      console.log(`[Job ${jobId}] 生成 ${i + 1}/${recipeNames.length}: ${dishName}`);

      try {
        // 调用生成函数
        const result = await generateRecipe({
          dishName,
          location: locationSlug,
          cuisine: cuisineSlug,
        });

        if (result.success) {
          // 生成成功，保存到数据库
          const slug = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const tags = result.data.tags || {};

          // 创建食谱
          const recipe = await prisma.recipe.create({
            data: {
              title: result.data.titleZh,
              summary: result.data.summary as object,
              story: result.data.story as object,
              ingredients: result.data.ingredients as object[],
              steps: result.data.steps as object[],
              styleGuide: result.data.styleGuide as object,
              imageShots: result.data.imageShots as object[],
              slug,
              aiGenerated: true,
              status: "draft",
              // 关联菜系和地点（如果锁定了）
              ...(cuisineSlug ? {
                cuisine: {
                  connect: { slug: cuisineSlug },
                },
              } : {}),
              ...(locationSlug ? {
                location: {
                  connect: { slug: locationSlug },
                },
              } : {}),
            },
          });

          // 处理标签关联
          try {
            const aiTags = extractTagsFromAIOutput(tags);
            const validatedTags = await validateAITags(aiTags, cuisineSlug);

            await createTagRelations(recipe.id, validatedTags.valid);

            if (validatedTags.unknown.length > 0) {
              await enqueueUnknownTags(validatedTags.unknown, recipe.id, result.data.titleZh);
            }
          } catch (tagError) {
            console.error(`[Job ${jobId}] 标签处理失败:`, tagError);
          }

          results.push({
            recipeName: result.data.titleZh,
            status: "success",
            recipeId: recipe.id,
          });
          successCount++;
        } else {
          results.push({
            recipeName: dishName,
            status: "failed",
            error: result.error,
          });
          failedCount++;
        }
      } catch (error: any) {
        console.error(`[Job ${jobId}] 生成 ${dishName} 失败:`, error);
        results.push({
          recipeName: dishName,
          status: "failed",
          error: error.message || String(error),
        });
        failedCount++;
      }

      // 5. 更新进度
      await updateJobProgress(jobId, successCount, failedCount, results);
    }

    // 完成任务
    const finalStatus = failedCount === 0
      ? "completed"
      : successCount === 0
      ? "failed"
      : "partial";

    await prisma.generateJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        successCount,
        failedCount,
        results: results as any,
      },
    });

    return {
      success: true,
      successCount,
      failedCount,
      results,
    };
  } catch (error: any) {
    console.error(`[Job ${jobId}] 执行失败:`, error);

    // 更新任务状态为失败
    try {
      await prisma.generateJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          completedAt: new Date(),
          successCount,
          failedCount,
          results: results as any,
        },
      });
    } catch (updateError) {
      console.error(`[Job ${jobId}] 更新失败状态失败:`, updateError);
    }

    return {
      success: false,
      successCount,
      failedCount,
      results,
      error: error.message || String(error),
    };
  }
}

/**
 * 异步执行任务（不等待完成）
 */
export function executeGenerateJobAsync(jobId: string): void {
  // 使用 setImmediate 或 setTimeout 确保不阻塞请求
  setImmediate(() => {
    executeGenerateJob(jobId).catch((error) => {
      console.error(`[Job ${jobId}] 异步执行失败:`, error);
    });
  });
}

/**
 * 取消任务
 */
export async function cancelGenerateJob(jobId: string): Promise<boolean> {
  try {
    const job = await prisma.generateJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });

    if (!job) {
      return false;
    }

    // 只有 pending 或 running 状态的任务可以取消
    if (job.status !== "pending" && job.status !== "running") {
      return false;
    }

    await prisma.generateJob.update({
      where: { id: jobId },
      data: { status: "cancelled" },
    });

    return true;
  } catch (error) {
    console.error(`[Job ${jobId}] 取消失败:`, error);
    return false;
  }
}

/**
 * 重试失败的任务
 */
export async function retryGenerateJob(jobId: string): Promise<string | null> {
  try {
    const job = await prisma.generateJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return null;
    }

    // 只有 failed 或 partial 状态的任务可以重试
    if (job.status !== "failed" && job.status !== "partial") {
      return null;
    }

    // 创建新任务，只包含失败的菜名
    const oldResults = (job.results as unknown as GenerateResult[]) || [];
    const failedNames = oldResults
      .filter((r) => r.status === "failed")
      .map((r) => r.recipeName);

    if (failedNames.length === 0) {
      return null;
    }

    const newJob = await prisma.generateJob.create({
      data: {
        sourceType: job.sourceType,
        collectionId: job.collectionId,
        lockedTags: job.lockedTags as any,
        recipeNames: failedNames,
        totalCount: failedNames.length,
        status: "pending",
      },
    });

    return newJob.id;
  } catch (error) {
    console.error(`[Job ${jobId}] 重试创建失败:`, error);
    return null;
  }
}
