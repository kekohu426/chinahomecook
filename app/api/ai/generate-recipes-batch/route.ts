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

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

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
                title: result.data.titleZh,
                summary: result.data.summary as unknown as Prisma.InputJsonValue,
                story: result.data.story as unknown as Prisma.InputJsonValue,
                ingredients: result.data.ingredients as unknown as Prisma.InputJsonValue,
                steps: result.data.steps as unknown as Prisma.InputJsonValue,
                styleGuide: result.data.styleGuide as unknown as Prisma.InputJsonValue,
                imageShots: result.data.imageShots as unknown as Prisma.InputJsonValue,
                slug,
                aiGenerated: true,
                status: "draft",
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
