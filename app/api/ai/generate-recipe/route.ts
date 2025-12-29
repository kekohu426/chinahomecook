/**
 * AI生成单个菜谱 API
 *
 * POST /api/ai/generate-recipe - 生成单个菜谱并保存到数据库
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/ai/generate-recipe";
import { prisma } from "@/lib/db/prisma";
import { evolinkClient } from "@/lib/ai/evolink";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dishName, location, cuisine, mainIngredients, autoSave } = body;

    if (!dishName) {
      return NextResponse.json(
        { success: false, error: "dishName 为必填项" },
        { status: 400 }
      );
    }

    // 调用AI生成
    const result = await generateRecipe({
      dishName,
      location,
      cuisine,
      mainIngredients,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 如果autoSave为true，自动保存到数据库
    if (autoSave !== false) {
      // 生成slug
      const slug = `${result.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

      // 尝试生成封面图（使用第一个imageShot的prompt）
      let coverImage: string | undefined;
      let imageError: string | undefined;
      try {
        if (result.data.imageShots && result.data.imageShots.length > 0) {
          const heroShot = result.data.imageShots.find(
            (shot: any) => shot.key === "hero" || shot.key === "cover"
          ) || result.data.imageShots[0];

          if (heroShot?.imagePrompt) {
            console.log("正在生成封面图...", heroShot.imagePrompt);
            const imageResult = await evolinkClient.generateImage({
              prompt: heroShot.imagePrompt,
              width: 1024,
              height: 576, // 16:9比例
              timeoutMs: 20000,
              retries: 1,
            });

            if (imageResult.success && imageResult.imageUrl) {
              coverImage = imageResult.imageUrl;
              console.log("封面图生成成功:", coverImage);
            } else {
              imageError = imageResult.error || "封面图生成失败";
              console.error("封面图生成失败:", imageError);
            }
          }
        }
      } catch (imageError) {
        console.error("生成封面图时出错:", imageError);
        imageError = imageError instanceof Error ? imageError.message : "封面图生成失败";
        // 图片生成失败不影响菜谱保存
      }

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
          mainIngredients: mainIngredients || [],
          slug,
          coverImage, // 添加生成的封面图
          aiGenerated: true,
          isPublished: false, // 默认不发布，需要人工审核
        },
      });

      return NextResponse.json({
        success: true,
        data: recipe,
        message: `菜谱"${result.data.titleZh}"生成成功并已保存${coverImage ? "，封面图已生成" : "（封面图生成失败，可在编辑页重新生成）"}`,
        imageError,
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
