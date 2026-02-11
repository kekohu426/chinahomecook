/**
 * 重新生成单张图片 API
 * POST - 根据提示词重新生成指定的步骤图或成品图
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { evolinkClient } from "@/lib/ai/evolink";
import { AIGenerationLogger } from "@/lib/ai/generation-logger";
import { applyImagesToRecipe } from "@/lib/ai/image-task-executor";
import { requireAdmin } from "@/lib/auth/guard";

interface StepPrompt {
  stepNumber: number;
  stepType: string;
  coreAction: string;
  prompt: string;
  variables?: Record<string, string>;
}

interface ImageResult {
  stepNumber: number;
  imageUrl?: string;
  error?: string;
}

interface ImageShotPrompt {
  key: string;
  ratio: string;
  imagePrompt: string;
  negativePrompt?: string;
}

interface ImageShotResult {
  key: string;
  ratio: string;
  imagePrompt?: string;
  imageUrl?: string;
  error?: string;
}

// POST /api/admin/ai/image-tasks/[id]/regenerate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { type, stepNumber, shotKey, prompt } = body;
    const logger = new AIGenerationLogger();

    const task = await prisma.imageGenTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    if (type === "step") {
      // 重新生成步骤图
      // prompts 可能是数组或 { steps: [...] } 格式的对象
      const rawPrompts = task.prompts as StepPrompt[] | { steps: StepPrompt[] } | null;
      const stepPrompts: StepPrompt[] = Array.isArray(rawPrompts)
        ? rawPrompts
        : (rawPrompts?.steps || []);
      const stepImages = (task.images as ImageResult[] | null) || [];

      const targetPrompt = stepPrompts.find(p => p.stepNumber === stepNumber);
      if (!targetPrompt) {
        return NextResponse.json({ error: "未找到对应的步骤提示词" }, { status: 404 });
      }

      // 使用传入的prompt或原始prompt
      const finalPrompt = prompt || targetPrompt.prompt;

      // 生成图片
      const result = await evolinkClient.generateImage({
        prompt: finalPrompt,
        width: 1024,
        height: 768,
        timeoutMs: 60000,
        retries: 2,
        logger,
        stepName: "step_image_regenerate",
      });

      // 更新结果
      const newImageResult: ImageResult = result.success && result.imageUrl
        ? { stepNumber, imageUrl: result.imageUrl }
        : { stepNumber, error: result.error || "图片生成失败" };

      const existingIndex = stepImages.findIndex(i => i.stepNumber === stepNumber);
      if (existingIndex >= 0) {
        stepImages[existingIndex] = newImageResult;
      } else {
        stepImages.push(newImageResult);
      }

      // 如果传入了新的prompt，也更新prompts
      if (prompt && prompt !== targetPrompt.prompt) {
        const promptIndex = stepPrompts.findIndex(p => p.stepNumber === stepNumber);
        if (promptIndex >= 0) {
          stepPrompts[promptIndex] = { ...stepPrompts[promptIndex], prompt };
        }
      }

      await prisma.imageGenTask.update({
        where: { id },
        data: {
          prompts: stepPrompts as unknown as Record<string, unknown>[],
          images: stepImages as unknown as Record<string, unknown>[],
          imagesDone: stepImages.filter(i => i.imageUrl && !i.error).length,
        },
      });

      // 同步图片到食谱
      if (result.success) {
        await applyImagesToRecipe(id);
      }

      return NextResponse.json({
        success: result.success,
        imageUrl: result.imageUrl,
        error: result.error,
      });

    } else if (type === "shot") {
      // 重新生成成品图
      const shotPrompts = (task.shotPrompts as ImageShotPrompt[] | null) || [];
      const shotImages = (task.shotImages as ImageShotResult[] | null) || [];

      const targetPrompt = shotPrompts.find(p => p.key === shotKey);
      if (!targetPrompt) {
        return NextResponse.json({ error: "未找到对应的成品图提示词" }, { status: 404 });
      }

      // 使用传入的prompt或原始prompt
      const finalPrompt = prompt || targetPrompt.imagePrompt;

      // 根据 ratio 确定尺寸
      const { width, height } = getSizeForRatio(targetPrompt.ratio);

      // 生成图片
      const result = await evolinkClient.generateImage({
        prompt: finalPrompt,
        negativePrompt: targetPrompt.negativePrompt,
        width,
        height,
        timeoutMs: 60000,
        retries: 2,
        logger,
        stepName: "cover_image_regenerate",
      });

      // 更新结果
      const newShotResult: ImageShotResult = result.success && result.imageUrl
        ? { key: shotKey, ratio: targetPrompt.ratio, imagePrompt: finalPrompt, imageUrl: result.imageUrl }
        : { key: shotKey, ratio: targetPrompt.ratio, imagePrompt: finalPrompt, error: result.error || "图片生成失败" };

      const existingIndex = shotImages.findIndex(i => i.key === shotKey);
      if (existingIndex >= 0) {
        shotImages[existingIndex] = newShotResult;
      } else {
        shotImages.push(newShotResult);
      }

      // 如果传入了新的prompt，也更新shotPrompts
      if (prompt && prompt !== targetPrompt.imagePrompt) {
        const promptIndex = shotPrompts.findIndex(p => p.key === shotKey);
        if (promptIndex >= 0) {
          shotPrompts[promptIndex] = { ...shotPrompts[promptIndex], imagePrompt: prompt };
        }
      }

      // 重新选择封面图
      const coverImageUrl = selectCoverImage(shotImages);

      await prisma.imageGenTask.update({
        where: { id },
        data: {
          shotPrompts: shotPrompts as unknown as Record<string, unknown>[],
          shotImages: shotImages as unknown as Record<string, unknown>[],
          shotsDone: shotImages.filter(i => i.imageUrl && !i.error).length,
          coverImageUrl,
          status: "completed",
        },
      });

      // 同步图片到食谱
      if (result.success) {
        await applyImagesToRecipe(id);

        // 同步更新关联的 CustomRecipeTask 状态
        const updatedTask = await prisma.imageGenTask.findUnique({
          where: { id },
          select: { recipeId: true },
        });

        if (updatedTask?.recipeId) {
          // 查找关联的 CustomRecipeTask 并更新状态
          await prisma.customRecipeTask.updateMany({
            where: {
              recipeId: updatedTask.recipeId,
              status: "failed",
            },
            data: {
              status: "completed",
              errorMessage: null,
              completedAt: new Date(),
            },
          });
        }
      }

      return NextResponse.json({
        success: result.success,
        imageUrl: result.imageUrl,
        error: result.error,
      });
    }

    return NextResponse.json({ error: "无效的类型" }, { status: 400 });

  } catch (error) {
    console.error("重新生成图片失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "重新生成图片失败" },
      { status: 500 }
    );
  }
}

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
      return { width: 1024, height: 576 };
  }
}

function selectCoverImage(shots: ImageShotResult[]): string | undefined {
  // 优先找 cover
  const cover = shots.find((s) => s.key === "cover" && s.imageUrl && !s.error);
  if (cover) {
    return cover.imageUrl;
  }

  const firstSuccess = shots.find((s) => s.imageUrl && !s.error);
  return firstSuccess?.imageUrl;
}
