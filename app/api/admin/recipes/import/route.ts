/**
 * 批量导入食谱 API
 *
 * POST /api/admin/recipes/import
 * 批量导入多个食谱（需管理员权限）
 *
 * 注意：图片生成已迁移到 ImageGenTask 系统
 * 导入的 JSON 应与 AI 生成的格式一致
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { RecipeSchema } from "@/lib/validators/recipe";
import { parseAndValidateRecipes } from "@/lib/validators/recipe-import";
import { z } from "zod";
import { executeImageTask } from "@/lib/ai/image-task-executor";
import { assignTeamMembers } from "@/lib/team/assign-members";

// 单次导入最大数量
const MAX_IMPORT_COUNT = 100;

interface ImportError {
  index: number;
  name: string;
  error: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
  createdIds: string[];
  createdRecipes: Array<{ id: string; name: string; imageTaskId?: string }>;
  imageTasksCreated: number;
}

/**
 * 创建图片生成任务
 */
async function createImageGenTask(
  recipeId: string,
  recipeData: z.infer<typeof RecipeSchema>
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
        recipeName: recipeData.titleZh,
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
      console.error(`[Import] 图片生成任务执行失败 (${task.id}):`, e);
    });

    return task.id;
  } catch (taskError) {
    console.error(`[Import] 创建 ImageGenTask 失败:`, taskError);
    return null;
  }
}

// 检查管理员权限
async function requireAdmin(): Promise<{ session: Awaited<ReturnType<typeof auth>> } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      )
    };
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, error: "需要管理员权限" },
        { status: 403 }
      )
    };
  }
  return { session };
}

/**
 * 批量解析或创建标签（优化版：减少数据库查询）
 */
async function resolveOrCreateTagsBatch(
  allTagData: { type: string; name: string }[]
): Promise<Map<string, string>> {
  const tagMap = new Map<string, string>(); // key: "type:name" -> id

  if (allTagData.length === 0) return tagMap;

  // 去重
  const uniqueTags = Array.from(
    new Map(allTagData.map(t => [`${t.type}:${t.name}`, t])).values()
  );

  // 批量查询已存在的标签
  const existingTags = await prisma.tag.findMany({
    where: {
      OR: uniqueTags.map(t => ({ type: t.type, name: t.name }))
    },
    select: { id: true, type: true, name: true }
  });

  // 记录已存在的标签
  for (const tag of existingTags) {
    tagMap.set(`${tag.type}:${tag.name}`, tag.id);
  }

  // 找出需要创建的标签
  const tagsToCreate = uniqueTags.filter(
    t => !tagMap.has(`${t.type}:${t.name}`)
  );

  // 批量创建新标签（性能优化：使用 createMany）
  if (tagsToCreate.length > 0) {
    const createData = tagsToCreate.map(data => ({
      type: data.type,
      name: data.name,
      slug: `${data.type}-${data.name.toLowerCase().replace(/\s+/g, "-")}`,
      isActive: true,
    }));

    try {
      // 批量插入，跳过重复项（处理并发情况）
      await prisma.tag.createMany({
        data: createData,
        skipDuplicates: true,
      });
    } catch (e) {
      console.warn('[Import] Tag createMany warning:', e);
    }

    // 批量查询新创建的标签ID
    const newTags = await prisma.tag.findMany({
      where: {
        OR: tagsToCreate.map(t => ({ type: t.type, name: t.name }))
      },
      select: { id: true, type: true, name: true }
    });

    for (const tag of newTags) {
      tagMap.set(`${tag.type}:${tag.name}`, tag.id);
    }
  }

  return tagMap;
}

/**
 * 批量预加载地点数据
 */
async function preloadLocations(): Promise<Map<string, string>> {
  const locations = await prisma.location.findMany({
    select: { id: true, slug: true, name: true }
  });

  const map = new Map<string, string>();
  for (const loc of locations) {
    map.set(loc.slug, loc.id);
    map.set(loc.name, loc.id);
  }
  return map;
}

/**
 * 将 AI 生成的 JSON 转换为数据库字段格式
 * 注意：不再提取 coverImage，图片通过 ImageGenTask 生成
 */
function transformRecipeData(recipe: z.infer<typeof RecipeSchema>) {
  // 从 tags 对象转换为标签数组
  const tagData: { type: string; name: string }[] = [];
  if (recipe.tags) {
    if (recipe.tags.scenes) {
      recipe.tags.scenes.forEach((name) => tagData.push({ type: "scene", name }));
    }
    if (recipe.tags.cookingMethods) {
      recipe.tags.cookingMethods.forEach((name) => tagData.push({ type: "method", name }));
    }
    if (recipe.tags.tastes) {
      recipe.tags.tastes.forEach((name) => tagData.push({ type: "taste", name }));
    }
    if (recipe.tags.crowds) {
      recipe.tags.crowds.forEach((name) => tagData.push({ type: "crowd", name }));
    }
    if (recipe.tags.occasions) {
      recipe.tags.occasions.forEach((name) => tagData.push({ type: "occasion", name }));
    }
  }

  // 处理 story 字段
  let storyData = recipe.story || null;
  if (recipe.culturalStory && !storyData) {
    storyData = recipe.culturalStory;
  }

  return {
    title: recipe.titleZh,
    description: recipe.summary?.oneLine || null,
    difficulty: recipe.summary?.difficulty || null,
    prepTime: recipe.summary?.timeTotalMin || null,
    cookTime: null,
    servings: recipe.summary?.servings?.toString() || null,
    summary: recipe.summary || null,
    story: storyData,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    nutrition: recipe.nutrition || null,
    // coverImage 不再从 JSON 提取，通过 ImageGenTask 生成
    coverImage: null,
    faq: recipe.faq || null,
    tips: recipe.tips || null,
    troubleshooting: recipe.troubleshooting || null,
    relatedRecipes: recipe.relatedRecipes || null,
    pairing: recipe.pairing || null,
    seo: recipe.seo || null,
    notes: recipe.notes || null,
    tagData,
    origin: recipe.origin,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;
    const session = authResult.session;
    const body = await request.json();
    const { recipes } = body;

    // 验证请求
    if (!recipes || !Array.isArray(recipes)) {
      return NextResponse.json(
        { success: false, error: "recipes 必须是数组" },
        { status: 400 }
      );
    }

    if (recipes.length === 0) {
      return NextResponse.json(
        { success: false, error: "recipes 不能为空" },
        { status: 400 }
      );
    }

    if (recipes.length > MAX_IMPORT_COUNT) {
      return NextResponse.json(
        { success: false, error: `单次最多导入 ${MAX_IMPORT_COUNT} 个食谱` },
        { status: 400 }
      );
    }

    console.log(`[Import] 开始导入 ${recipes.length} 个食谱...`);
    // 预处理：验证所有食谱并收集标签
    const validatedRecipes: Array<{
      index: number;
      name: string;
      data: z.infer<typeof RecipeSchema>;
      transformed: ReturnType<typeof transformRecipeData>;
    }> = [];
    const allTagData: { type: string; name: string }[] = [];
    const errors: ImportError[] = [];

    const validationResults = parseAndValidateRecipes(recipes, "import");

    for (let i = 0; i < validationResults.length; i++) {
      const result = validationResults[i];
      const raw = result.rawData as Record<string, unknown> | undefined;
      const recipeName =
        result.data?.titleZh ||
        (raw?.titleZh as string | undefined) ||
        (raw?.title as string | undefined) ||
        `?? ${i + 1}`;

      if (!result.isValid || !result.data) {
        const errorMsg =
          (result.errors || []).join("; ") || "??????";
        errors.push({ index: i, name: recipeName, error: `??????: ${errorMsg}` });
        continue;
      }

      const transformed = transformRecipeData(result.data);
      validatedRecipes.push({
        index: i,
        name: recipeName,
        data: result.data,
        transformed,
      });

      // ??????
      allTagData.push(...transformed.tagData);
    }

    console.log(`[Import] 验证完成: ${validatedRecipes.length} 有效, ${errors.length} 失败`)

    // 批量预加载数据（性能优化：并行加载）
    const preloadStartTime = Date.now();
    const [locationMap, tagMap] = await Promise.all([
      preloadLocations(),
      resolveOrCreateTagsBatch(allTagData),
    ]);
    const preloadDuration = Date.now() - preloadStartTime;

    console.log(`[Import] 预加载完成: ${locationMap.size} 地点, ${tagMap.size} 标签 (耗时: ${preloadDuration}ms)`);

    const results: ImportResult = {
      success: 0,
      failed: errors.length,
      errors: [...errors],
      createdIds: [],
      createdRecipes: [],
      imageTasksCreated: 0,
    };

    // 批量创建食谱（性能优化：使用事务批处理）
    const BATCH_SIZE = 10; // 每批处理10个食谱

    for (let i = 0; i < validatedRecipes.length; i += BATCH_SIZE) {
      const batchStartTime = Date.now();
      const batch = validatedRecipes.slice(i, i + BATCH_SIZE);

      console.log(`[Import] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validatedRecipes.length / BATCH_SIZE)} (${batch.length} recipes)...`);

      try {
        const teamAssignments = await Promise.all(
          batch.map(() => assignTeamMembers())
        );

        // 使用事务并行处理批次中的所有食谱
        const batchResults = await prisma.$transaction(
          batch.map((recipe, recipeIndex) => {
            const { transformed } = recipe;
            const slug = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const assignment = teamAssignments[recipeIndex];
            const authorName =
              assignment.explorerName || assignment.reviewerName || "Recipe Zen";

            // 解析地点（从预加载数据）
            const locationId = transformed.origin?.region
              ? locationMap.get(transformed.origin.region) || null
              : null;

            // 解析标签ID（从预加载数据）
            const tagIds = transformed.tagData
              .map(t => tagMap.get(`${t.type}:${t.name}`))
              .filter((id): id is string => !!id);

            // 返回食谱创建 Promise
            return prisma.recipe.create({
              data: {
                title: transformed.title,
                slug,
                description: transformed.description,
                difficulty: transformed.difficulty,
                prepTime: transformed.prepTime,
                cookTime: transformed.cookTime,
                servings: transformed.servings,
                summary: transformed.summary,
                story: transformed.story,
                ingredients: transformed.ingredients,
                steps: transformed.steps,
                nutrition: transformed.nutrition,
                coverImage: transformed.coverImage,
                faq: transformed.faq,
                tips: transformed.tips,
                troubleshooting: transformed.troubleshooting,
                relatedRecipes: transformed.relatedRecipes,
                pairing: transformed.pairing,
                seo: transformed.seo,
                notes: transformed.notes,
                locationId,
                status: "draft",
                reviewStatus: "pending",
                aiGenerated: true, // JSON 来自 AI 生成，统一标记
                explorerId: assignment.explorerId,
                reviewerId: assignment.reviewerId,
                author: authorName,
                tags: tagIds.length > 0
                  ? { create: tagIds.map((tagId) => ({ tagId })) }
                  : undefined,
              },
            });
          }),
          {
            isolationLevel: 'ReadCommitted',
          }
        );

        // 处理批次结果
        for (let idx = 0; idx < batchResults.length; idx++) {
          const created = batchResults[idx];
          const recipeName = batch[idx]?.name || created.title;
          results.success++;
          results.createdIds.push(created.id);
          results.createdRecipes.push({
            id: created.id,
            name: created.title,
          });

        }

        // 异步创建图片生成任务（不阻塞导入响应）
        batch.forEach((recipe, idx) => {
          createImageGenTask(batchResults[idx].id, recipe.data)
            .then(taskId => {
              if (taskId) {
                console.log(`[Import] ImageTask created: ${taskId} for recipe ${recipe.name}`);
              }
            })
            .catch(e => console.error(`[Import] ImageTask creation failed for ${recipe.name}:`, e));
        });

        results.imageTasksCreated += batch.length; // 预计创建数量

        const batchDuration = Date.now() - batchStartTime;
        console.log(`[Import] Batch completed in ${batchDuration}ms (${(batchDuration / batch.length).toFixed(0)}ms per recipe)`);

      } catch (error) {
        // 整个批次失败的情况（罕见）
        console.error('[Import] Batch transaction failed:', error);
        batch.forEach(recipe => {
          results.failed++;
          results.errors.push({
            index: recipe.index,
            name: recipe.name,
            error: error instanceof Error ? error.message : "批次处理失败",
          });
          logger.logFailure(
            "import_create",
            "import",
            error instanceof Error ? error : new Error("批次处理失败"),
            {
              metadata: { recipeName: recipe.name, index: recipe.index },
            }
          );
        });
      }
    }

    const duration = Date.now() - startTime;
    const throughput = duration > 0 ? ((results.success / duration) * 1000).toFixed(2) : '0';
    console.log(`[Import] ✅ 完成: 成功 ${results.success}, 失败 ${results.failed}, 耗时 ${duration}ms (${throughput} recipes/sec)`);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("批量导入失败:", error);
    return NextResponse.json(
      { success: false, error: "批量导入失败" },
      { status: 500 }
    );
  }
}
