/**
 * 智能搜索 API
 *
 * GET /api/search - 搜索菜谱，无结果时自动生成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateRecipe } from "@/lib/ai/generate-recipe";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const location = searchParams.get("location");
    const cuisine = searchParams.get("cuisine");
    const autoGenerate = searchParams.get("autoGenerate") !== "false"; // 默认开启自动生成

    if (!query) {
      return NextResponse.json(
        { success: false, error: "搜索关键词不能为空" },
        { status: 400 }
      );
    }

    // 构建搜索条件
    const where: any = {
      isPublished: true, // 只搜索已发布的菜谱
      OR: [
        { titleZh: { contains: query, mode: "insensitive" } },
        { titleEn: { contains: query, mode: "insensitive" } },
      ],
    };

    if (location) {
      where.location = location;
    }

    if (cuisine) {
      where.cuisine = cuisine;
    }

    // 搜索数据库
    const recipes = await prisma.recipe.findMany({
      where,
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    // 如果找到结果，直接返回
    if (recipes.length > 0) {
      return NextResponse.json({
        success: true,
        data: recipes,
        source: "database",
        message: `找到 ${recipes.length} 个相关菜谱`,
      });
    }

    // ========== 无结果时自动生成 ==========
    if (!autoGenerate) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "database",
        message: "未找到相关菜谱",
      });
    }

    // 调用AI生成
    console.log(`搜索无结果，正在为"${query}"生成菜谱...`);

    const generateResult = await generateRecipe({
      dishName: query,
      location,
      cuisine,
    });

    if (!generateResult.success) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "database",
        message: "未找到相关菜谱，AI生成失败",
        generateError: generateResult.error,
      });
    }

    // 生成slug
    const slug = `${generateResult.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    // 保存到数据库
    const newRecipe = await prisma.recipe.create({
      data: {
        schemaVersion: generateResult.data.schemaVersion,
        titleZh: generateResult.data.titleZh,
        titleEn: generateResult.data.titleEn,
        summary: generateResult.data.summary,
        story: generateResult.data.story,
        ingredients: generateResult.data.ingredients,
        steps: generateResult.data.steps,
        styleGuide: generateResult.data.styleGuide,
        imageShots: generateResult.data.imageShots,
        location,
        cuisine,
        mainIngredients: [],
        slug,
        aiGenerated: true,
        isPublished: true, // 搜索生成的直接发布，提供无感体验
      },
    });

    // 返回新生成的菜谱
    return NextResponse.json({
      success: true,
      data: [newRecipe],
      source: "ai-generated",
      message: `未找到"${query}"，已为您生成新菜谱`,
      generatedRecipeId: newRecipe.id,
    });
  } catch (error) {
    console.error("搜索失败:", error);
    return NextResponse.json(
      { success: false, error: "搜索失败" },
      { status: 500 }
    );
  }
}
