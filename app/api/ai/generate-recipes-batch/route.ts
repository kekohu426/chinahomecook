/**
 * AI批量生成菜谱 API
 *
 * POST /api/ai/generate-recipes-batch - 批量生成菜谱并保存到数据库
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { generateRecipesBatch } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      const savedRecipes: Array<{ recipe: Prisma.RecipeGetPayload<{ select: { id: true; title: true } }>; warning?: string }> = [];
      const savedWarnings: Array<{ dishName: string; warning: string }> = [];

      for (const result of batchResult.results) {
        if (result.data) {
          try {
            // 生成slug
            const slug = `${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

            await ensureIngredientIconRecords(result.data.ingredients);

            // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
            const { tags: _aiTags, ...recipeDataWithoutTags } = result.data;

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
                styleGuide: recipeDataWithoutTags.styleGuide as unknown as Prisma.InputJsonValue,
                imageShots: recipeDataWithoutTags.imageShots as unknown as Prisma.InputJsonValue,
                slug,
                aiGenerated: true,
                status: "draft",
                reviewStatus: "pending",
                transStatus: result.success
                  ? undefined
                  : ({
                      generateError: result.error,
                      validationIssues: result.issues,
                    } as Prisma.InputJsonValue),
              },
            });

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
        message: `批量生成完成：成功 ${batchResult.success}/${dishNames.length}，已保存 ${savedRecipes.length} 个菜谱`,
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
