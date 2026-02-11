/**
 * 图片生成任务执行器
 * 处理 ImageGenTask 的提示词生成和图片生成
 * 支持：步骤图 + 成品图
 */

import { prisma } from "@/lib/db/prisma";
import { promptGenerator } from "@/lib/ai/prompt-generator";
import { evolinkClient } from "@/lib/ai/evolink";
import { StepPrompt, DishStyle, HealingSceneContext } from "@/types/prompt-generator";
import { AIGenerationLogger, flushLogs } from "@/lib/ai/generation-logger";

// ========== 类型定义 ==========

export interface StepInput {
  number: number;
  description?: string;
  title?: string;
  action?: string;
  speechText?: string;
}

export interface ImageResult {
  stepNumber: number;
  imageUrl?: string;
  error?: string;
}

// 成品图提示词结果（从 AI 返回的 step 0 提取）
export interface ImageShotPrompt {
  key: string;           // 固定为 "cover"
  ratio: string;         // 默认 16:9
  imagePrompt: string;
  negativePrompt?: string;
}

// 成品图生成结果
export interface ImageShotResult {
  key: string;
  ratio: string;
  imagePrompt?: string;
  imageUrl?: string;
  error?: string;
}

type TaskStatus = "pending" | "generating_prompts" | "generating_images" | "completed" | "failed";

// ========== 主执行函数 ==========

/**
 * 执行完整图片生成任务（提示词 + 图片）
 */
export async function executeImageTask(taskId: string): Promise<void> {
  // 创建 AI 生成日志记录器
  const logger = new AIGenerationLogger({
    taskType: 'image_generation',
    taskId,
  });

  try {
    const task = await prisma.imageGenTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    if (task.status !== "pending" && task.status !== "failed") {
      console.log(`任务 ${taskId} 状态为 ${task.status}，跳过执行`);
      return;
    }

    const steps = task.steps as StepInput[];
    const dishStyle = task.dishStyle as DishStyle;

    // 1. 更新状态为生成提示词中
    await updateTaskStatus(taskId, "generating_prompts", { startedAt: new Date() });

    // 2. 生成步骤图提示词（传入 logger 记录 AI 调用）
    // AI 会同时返回 step 0 (cover) 和步骤图提示词
    let stepPrompts: StepPrompt[] = [];
    let coverPrompt: StepPrompt | undefined;
    let sceneContext: HealingSceneContext | undefined;
    if (steps.length > 0) {
      const promptResult = await generatePromptsForSteps(steps, dishStyle, task.recipeName, logger);

      // 分离 cover (step 0) 和步骤图
      coverPrompt = promptResult.prompts.find(p => p.stepNumber === 0);
      stepPrompts = promptResult.prompts.filter(p => p.stepNumber !== 0);
      sceneContext = promptResult.sceneContext;

      // 将 sceneContext 保存到 prompts JSON 中（作为额外字段）
      const promptsWithContext = {
        sceneContext,
        usedFallback: promptResult.usedFallback,
        steps: stepPrompts,
        cover: coverPrompt, // 保存 cover 提示词
      };

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          prompts: promptsWithContext as unknown as Record<string, unknown>,
          promptsDone: stepPrompts.length,
        },
      });
    }

    // 3. 构建成品图提示词（从 AI 返回的 step 0 提取）
    let shotPrompts: ImageShotPrompt[] = [];
    if (coverPrompt) {
      shotPrompts = [{
        key: "cover",
        ratio: "16:9",
        imagePrompt: coverPrompt.prompt,
        negativePrompt: getDefaultNegativePrompt(),
      }];
      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          shotPrompts: shotPrompts as unknown as Record<string, unknown>[],
        },
      });
    }

    // 4. 更新状态为生成图片中
    await updateTaskStatus(taskId, "generating_images");

    // 5. 并发生成步骤图
    const stepImages: ImageResult[] = [];
    for (const prompt of stepPrompts) {
      const result = await generateImageForStepPrompt(prompt, logger);
      stepImages.push(result);

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          images: stepImages as unknown as Record<string, unknown>[],
          imagesDone: stepImages.filter(i => i.imageUrl && !i.error).length,
        },
      });
    }

    // 6. 并发生成成品图
    const shotImages: ImageShotResult[] = [];
    for (const shot of shotPrompts) {
      const result = await generateImageForShot(shot, logger);
      shotImages.push(result);

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          shotImages: shotImages as unknown as Record<string, unknown>[],
          shotsDone: shotImages.filter(i => i.imageUrl && !i.error).length,
        },
      });
    }

    // 7. 选择封面图
    const coverImageUrl = selectCoverImage(shotImages);

    // 8. 更新任务状态为完成
    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        coverImageUrl,
        status: "completed",
        completedAt: new Date(),
      },
    });

    // 9. 自动将生成的图片应用到关联的食谱
    const applyResult = await applyImagesToRecipe(taskId);
    if (applyResult.success) {
      console.log(`[ImageTask] 图片已自动应用到食谱 (${taskId})`);
    } else {
      console.warn(`[ImageTask] 图片应用失败 (${taskId}): ${applyResult.error}`);
    }

    // 10. 强制刷新日志队列，确保日志写入数据库
    await flushLogs();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error(`任务 ${taskId} 执行失败:`, error);

    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        errorMessage,
      },
    });
  }
}

/**
 * 仅生成提示词（不生成图片）
 */
export async function executePromptsOnly(taskId: string): Promise<void> {
  try {
    const task = await prisma.imageGenTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    const steps = task.steps as StepInput[];
    const dishStyle = task.dishStyle as DishStyle;

    await updateTaskStatus(taskId, "generating_prompts", { startedAt: new Date() });

    // 生成步骤图提示词（AI 会同时返回 step 0 cover）
    let stepPrompts: StepPrompt[] = [];
    let coverPrompt: StepPrompt | undefined;
    if (steps.length > 0) {
      const promptResult = await generatePromptsForSteps(steps, dishStyle, task.recipeName);
      coverPrompt = promptResult.prompts.find(p => p.stepNumber === 0);
      stepPrompts = promptResult.prompts.filter(p => p.stepNumber !== 0);
    }

    // 构建成品图提示词（从 step 0 提取）
    let shotPrompts: ImageShotPrompt[] = [];
    if (coverPrompt) {
      shotPrompts = [{
        key: "cover",
        ratio: "16:9",
        imagePrompt: coverPrompt.prompt,
        negativePrompt: getDefaultNegativePrompt(),
      }];
    }

    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        prompts: stepPrompts as unknown as Record<string, unknown>[],
        promptsDone: stepPrompts.length,
        shotPrompts: shotPrompts as unknown as Record<string, unknown>[],
        status: "pending", // 回到 pending，等待用户确认后生成图片
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        errorMessage,
      },
    });
  }
}

/**
 * 仅生成图片（使用已有提示词）
 */
export async function executeImagesOnly(taskId: string): Promise<void> {
  try {
    const task = await prisma.imageGenTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    const stepPrompts = (task.prompts as StepPrompt[] | null) || [];
    const shotPrompts = (task.shotPrompts as ImageShotPrompt[] | null) || [];

    if (stepPrompts.length === 0 && shotPrompts.length === 0) {
      throw new Error("没有可用的提示词，请先生成提示词");
    }

    await updateTaskStatus(taskId, "generating_images");

    // 生成步骤图
    const stepImages: ImageResult[] = [];
    for (const prompt of stepPrompts) {
      const result = await generateImageForStepPrompt(prompt);
      stepImages.push(result);

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          images: stepImages as unknown as Record<string, unknown>[],
          imagesDone: stepImages.filter(i => i.imageUrl && !i.error).length,
        },
      });
    }

    // 生成成品图
    const shotImages: ImageShotResult[] = [];
    for (const shot of shotPrompts) {
      const result = await generateImageForShot(shot);
      shotImages.push(result);

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          shotImages: shotImages as unknown as Record<string, unknown>[],
          shotsDone: shotImages.filter(i => i.imageUrl && !i.error).length,
        },
      });
    }

    // 选择封面图
    const coverImageUrl = selectCoverImage(shotImages);

    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        coverImageUrl,
        status: "completed",
        completedAt: new Date(),
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        errorMessage,
      },
    });
  }
}

/**
 * 重试失败的图片（步骤图 + 成品图）
 */
export async function retryFailedImages(taskId: string): Promise<void> {
  try {
    const task = await prisma.imageGenTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    const stepPrompts = (task.prompts as StepPrompt[] | null) || [];
    const shotPrompts = (task.shotPrompts as ImageShotPrompt[] | null) || [];
    const existingStepImages = (task.images as ImageResult[] | null) || [];
    const existingShotImages = (task.shotImages as ImageShotResult[] | null) || [];

    // 找出失败的步骤图
    const failedSteps = stepPrompts.filter((p) => {
      const img = existingStepImages.find((i) => i.stepNumber === p.stepNumber);
      return !img || img.error || !img.imageUrl;
    });

    // 找出失败的成品图
    const failedShots = shotPrompts.filter((p) => {
      const img = existingShotImages.find((i) => i.key === p.key);
      return !img || img.error || !img.imageUrl;
    });

    if (failedSteps.length === 0 && failedShots.length === 0) {
      console.log("没有需要重试的图片");
      return;
    }

    await updateTaskStatus(taskId, "generating_images");

    // 重试步骤图
    const stepImages = [...existingStepImages];
    for (const prompt of failedSteps) {
      const result = await generateImageForStepPrompt(prompt);
      const existingIndex = stepImages.findIndex((i) => i.stepNumber === prompt.stepNumber);
      if (existingIndex >= 0) {
        stepImages[existingIndex] = result;
      } else {
        stepImages.push(result);
      }

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          images: stepImages as unknown as Record<string, unknown>[],
          imagesDone: stepImages.filter((i) => i.imageUrl && !i.error).length,
        },
      });
    }

    // 重试成品图
    const shotImages = [...existingShotImages];
    for (const shot of failedShots) {
      const result = await generateImageForShot(shot);
      const existingIndex = shotImages.findIndex((i) => i.key === shot.key);
      if (existingIndex >= 0) {
        shotImages[existingIndex] = result;
      } else {
        shotImages.push(result);
      }

      await prisma.imageGenTask.update({
        where: { id: taskId },
        data: {
          shotImages: shotImages as unknown as Record<string, unknown>[],
          shotsDone: shotImages.filter((i) => i.imageUrl && !i.error).length,
        },
      });
    }

    // 重新选择封面图
    const coverImageUrl = selectCoverImage(shotImages);

    // 检查是否全部完成
    const allStepsSuccess = stepImages.every((i) => i.imageUrl && !i.error);
    const allShotsSuccess = shotImages.every((i) => i.imageUrl && !i.error);
    const allSuccess = allStepsSuccess && allShotsSuccess;

    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        coverImageUrl,
        status: allSuccess ? "completed" : "failed",
        completedAt: allSuccess ? new Date() : undefined,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    await prisma.imageGenTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        errorMessage,
      },
    });
  }
}

/**
 * 将生成的图片应用到关联的食谱
 */
export async function applyImagesToRecipe(taskId: string): Promise<{ success: boolean; error?: string }> {
  const task = await prisma.imageGenTask.findUnique({
    where: { id: taskId },
    include: { recipe: true },
  });

  if (!task) {
    return { success: false, error: "任务不存在" };
  }

  if (!task.recipeId || !task.recipe) {
    return { success: false, error: "任务未关联食谱" };
  }

  const stepImages = (task.images as ImageResult[] | null) || [];
  const shotImages = (task.shotImages as ImageShotResult[] | null) || [];
  const coverImageUrl = task.coverImageUrl;

  if (stepImages.length === 0 && shotImages.length === 0) {
    return { success: false, error: "没有生成的图片" };
  }

  // 更新步骤图片
  // 注意：Recipe.steps 使用 id (如 "step01")，而 images 使用 stepNumber (如 1)
  // 需要通过索引或从 id 提取数字来匹配
  const recipeSteps = task.recipe.steps as Array<{ id?: string; number?: number; image?: string; imageUrl?: string; [key: string]: unknown }>;
  const updatedSteps = recipeSteps.map((step, index) => {
    // 优先使用 step.number，否则使用索引+1，或从 id 提取数字
    let stepNumber = step.number;
    if (stepNumber === undefined) {
      // 尝试从 id 提取数字，如 "step01" -> 1
      if (step.id) {
        const match = step.id.match(/\d+/);
        if (match) {
          stepNumber = parseInt(match[0], 10);
        }
      }
      // 如果还是没有，使用索引+1
      if (stepNumber === undefined) {
        stepNumber = index + 1;
      }
    }

    const img = stepImages.find((i) => i.stepNumber === stepNumber);
    if (img?.imageUrl) {
      return { ...step, image: img.imageUrl, imageUrl: img.imageUrl };
    }
    return step;
  });

  await prisma.recipe.update({
    where: { id: task.recipeId },
    data: {
      steps: updatedSteps,
      coverImage: coverImageUrl || task.recipe.coverImage,
    },
  });

  return { success: true };
}

// ========== 内部辅助函数 ==========

/**
 * 生成步骤图提示词
 * 优先使用治愈美学批量生成器，失败时回退到旧逻辑
 */
async function generatePromptsForSteps(
  steps: StepInput[],
  dishStyle: DishStyle,
  recipeName?: string,
  logger?: AIGenerationLogger
): Promise<{ prompts: StepPrompt[]; sceneContext?: HealingSceneContext; usedFallback: boolean }> {
  // 转换为治愈美学输入格式
  const healingSteps = steps.map((step) => ({
    number: step.number,
    description: step.description || step.action || step.speechText || '',
    title: step.title,
  }));

  // 使用带回退的批量生成（传入 logger 记录 AI 调用）
  const result = await promptGenerator.generateAllStepPromptsWithFallback(
    recipeName || '菜谱',
    healingSteps,
    dishStyle,
    logger
  );

  if (result.usedFallback) {
    console.log('[ImageTask] 使用回退逻辑生成步骤图提示词');
  } else {
    console.log('[ImageTask] 使用治愈美学批量生成器成功');
  }

  return {
    prompts: result.prompts,
    sceneContext: result.sceneContext,
    usedFallback: result.usedFallback,
  };
}

/**
 * 获取默认负面提示词
 */
function getDefaultNegativePrompt(): string {
  return "AI generated, plastic, unnatural, cartoon, 3D render, text, watermark, blurry, oversaturated, artificial";
}

/**
 * 生成步骤图图片
 */
async function generateImageForStepPrompt(prompt: StepPrompt, logger?: AIGenerationLogger): Promise<ImageResult> {
  try {
    const result = await evolinkClient.generateImage({
      prompt: prompt.prompt,
      width: 1024,
      height: 768, // 4:3 比例
      timeoutMs: 30000,
      retries: 2,
      logger,
      stepName: "step_image_gen",
    });

    if (result.success && result.imageUrl) {
      return {
        stepNumber: prompt.stepNumber,
        imageUrl: result.imageUrl,
      };
    } else {
      return {
        stepNumber: prompt.stepNumber,
        error: result.error || "图片生成失败",
      };
    }
  } catch (error) {
    return {
      stepNumber: prompt.stepNumber,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 生成成品图图片
 */
async function generateImageForShot(shot: ImageShotPrompt, logger?: AIGenerationLogger): Promise<ImageShotResult> {
  try {
    // 根据 ratio 确定尺寸
    const { width, height } = getSizeForRatio(shot.ratio);

    const result = await evolinkClient.generateImage({
      prompt: shot.imagePrompt,
      negativePrompt: shot.negativePrompt || getDefaultNegativePrompt(),
      width,
      height,
      timeoutMs: 30000,
      retries: 2,
      logger,
      stepName: "cover_image_gen",
    });

    if (result.success && result.imageUrl) {
      return {
        key: shot.key,
        ratio: shot.ratio,
        imagePrompt: shot.imagePrompt,
        imageUrl: result.imageUrl,
      };
    } else {
      return {
        key: shot.key,
        ratio: shot.ratio,
        imagePrompt: shot.imagePrompt,
        error: result.error || "图片生成失败",
      };
    }
  } catch (error) {
    return {
      key: shot.key,
      ratio: shot.ratio,
      imagePrompt: shot.imagePrompt,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 根据比例获取尺寸
 */
function getSizeForRatio(ratio: string): { width: number; height: number } {
  switch (ratio) {
    case "16:9":
      return { width: 1024, height: 576 };
    case "4:3":
      return { width: 1024, height: 768 };
    case "3:2":
      return { width: 1024, height: 683 };
    case "1:1":
      return { width: 1024, height: 1024 };
    default:
      return { width: 1024, height: 576 }; // 默认 16:9
  }
}

/**
 * 选择封面图
 * 现在只有一个 cover，直接返回
 */
function selectCoverImage(shots: ImageShotResult[]): string | undefined {
  // 优先找 cover
  const cover = shots.find((s) => s.key === "cover" && s.imageUrl && !s.error);
  if (cover) {
    return cover.imageUrl;
  }

  // 返回第一张成功的图片
  const firstSuccess = shots.find((s) => s.imageUrl && !s.error);
  return firstSuccess?.imageUrl;
}

/**
 * 更新任务状态
 */
async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  extra?: { startedAt?: Date; completedAt?: Date }
): Promise<void> {
  await prisma.imageGenTask.update({
    where: { id: taskId },
    data: {
      status,
      ...extra,
    },
  });
}
