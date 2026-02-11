/**
 * 定制食谱任务执行器
 * 协调食谱生成 + 图片生成的完整流程
 */

import { prisma } from "@/lib/db/prisma";
import { generateRecipe } from "@/lib/ai/generate-recipe";
import { executeImageTask } from "@/lib/ai/image-task-executor";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";
import { attachRecipeTags } from "@/lib/ai/tag-relations";
import { translateRecipe } from "@/lib/ai/translate";
import { AIGenerationLogger } from "@/lib/ai/generation-logger";
import { assignTeamMembers } from "@/lib/team/assign-members";
import { buildCustomRecipeSlug } from "@/lib/recipe/slug";
import type { TaskStatus } from "./phase-messages";

// 步骤输入类型
interface StepInput {
  number: number;
  description?: string;
  title?: string;
  action?: string;
}

/**
 * 更新任务阶段
 */
async function updateTaskPhase(
  taskId: string,
  phase: number,
  status: TaskStatus,
  extra?: Partial<{
    recipeId: string;
    imageTaskId: string;
    totalImages: number;
    imagesDone: number;
    phaseProgress: number;
    errorMessage: string;
    startedAt: Date;
    completedAt: Date;
  }>
): Promise<void> {
  await prisma.customRecipeTask.update({
    where: { id: taskId },
    data: {
      currentPhase: phase,
      status,
      ...extra,
    },
  });
}

/**
 * 同步图片任务进度到定制任务
 */
async function syncImageProgress(
  customTaskId: string,
  imageTaskId: string
): Promise<void> {
  const imageTask = await prisma.imageGenTask.findUnique({
    where: { id: imageTaskId },
  });

  if (imageTask) {
    const totalImages = imageTask.totalSteps + imageTask.totalShots;
    const imagesDone = imageTask.imagesDone + imageTask.shotsDone;

    await prisma.customRecipeTask.update({
      where: { id: customTaskId },
      data: {
        totalImages,
        imagesDone,
        phaseProgress: totalImages > 0 ? Math.round((imagesDone / totalImages) * 100) : 0,
      },
    });
  }
}

/**
 * 执行定制食谱任务
 * 完整流程：食谱生成 → 图片生成 → 审核 → 完成
 */
export async function executeCustomRecipeTask(taskId: string): Promise<void> {
  const logger = new AIGenerationLogger();

  try {
    // 获取任务
    const task = await prisma.customRecipeTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    // ========== 阶段1: 生成食谱 ==========
    await updateTaskPhase(taskId, 1, "recipe_generating", {
      startedAt: new Date(),
    });

    const result = await generateRecipe({
      dishName: task.recipeName,
      logger,
    });

    if (!result.success) {
      throw new Error(result.error || "食谱生成失败");
    }

    // 生成 slug
    const generatedTitleEn =
      "titleEn" in result.data && typeof result.data.titleEn === "string"
        ? result.data.titleEn
        : null;
    const slug = buildCustomRecipeSlug({
      titleZh: result.data.titleZh,
      titleEn: generatedTitleEn,
      token: Date.now(),
    });

    // 保存食材图标记录
    await ensureIngredientIconRecords(result.data.ingredients);

    // 提取 AI 标签
    const aiTags = result.data.tags || {};
    const { tags: _aiTags, ...recipeDataWithoutTags } = result.data;

    // 自动分配团队成员
    const teamAssignment = await assignTeamMembers();

    // 保存食谱到数据库
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeDataWithoutTags.titleZh,
        summary: recipeDataWithoutTags.summary as object,
        story: (recipeDataWithoutTags.story ?? recipeDataWithoutTags.culturalStory ?? null) as object,
        ingredients: recipeDataWithoutTags.ingredients as object,
        steps: recipeDataWithoutTags.steps as object,
        nutrition: (recipeDataWithoutTags.nutrition ?? null) as object,
        faq: (recipeDataWithoutTags.faq ?? null) as object,
        tips: (recipeDataWithoutTags.tips ?? null) as object,
        troubleshooting: (recipeDataWithoutTags.troubleshooting ?? null) as object,
        relatedRecipes: (recipeDataWithoutTags.relatedRecipes ?? null) as object,
        pairing: (recipeDataWithoutTags.pairing ?? null) as object,
        seo: (recipeDataWithoutTags.seo ?? null) as object,
        notes: (recipeDataWithoutTags.notes ?? null) as object,
        slug,
        aiGenerated: true,
        status: "draft", // 先设为草稿，图片完成后再发布
        explorerId: teamAssignment.explorerId,
        reviewerId: teamAssignment.reviewerId,
      },
    });

    // 关联标签
    try {
      await attachRecipeTags({
        recipeId: recipe.id,
        tags: aiTags,
      });
    } catch (tagError) {
      console.error("Tag attachment failed:", tagError);
    }

    // ========== 阶段2: 食谱完成 ==========
    await updateTaskPhase(taskId, 2, "recipe_done", {
      recipeId: recipe.id,
    });

    // ========== 阶段3: 生成图片提示词 ==========
    await updateTaskPhase(taskId, 3, "prompts_generating");

    // 创建图片生成任务
    const steps = recipeDataWithoutTags.steps as StepInput[];
    const imageTask = await prisma.imageGenTask.create({
      data: {
        recipeId: recipe.id,
        recipeName: task.recipeName,
        dishStyle: "dark_and_moody",
        steps: steps.map((step, index) => ({
          number: index + 1,
          description: step.description || step.action || "",
          title: step.title || "",
        })),
        totalSteps: steps.length,
        totalShots: 1, // 封面图
      },
    });

    await updateTaskPhase(taskId, 3, "prompts_generating", {
      imageTaskId: imageTask.id,
      totalImages: steps.length + 1,
    });

    // ========== 阶段4: 生成图片 ==========
    await updateTaskPhase(taskId, 4, "images_generating");

    // 启动图片生成，并定期同步进度
    const imageTaskPromise = executeImageTask(imageTask.id);

    // 定期同步进度
    const progressInterval = setInterval(async () => {
      try {
        await syncImageProgress(taskId, imageTask.id);
      } catch (e) {
        console.error("Progress sync error:", e);
      }
    }, 2000);

    // 等待图片生成完成
    await imageTaskPromise;
    clearInterval(progressInterval);

    // 最终同步一次进度
    await syncImageProgress(taskId, imageTask.id);

    // 检查图片任务结果
    const completedImageTask = await prisma.imageGenTask.findUnique({
      where: { id: imageTask.id },
    });

    if (!completedImageTask) {
      throw new Error("图片任务不存在");
    }

    if (completedImageTask.status === "failed") {
      throw new Error(completedImageTask.errorMessage || "图片生成失败");
    }

    // 严格检查：确保所有图片都生成完成
    if (completedImageTask.status !== "completed") {
      throw new Error(`图片任务状态异常: ${completedImageTask.status}`);
    }

    // 检查步骤图是否全部完成
    if (completedImageTask.imagesDone < completedImageTask.totalSteps) {
      throw new Error(
        `步骤图未完全生成: ${completedImageTask.imagesDone}/${completedImageTask.totalSteps}`
      );
    }

    // 检查成品图是否全部完成
    if (completedImageTask.shotsDone < completedImageTask.totalShots) {
      throw new Error(
        `成品图未完全生成: ${completedImageTask.shotsDone}/${completedImageTask.totalShots}`
      );
    }

    // 检查封面图是否存在
    if (!completedImageTask.coverImageUrl) {
      throw new Error("封面图未生成");
    }

    // 验证食谱数据完整性
    const verifiedRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
    });

    if (!verifiedRecipe) {
      throw new Error("食谱数据丢失");
    }

    if (!verifiedRecipe.coverImage) {
      throw new Error("食谱封面图未保存");
    }

    if (!verifiedRecipe.steps || (verifiedRecipe.steps as unknown[]).length === 0) {
      throw new Error("食谱步骤数据缺失");
    }

    // ========== 阶段5: 审核 ==========
    await updateTaskPhase(taskId, 5, "reviewing");

    // 模拟审核延迟（让用户感觉有审核过程）
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 发布食谱
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
    });

    try {
      const translationResult = await translateRecipe(recipe.id, "en", {
        autoReview: true,
        logger,
      });

      if (!translationResult.success) {
        console.warn(
          `[CustomRecipeTask] EN translation failed for recipe ${recipe.id}: ${translationResult.error}`
        );
      }
    } catch (translationError) {
      console.warn(
        `[CustomRecipeTask] EN translation exception for recipe ${recipe.id}:`,
        translationError
      );
    }

    // ========== 阶段6: 完成 ==========
    await updateTaskPhase(taskId, 6, "completed", {
      completedAt: new Date(),
      phaseProgress: 100,
    });

    console.log(`[CustomRecipeTask] 任务 ${taskId} 完成，食谱ID: ${recipe.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error(`[CustomRecipeTask] 任务 ${taskId} 失败:`, error);

    await prisma.customRecipeTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        errorMessage,
      },
    });
  }
}

/**
 * 重试失败的任务
 */
export async function retryCustomRecipeTask(taskId: string): Promise<void> {
  const task = await prisma.customRecipeTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error(`任务 ${taskId} 不存在`);
  }

  if (task.status !== "failed") {
    throw new Error(`任务状态为 ${task.status}，无法重试`);
  }

  // 重置任务状态
  await prisma.customRecipeTask.update({
    where: { id: taskId },
    data: {
      status: "pending",
      currentPhase: 0,
      phaseProgress: 0,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    },
  });

  // 重新执行
  await executeCustomRecipeTask(taskId);
}
