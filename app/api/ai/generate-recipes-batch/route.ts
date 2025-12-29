/**
 * AI批量生成菜谱 API
 *
 * POST /api/ai/generate-recipes-batch - 批量生成菜谱并保存到数据库
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRecipesBatch } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dishNames, location, cuisine, autoSave } = body;

    if (!dishNames || !Array.isArray(dishNames) || dishNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "dishNames 必须是非空数组" },
        { status: 400 }
      );
    }

    // 批量生成
    const batchResult = await generateRecipesBatch(dishNames, {
      location,
      cuisine,
    });

    // 如果autoSave为true，保存所有成功生成的菜谱
    if (autoSave !== false) {
      const savedRecipes = [];

      for (const result of batchResult.results) {
        if (result.success && result.data) {
          try {
            // 生成slug
            const slug = `${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

            const recipe = await prisma.recipe.create({
              data: {
                schemaVersion: result.data.schemaVersion,
                titleZh: result.data.titleZh,
                titleEn: result.data.titleEn,
                summary: result.data.summary,
                story: result.data.story,
                ingredients: result.data.ingredients,
                steps: result.data.steps,
                styleGuide: result.data.styleGuide,
                imageShots: result.data.imageShots,
                location,
                cuisine,
                mainIngredients: [], // 批量生成时暂不指定
                slug,
                aiGenerated: true,
                isPublished: false,
              },
            });

            savedRecipes.push(recipe);

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
          failedDishes: batchResult.results
            .filter((r) => !r.success)
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
