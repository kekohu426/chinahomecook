/**
 * AI生成单个菜谱 API
 *
 * POST /api/ai/generate-recipe - 生成单个菜谱并保存到数据库
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRecipe, generateStepImages, generateCoverImages } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";
import { uploadImage, generateSafeFilename } from "@/lib/utils/storage";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // 调用AI生成菜谱文本
    const result = await generateRecipe({
      dishName,
      servings,
      timeBudget,
      equipment,
      dietary,
      cuisine,
    });

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
            styleGuide: recipeDataWithoutTags.styleGuide as object,
            imageShots: recipeDataWithoutTags.imageShots as object,
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

    // 如果autoSave为true，自动保存到数据库
    if (autoSave !== false) {
      // 生成slug
      const slug = `${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

      let coverImage: string | undefined;
      let imageError: string | undefined;

      try {
        await ensureIngredientIconRecords(result.data.ingredients);
      } catch (iconError) {
        console.error("食材图标同步失败，继续保存草稿:", iconError);
      }

      // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
      const { tags: _aiTags, ...recipeDataWithoutTags } = result.data;

      // 先落库草稿，避免后续任何步骤失败导致丢失
      let recipe = await prisma.recipe.create({
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
          styleGuide: recipeDataWithoutTags.styleGuide as object,
          imageShots: recipeDataWithoutTags.imageShots as object,
          slug,
          coverImage,
          aiGenerated: true,
          status: "draft",
          reviewStatus: "pending",
        },
      });

      // 生成图片（如果启用）
      if (generateImages) {
        try {
          // 1. 生成步骤图
          if (result.data.steps && result.data.steps.length > 0) {
            console.log(`准备生成 ${result.data.steps.length} 个步骤图...`);
            result.data.steps = await generateStepImages(
              result.data.steps as any[],
              result.data.titleZh || dishName
            ) as any;
            console.log("步骤图生成完成");
          }

          // 2. 生成成品图
          if (result.data.imageShots && result.data.imageShots.length > 0) {
            console.log(`准备生成 ${result.data.imageShots.length} 张成品图...`);
            result.data.imageShots = await generateCoverImages(
              result.data.imageShots as any[],
              result.data.titleZh || dishName
            ) as any;

            // 尝试转存到 R2 (如果配置了)
            if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
              for (const shot of result.data.imageShots as any[]) {
                if (shot.imageUrl && !shot.imageUrl.includes(process.env.R2_ENDPOINT)) {
                  try {
                    console.log(`正在转存图片 [${shot.key}] 到 R2...`);
                    const imageRes = await fetch(shot.imageUrl);
                    if (imageRes.ok) {
                      const arrayBuffer = await imageRes.arrayBuffer();
                      const buffer = Buffer.from(arrayBuffer);
                      const path = generateSafeFilename(`image.png`, `recipes/${slug}`);
                      shot.imageUrl = await uploadImage(buffer, path);
                      console.log(`图片 [${shot.key}] 转存成功:`, shot.imageUrl);
                    }
                  } catch (uploadErr) {
                    console.error(`图片 [${shot.key}] 转存 R2 失败，保留原链接:`, uploadErr);
                  }
                }
              }
            }

            // 设置封面图
            const coverShot = (result.data.imageShots as any[]).find(
              (s: any) => (s.key === "hero" || s.key === "cover" || s.key === "cover_main") && s.imageUrl
            );
            if (coverShot) {
              coverImage = coverShot.imageUrl;
            } else {
              const firstSuccess = (result.data.imageShots as any[]).find((s: any) => s.imageUrl);
              if (firstSuccess) {
                coverImage = firstSuccess.imageUrl;
              }
            }
          }

          console.log("所有图片生成完成");
        } catch (err) {
          console.error("生成图片过程出错:", err);
          imageError = err instanceof Error ? err.message : "图片生成失败";
        }
      }

      // 更新图片与封面信息（即使失败也保留草稿）
      if (generateImages) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: {
            steps: result.data.steps as object,
            imageShots: result.data.imageShots as object,
            coverImage,
            transStatus: imageError ? ({ imageError } as object) : undefined,
          },
        });
        recipe = await prisma.recipe.findUnique({ where: { id: recipe.id } }) || recipe;
      }

      // 统计生成的图片数量
      const stepImagesCount = (result.data.steps as any[])?.filter((s: any) => s.imageUrl).length || 0;
      const coverImagesCount = (result.data.imageShots as any[])?.filter((s: any) => s.imageUrl).length || 0;

      return NextResponse.json({
        success: true,
        data: recipe,
        message: `菜谱"${result.data.titleZh}"生成成功，已生成 ${stepImagesCount} 张步骤图和 ${coverImagesCount} 张成品图`,
        imageError,
        stats: {
          stepImages: stepImagesCount,
          coverImages: coverImagesCount,
        },
      });
    }

    // 不自动保存，只返回生成的数据
    return NextResponse.json({
      success: true,
      data: result.data,
      message: `菜谱"${result.data.titleZh}"生成成功`,
    });
  } catch (error) {
    console.error("生成菜谱失败:", error);
    return NextResponse.json(
      { success: false, error: "生成菜谱失败" },
      { status: 500 }
    );
  }
}
