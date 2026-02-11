/**
 * AI批量生成菜谱 API
 *
 * POST /api/ai/generate-recipes-batch - 批量生成菜谱并保存到数据库
 *
 * 注意：图片生成已迁移到 ImageGenTask 系统
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { generateRecipesBatch } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";
import { attachRecipeTags, resolveCuisineSlug } from "@/lib/ai/tag-relations";
import { getCuisineGuide } from "@/lib/ai/cuisine-guides";
import { executeImageTask } from "@/lib/ai/image-task-executor";
import { assignTeamMembers } from "@/lib/team/assign-members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 创建图片生成任务
 */
async function createImageGenTask(
  recipeId: string,
  recipeData: any,
  dishName: string
): Promise<string | null> {
  try {
    // 准备步骤数据
    const stepsForTask = (recipeData.steps || []).map((s: any, idx: number) => ({
      number: s.number || idx + 1,
      description: s.description || s.instruction || '',
      title: s.title,
      action: s.action,
    }));

    // 准备成品图数据（提示词由执行器自动生成）
    const imageShotsForTask = [
      { key: "cover_main", ratio: "16:9" },
      { key: "cover_detail", ratio: "16:9" },
      { key: "cover_inside", ratio: "16:9" },
    ];

    // 根据菜品风格判断 dishStyle
    const tags = recipeData.tags || {};
    const tagString = JSON.stringify(tags).toLowerCase();
    let dishStyle = 'dark_and_moody';
    if (/烘焙|蛋糕|面包|饼干|甜点|西点|baking/.test(tagString)) {
      dishStyle = 'baking';
    } else if (/清淡|沙拉|蔬菜|清蒸|light/.test(tagString)) {
      dishStyle = 'light_and_fresh';
    }

    const task = await prisma.imageGenTask.create({
      data: {
        recipeId,
        recipeName: recipeData.titleZh || dishName,
        dishStyle,
        steps: stepsForTask,
        totalSteps: stepsForTask.length,
        imageShots: imageShotsForTask,
        totalShots: imageShotsForTask.length,
        status: 'pending',
      },
    });

    // 自动异步执行图片生成任务
    executeImageTask(task.id).catch((e) => {
      console.error(`[Batch] 图片生成任务执行失败 (${task.id}):`, e);
    });

    return task.id;
  } catch (taskError) {
    console.error(`[Batch] 创建 ImageGenTask 失败:`, taskError);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { dishNames, servings, timeBudget, equipment, dietary, cuisine, autoSave } = body;

    if (!dishNames || !Array.isArray(dishNames) || dishNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "dishNames 必须是非空数组" },
        { status: 400 }
      );
    }


    const cuisineSlug = await resolveCuisineSlug(cuisine);
    const textProvider = process.env.AI_TEXT_PROVIDER || "glm";
    const textModel =
      textProvider === "glm"
        ? (process.env.GLM_MODEL || "glm-4-flash")
        : textProvider === "deepseek"
          ? (process.env.DEEPSEEK_MODEL || "deepseek-chat")
          : (process.env.OPENAI_MODEL || "gpt-4o-mini");
    const cuisineGuide = cuisine ? getCuisineGuide(cuisine) : "";
    // 批量生成
    const batchResult = await generateRecipesBatch(dishNames, {
      servings,
      timeBudget,
      equipment,
      dietary,
      cuisine,
    });

    // 如果autoSave为true，保存所有成功生成的菜谱
    if (autoSave !== false) {
      const savedRecipes: Array<{ recipe: Prisma.RecipeGetPayload<{ select: { id: true; title: true } }>; warning?: string; imageTaskId?: string }> = [];
      const savedWarnings: Array<{ dishName: string; warning: string }> = [];

      for (const result of batchResult.results) {
        if (result.data) {
          try {
            // 生成slug
            const slug = `${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

            await ensureIngredientIconRecords(result.data.ingredients);

            const aiTags = result.data.tags || {};
            // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
            const { tags: _aiTags, ...recipeDataWithoutTags } = result.data;

            // 自动分配团队成员
            const teamAssignment = await assignTeamMembers();

            const recipe = await prisma.recipe.create({
              data: {
                title: recipeDataWithoutTags.titleZh,
                summary: recipeDataWithoutTags.summary as unknown as Prisma.InputJsonValue,
                story: (recipeDataWithoutTags.story ?? recipeDataWithoutTags.culturalStory ?? null) as unknown as Prisma.InputJsonValue,
                ingredients: recipeDataWithoutTags.ingredients as unknown as Prisma.InputJsonValue,
                steps: recipeDataWithoutTags.steps as unknown as Prisma.InputJsonValue,
                nutrition: (recipeDataWithoutTags.nutrition ?? null) as unknown as Prisma.InputJsonValue,
                faq: (recipeDataWithoutTags.faq ?? null) as unknown as Prisma.InputJsonValue,
                tips: (recipeDataWithoutTags.tips ?? null) as unknown as Prisma.InputJsonValue,
                troubleshooting: (recipeDataWithoutTags.troubleshooting ?? null) as unknown as Prisma.InputJsonValue,
                relatedRecipes: (recipeDataWithoutTags.relatedRecipes ?? null) as unknown as Prisma.InputJsonValue,
                pairing: (recipeDataWithoutTags.pairing ?? null) as unknown as Prisma.InputJsonValue,
                seo: (recipeDataWithoutTags.seo ?? null) as unknown as Prisma.InputJsonValue,
                notes: (recipeDataWithoutTags.notes ?? null) as unknown as Prisma.InputJsonValue,
                slug,
                aiGenerated: true,
                status: "draft",
                reviewStatus: "pending",
                explorerId: teamAssignment.explorerId,
                reviewerId: teamAssignment.reviewerId,
                transStatus: result.success
                  ? undefined
                  : ({
                      generateError: result.error,
                      validationIssues: result.issues,
                    } as Prisma.InputJsonValue),
              },
            });

            try {
              const tagResult = await attachRecipeTags({
                recipeId: recipe.id,
                tags: aiTags,
                cuisineSlug,
              });
              if (tagResult.unknown.length > 0) {
                console.log(
                  "Unknown AI tags:",
                  tagResult.unknown.map((t) => `${t.type}:${t.slug}`)
                );
              }
            } catch (tagError) {
              console.error("Tag attachment failed:", tagError);
            }

            // 创建图片生成任务
            let imageTaskId: string | null = null;
            if (result.success) {
              imageTaskId = await createImageGenTask(recipe.id, result.data, result.dishName);
              if (imageTaskId) {
                console.log(`[Batch] 已创建 ImageGenTask: ${result.data.titleZh}`);
              }
            }

            if (!result.success && result.error) {
              savedWarnings.push({
                dishName: result.dishName,
                warning: result.error,
              });
            }

            savedRecipes.push({
              recipe: {
                id: recipe.id,
                title: recipe.title,
              },
              ...(result.success ? {} : { warning: result.error }),
              ...(imageTaskId ? { imageTaskId } : {}),
            });

            // 避免数据库写入过快，每次写入间隔100ms
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (saveError) {
            console.error(`保存菜谱失败: ${result.dishName}`, saveError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          total: dishNames.length,
          generated: batchResult.success,
          failed: batchResult.failed,
          saved: savedRecipes.length,
          savedRecipes,
          savedWarnings,
          failedDishes: batchResult.results
            .filter((r) => !r.success && !r.data)
            .map((r) => ({
              dishName: r.dishName,
              error: r.error,
            })),
        },
        message: `批量生成完成：成功 ${batchResult.success}/${dishNames.length}，已保存 ${savedRecipes.length} 个菜谱，图片生成任务已创建`,
      });
    }

    // 不自动保存，只返回生成结果
    return NextResponse.json({
      success: true,
      data: {
        total: dishNames.length,
        generated: batchResult.success,
        failed: batchResult.failed,
        results: batchResult.results,
      },
      message: `批量生成完成：成功 ${batchResult.success}/${dishNames.length}`,
    });
  } catch (error) {
    console.error("批量生成菜谱失败:", error);
    return NextResponse.json(
      { success: false, error: "批量生成菜谱失败" },
      { status: 500 }
    );
  }
}
