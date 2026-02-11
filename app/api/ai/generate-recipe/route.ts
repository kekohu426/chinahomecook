/**
 * AI生成单个菜谱 API
 *
 * POST /api/ai/generate-recipe - 生成单个菜谱并保存到数据库
 *
 * 注意：图片生成已迁移到 ImageGenTask 系统
 * generateImages 参数现在表示是否创建图片生成任务
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";
import { attachRecipeTags, resolveCuisineSlug } from "@/lib/ai/tag-relations";
import { getAppliedPrompt } from "@/lib/ai/prompt-manager";
import { getCuisineGuide } from "@/lib/ai/cuisine-guides";
import { assignTeamMembers } from "@/lib/team/assign-members";
import { executeImageTask } from "@/lib/ai/image-task-executor";
import { AIGenerationLogger, flushLogs } from "@/lib/ai/generation-logger";

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

    console.log(`[API] 已创建 ImageGenTask: ${task.id} (${stepsForTask.length} 步骤, ${imageShotsForTask.length} 成品图)`);

    // 自动异步执行图片生成任务
    executeImageTask(task.id).catch((e) => {
      console.error(`[API] 图片生成任务执行失败 (${task.id}):`, e);
    });

    return task.id;
  } catch (taskError) {
    console.error(`[API] 创建 ImageGenTask 失败:`, taskError);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dishName, servings, timeBudget, equipment, dietary, cuisine, autoSave, generateImages = true } = body;

    if (!dishName) {
      return NextResponse.json(
        { success: false, error: "dishName 为必填项" },
        { status: 400 }
      );
    }

    const textProvider = process.env.AI_TEXT_PROVIDER || "glm";
    const textModel =
      textProvider === "glm"
        ? (process.env.GLM_MODEL || "glm-4-flash")
        : textProvider === "deepseek"
          ? (process.env.DEEPSEEK_MODEL || "deepseek-chat")
          : (process.env.OPENAI_MODEL || "gpt-4o-mini");
    const cuisineSlug = await resolveCuisineSlug(cuisine);

    const cuisineGuide = cuisine ? getCuisineGuide(cuisine) : "";
    const appliedPrompt = await getAppliedPrompt("recipe_generate", {
      dishName,
      servings: String(servings ?? 2),
      timeBudget: String(timeBudget ?? 30),
      equipment: equipment || "家用厨房常见设备",
      dietary: dietary || "无特殊限制",
      cuisine: cuisine || "家常菜",
      cuisineGuide,
    });

    const textInputPrompt = appliedPrompt
      ? [
        appliedPrompt.systemPrompt ? `SYSTEM:\n${appliedPrompt.systemPrompt}` : null,
        `USER:\n${appliedPrompt.prompt}`,
      ]
        .filter(Boolean)
        .join("\n\n")
      : undefined;

    const textInputParameters = {
      provider: textProvider,
      model: textModel,
      temperature: 0.7,
      maxTokens: 8000,
      dishName,
      servings,
      timeBudget,
      equipment,
      dietary,
      cuisine,
    };


    // 创建日志记录器
    const logger = new AIGenerationLogger(undefined, {
      metadata: {
        type: "recipe_generation",
        dishName,
        cuisine,
        servings,
        timeBudget,
      }
    });

    // 调用AI生成菜谱文本
    const generateStart = Date.now();
    const result = await generateRecipe({
      dishName,
      servings,
      timeBudget,
      equipment,
      dietary,
      cuisine,
      logger,
    });

    const generateDuration = Date.now() - generateStart;

    if (!result.success) {
      if (result.data && autoSave !== false) {
        const recipeData = result.data;
        const baseSlug = (recipeData.titleZh || dishName || "recipe")
          .toLowerCase()
          .replace(/\s+/g, "-");
        const slug = `${baseSlug}-${Date.now()}`;

        try {
          await ensureIngredientIconRecords(recipeData.ingredients);
        } catch (iconError) {
          console.error("食材图标同步失败，继续保存草稿:", iconError);
        }

        // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
        const aiTags = recipeData.tags || {};
        const { tags: _aiTags, ...recipeDataWithoutTags } = recipeData;

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
            coverImage: undefined,
            aiGenerated: true,
            status: "draft",
            reviewStatus: "pending",
            transStatus: {
              generateError: result.error,
              validationIssues: result.issues,
            },
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

        return NextResponse.json({
          success: true,
          data: recipe,
          warning: result.error,
          message: `菜谱"${recipeData.titleZh || dishName}"已保存为草稿，但生成校验失败`,
        });
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const textOutputSnapshot = JSON.parse(JSON.stringify(result.data));

    // 如果autoSave为true，自动保存到数据库
    if (autoSave !== false) {
      // 生成slug
      const slug = `${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

      try {
        await ensureIngredientIconRecords(result.data.ingredients);
      } catch (iconError) {
        console.error("食材图标同步失败，继续保存草稿:", iconError);
      }

      // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
      const aiTags = result.data.tags || {};
      const { tags: _aiTags, ...recipeDataWithoutTags } = result.data;

      // 先落库草稿，避免后续任何步骤失败导致丢失
      // 自动分配团队成员（探寻者 + 审核者）
      const teamAssignment = await assignTeamMembers();

      // 从 summary 中提取元数据字段
      const summaryData = recipeDataWithoutTags.summary as {
        oneLine?: string;
        difficulty?: string;
        timeTotalMin?: number;
        timeActiveMin?: number;
        servings?: number;
      } | null;

      // ==================== 从 AI 返回的 origin 提取菜系和地区 ====================
      const aiOrigin = recipeDataWithoutTags.origin as {
        cuisine?: string;
        region?: string;
        country?: string;
        notes?: string;
      } | null;

      // 提取主要食材（转换为逗号分隔字符串）
      const aiPrimaryIngredients = recipeDataWithoutTags.primaryIngredients as string[] | null;
      const primaryIngredientsStr = Array.isArray(aiPrimaryIngredients) && aiPrimaryIngredients.length > 0
        ? aiPrimaryIngredients.join(', ')
        : null;

      // 查找菜系 ID：优先使用 AI 返回的 origin.cuisine，否则使用用户输入的 cuisine
      const aiCuisineName = aiOrigin?.cuisine;
      let cuisineRecord: { id: string } | null = null;

      if (aiCuisineName) {
        // 先精确匹配 AI 返回的菜系名称
        cuisineRecord = await prisma.cuisine.findFirst({
          where: {
            OR: [
              { name: aiCuisineName },
              { name: aiCuisineName.replace('菜', '') },
              { name: `${aiCuisineName}菜` },
            ],
          },
          select: { id: true },
        });

        // 如果没有匹配到，自动创建新菜系记录
        if (!cuisineRecord) {
          const newCuisineSlug = aiCuisineName.toLowerCase().replace(/\s+/g, '-').replace('菜', '');
          try {
            const newCuisine = await prisma.cuisine.create({
              data: {
                name: aiCuisineName,
                slug: newCuisineSlug,
                isActive: true,
              },
            });
            cuisineRecord = { id: newCuisine.id };
            console.log(`[API] 自动创建新菜系: ${aiCuisineName} (${newCuisineSlug})`);
          } catch (createError) {
            // 可能是 unique 约束冲突，尝试再次查找
            cuisineRecord = await prisma.cuisine.findFirst({
              where: { slug: newCuisineSlug },
              select: { id: true },
            });
          }
        }
      }

      // 如果 AI 没返回菜系或未匹配到，使用用户传入的 cuisineSlug
      if (!cuisineRecord && cuisineSlug) {
        cuisineRecord = await prisma.cuisine.findUnique({
          where: { slug: cuisineSlug },
          select: { id: true },
        });
      }

      // 查找地区 ID：优先使用 AI 返回的 origin.region
      const aiRegionName = aiOrigin?.region;
      let locationRecord: { id: string } | null = null;

      if (aiRegionName) {
        // 精确匹配 AI 返回的地区名称
        locationRecord = await prisma.location.findFirst({
          where: {
            OR: [
              { name: aiRegionName },
              { name: { contains: aiRegionName } },
            ],
          },
          select: { id: true },
        });

        // 如果没有匹配到，自动创建新地区记录
        if (!locationRecord) {
          const newLocationSlug = aiRegionName.toLowerCase().replace(/\s+/g, '-');
          try {
            const newLocation = await prisma.location.create({
              data: {
                name: aiRegionName,
                slug: newLocationSlug,
                isActive: true,
              },
            });
            locationRecord = { id: newLocation.id };
            console.log(`[API] 自动创建新地区: ${aiRegionName} (${newLocationSlug})`);
          } catch (createError) {
            // 可能是 unique 约束冲突，尝试再次查找
            locationRecord = await prisma.location.findFirst({
              where: { slug: newLocationSlug },
              select: { id: true },
            });
          }
        }
      }

      // 如果 AI 没返回地区，尝试从用户传入的 cuisine 推断
      if (!locationRecord && cuisine) {
        locationRecord = await prisma.location.findFirst({
          where: {
            OR: [
              { name: { contains: cuisine.replace('菜', '') } },
              { slug: { contains: cuisineSlug || '' } },
            ],
          },
          select: { id: true },
        });
      }

      const recipe = await prisma.recipe.create({
        data: {
          title: recipeDataWithoutTags.titleZh,
          description: summaryData?.oneLine || null,
          difficulty: summaryData?.difficulty || null,
          prepTime: summaryData?.timeTotalMin ? Math.max(0, (summaryData.timeTotalMin - (summaryData.timeActiveMin || 0))) : null,
          cookTime: summaryData?.timeActiveMin || null,
          servings: summaryData?.servings ? String(summaryData.servings) : null,
          summary: {
            ...(recipeDataWithoutTags.summary as object),
            primaryIngredients: primaryIngredientsStr,
          } as object,
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
          coverImage: undefined,
          aiGenerated: true,
          status: "draft",
          reviewStatus: "pending",
          cuisineId: cuisineRecord?.id || null,
          locationId: locationRecord?.id || null,
          explorerId: teamAssignment.explorerId,
          reviewerId: teamAssignment.reviewerId,
          author: "Recipe Zen",  // 默认作者
        },
      });

      // 如果 AI 返回了英文标题，创建英文翻译记录
      const aiTitleEn = recipeDataWithoutTags.titleEn as string | null;
      if (aiTitleEn && aiTitleEn.trim()) {
        try {
          await prisma.recipeTranslation.create({
            data: {
              recipeId: recipe.id,
              locale: "en",
              title: aiTitleEn.trim(),
              slug: slug,
              description: (recipeDataWithoutTags.summary as any)?.oneLine || null,
              difficulty: (recipeDataWithoutTags.summary as any)?.difficulty || null,
              summary: recipeDataWithoutTags.summary as object,
              story: recipeDataWithoutTags.story as object,
              ingredients: recipeDataWithoutTags.ingredients as object,
              steps: recipeDataWithoutTags.steps as object,
              isReviewed: false,  // 需要人工审核
              transMethod: "ai_generated",
              aiModel: "glm-4-flash",
            },
          });
          console.log(`[API] 创建英文翻译记录: ${aiTitleEn}`);
        } catch (transError) {
          console.error("[API] 创建英文翻译失败:", transError);
        }
      }

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

      // 创建图片生成任务（如果启用）
      let imageTaskId: string | null = null;
      if (generateImages) {
        imageTaskId = await createImageGenTask(recipe.id, result.data, dishName);
      }

      // 刷新日志到数据库
      await flushLogs();

      return NextResponse.json({
        success: true,
        data: recipe,
        message: generateImages
          ? `菜谱"${result.data.titleZh}"生成成功，图片生成任务已创建，请在提示词生成器页面执行`
          : `菜谱"${result.data.titleZh}"生成成功`,
        imageTaskId,
      });
    }

    // 不自动保存，只返回生成的数据
    // 刷新日志到数据库
    await flushLogs();

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `菜谱"${result.data.titleZh}"生成成功`,
    });
  } catch (error) {
    console.error("生成菜谱失败:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("错误详情:", errorMessage);
    console.error("错误堆栈:", errorStack);

    // 刷新日志到数据库（即使出错也要记录）
    await flushLogs();

    return NextResponse.json(
      {
        success: false,
        error: `生成菜谱失败: ${errorMessage}`,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
