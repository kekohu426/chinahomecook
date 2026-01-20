/**
 * 定制菜谱 - 生成完整食谱 API
 *
 * POST /api/custom-recipes/generate - 生成完整食谱并保存
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";
import { evolinkClient } from "@/lib/ai/evolink";
import { uploadImage, generateSafeFilename } from "@/lib/utils/storage";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeName, customPrompt } = body;

    if (!recipeName) {
      return NextResponse.json(
        { success: false, error: "recipeName 为必填项" },
        { status: 400 }
      );
    }

    // 调用 AI 生成食谱
    const result = await generateRecipe({
      dishName: recipeName,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 生成 slug
    const slug = `custom-${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    // 尝试生成所有配图（封面图 + 步骤图）
    let coverImage: string | undefined;
    let imageError: string | undefined;

    try {
      if (result.data.imageShots && result.data.imageShots.length > 0) {
        console.log(`准备生成 ${result.data.imageShots.length} 张配图...`);

        // 串行生成所有图片（避免并发限流）
        for (const shot of result.data.imageShots) {
          try {
            if (!shot.imagePrompt) continue;

            console.log(`正在生成图片 [${shot.key}]...`);

            // 根据比例确定尺寸
            let width = 1024;
            let height = 1024;
            if (shot.ratio === "16:9") height = 576;
            else if (shot.ratio === "4:3") height = 768;
            else if (shot.ratio === "3:2") height = 683;

            const imageResult = await evolinkClient.generateImage({
              prompt: shot.imagePrompt,
              width,
              height,
              timeoutMs: 60000,
              retries: 2,
            });

            if (imageResult.success && imageResult.imageUrl) {
              console.log(`图片 [${shot.key}] 生成成功:`, imageResult.imageUrl);
              let finalImageUrl = imageResult.imageUrl;

              // 尝试转存到 R2
              if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
                try {
                  console.log(`正在转存图片 [${shot.key}] 到 R2...`);
                  const imageRes = await fetch(imageResult.imageUrl);
                  if (imageRes.ok) {
                    const arrayBuffer = await imageRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const path = generateSafeFilename(`${shot.key}.png`, `recipes/${slug}`);
                    finalImageUrl = await uploadImage(buffer, path);
                    console.log(`图片 [${shot.key}] 转存成功:`, finalImageUrl);
                  }
                } catch (uploadErr) {
                  console.error(`图片 [${shot.key}] 转存 R2 失败，保留原链接:`, uploadErr);
                }
              }

              shot.imageUrl = finalImageUrl;

              // 如果是封面图，记录下来
              if (shot.key === "hero" || shot.key === "cover") {
                coverImage = finalImageUrl;
              }
            } else {
              console.error(`图片 [${shot.key}] 生成失败:`, imageResult.error);
              if (shot.key === "hero" || shot.key === "cover") {
                imageError = imageResult.error;
              }
            }
          } catch (err) {
            console.error(`图片 [${shot.key}] 生成出错:`, err);
          }
        }

        // 如果没有明确的 cover/hero，尝试使用第一张成功的图片作为封面
        if (!coverImage && result.data.imageShots.length > 0) {
          const firstSuccess = result.data.imageShots.find((s) => s.imageUrl);
          if (firstSuccess) {
            coverImage = firstSuccess.imageUrl;
          }
        }

        console.log("图片生成完成，准备保存到数据库");
      }
    } catch (err) {
      console.error("生成配图过程出错:", err);
      imageError = err instanceof Error ? err.message : "配图生成失败";
    }

    // 保存到数据库
    await ensureIngredientIconRecords(result.data.ingredients);

    // 排除 tags 字段（AI 返回的是结构化标签建议，不能直接存入多对多关系）
    const { tags: _aiTags, ...recipeDataWithoutTags } = result.data;

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
        coverImage,
        aiGenerated: true,
        status: "published", // 定制食谱直接发布
      },
    });

    return NextResponse.json({
      success: true,
      recipeId: recipe.id,
      data: recipe,
      message: `食谱"${result.data.titleZh}"生成成功`,
      imageError,
    });
  } catch (error) {
    console.error("生成定制食谱失败:", error);
    return NextResponse.json(
      { success: false, error: "生成食谱失败，请稍后重试" },
      { status: 500 }
    );
  }
}
