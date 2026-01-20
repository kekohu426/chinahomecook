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
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";
import { generateRecipe, generateStepImages, generateCoverImages } from "./generate-recipe";
import { validateAITags, extractTagsFromAIOutput, type ValidatedTags } from "./tag-validator";

/**
 * 生成结果类型
 */
export interface GenerateResult {
  recipeName: string;
  status: "success" | "failed";
  recipeId?: string;
  error?: string;
  warning?: string;
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

        if (result.success || result.data) {
          const recipeData = result.success ? result.data : result.data!;
          const generateWarning = result.success ? undefined : result.error;
          const validationIssues = result.success ? undefined : result.issues;
          // 保存到数据库（先落库草稿，避免后续失败丢失）
          const slug = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const tags = recipeData.tags || {};

          try {
            await ensureIngredientIconRecords(recipeData.ingredients);
          } catch (iconError) {
            console.error(`[Job ${jobId}] 食材图标同步失败，继续保存草稿:`, iconError);
          }

          const transStatus = generateWarning
            ? ({
                generateError: generateWarning,
                validationIssues,
              } as Record<string, unknown>)
            : undefined;

          // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
          const { tags: _aiTags, ...recipeDataWithoutTags } = recipeData;

          let recipe = await prisma.recipe.create({
            data: {
              title: recipeDataWithoutTags.titleZh,
              summary: recipeDataWithoutTags.summary as object,
              story: (recipeDataWithoutTags.story ?? recipeDataWithoutTags.culturalStory ?? null) as object,
              ingredients: recipeDataWithoutTags.ingredients as object[],
              steps: recipeDataWithoutTags.steps as object[],
              nutrition: (recipeDataWithoutTags.nutrition ?? null) as object,
              faq: (recipeDataWithoutTags.faq ?? null) as object,
              tips: (recipeDataWithoutTags.tips ?? null) as object,
              troubleshooting: (recipeDataWithoutTags.troubleshooting ?? null) as object,
              relatedRecipes: (recipeDataWithoutTags.relatedRecipes ?? null) as object,
              pairing: (recipeDataWithoutTags.pairing ?? null) as object,
              seo: (recipeDataWithoutTags.seo ?? null) as object,
              notes: (recipeDataWithoutTags.notes ?? null) as object,
              styleGuide: recipeDataWithoutTags.styleGuide as object,
              imageShots: recipeDataWithoutTags.imageShots as object[],
              slug,
              coverImage: undefined,
              aiGenerated: true,
              status: "draft",
              reviewStatus: "pending",
              transStatus,
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

          // 生成成功，生成图片
          const shouldGenerateImages = result.success;
          if (shouldGenerateImages) {
            console.log(`[Job ${jobId}] 开始为 ${dishName} 生成图片...`);
          }

          let imageError: string | undefined;
          let coverImage: string | undefined;
          try {
            // 生成步骤图
            if (shouldGenerateImages && recipeData.steps && recipeData.steps.length > 0) {
              recipeData.steps = await generateStepImages(
                recipeData.steps as any[],
                recipeData.titleZh || dishName
              ) as any;
            }

            // 生成成品图
            if (shouldGenerateImages && recipeData.imageShots && recipeData.imageShots.length > 0) {
              recipeData.imageShots = await generateCoverImages(
                recipeData.imageShots as any[],
                recipeData.titleZh || dishName
              ) as any;
            }

            // 设置封面图
            if (recipeData.imageShots && recipeData.imageShots.length > 0) {
              const coverShot = (recipeData.imageShots as any[]).find(
                (s: any) => (s.key === "hero" || s.key === "cover" || s.key === "cover_main") && s.imageUrl
              );
              if (coverShot) {
                coverImage = coverShot.imageUrl;
              } else {
                const firstSuccess = (recipeData.imageShots as any[]).find((s: any) => s.imageUrl);
                if (firstSuccess) {
                  coverImage = firstSuccess.imageUrl;
                }
              }
            }
          } catch (imageErr) {
            imageError = imageErr instanceof Error ? imageErr.message : String(imageErr);
            console.error(`[Job ${jobId}] 生成图片失败，继续保存草稿:`, imageErr);
          }

          if (imageError || coverImage || recipeData.imageShots || recipeData.steps || transStatus) {
            const mergedTransStatus = {
              ...(transStatus ?? {}),
              ...(imageError ? { imageError } : {}),
            };

            await prisma.recipe.update({
              where: { id: recipe.id },
              data: {
                steps: recipeData.steps as object[],
                imageShots: recipeData.imageShots as object[],
                coverImage,
                transStatus: Object.keys(mergedTransStatus).length > 0 ? mergedTransStatus : undefined,
              },
            });
          }

          // 处理标签关联
          try {
            const aiTags = extractTagsFromAIOutput(tags);
            const validatedTags = await validateAITags(aiTags, cuisineSlug);

            await createTagRelations(recipe.id, validatedTags.valid);

            // 未知标签暂时只记录日志，不入队
            if (validatedTags.unknown.length > 0) {
              console.log(`[Job ${jobId}] 发现 ${validatedTags.unknown.length} 个未知标签:`, validatedTags.unknown.map(t => t.slug));
            }
          } catch (tagError) {
            console.error(`[Job ${jobId}] 标签处理失败:`, tagError);
          }

          const warnings: string[] = [];
          if (generateWarning) {
            warnings.push(`已保存草稿，但生成校验失败: ${generateWarning}`);
          }
          if (imageError) {
            warnings.push(`图片生成失败: ${imageError}`);
          }

          results.push({
            recipeName: recipeData.titleZh,
            status: "success",
            recipeId: recipe.id,
            ...(warnings.length > 0 ? { warning: warnings.join("；") } : {}),
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
