/**
 * 智能搜索 API
 *
 * GET /api/search - 搜索菜谱，无结果时自动生成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateRecipe } from "@/lib/ai/generate-recipe";
import type { Prisma } from "@prisma/client";
import { ensureIngredientIconRecords } from "@/lib/ingredients/ensure-ingredient-icons";
import { getContentLocales } from "@/lib/i18n/content";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

function resolveLocale(value?: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * 解析地点参数（支持 slug 和中文名）
 */
async function resolveLocationFilter(location: string): Promise<string[]> {
  const bySlug = await prisma.location.findUnique({
    where: { slug: location },
    select: { name: true },
  });
  if (bySlug) return [bySlug.name];

  const byName = await prisma.location.findUnique({
    where: { name: location },
    select: { name: true },
  });
  if (byName) return [byName.name];

  return [location];
}

/**
 * 解析菜系参数（支持 slug 和中文名）
 */
async function resolveCuisineFilter(cuisine: string): Promise<string[]> {
  const bySlug = await prisma.cuisine.findUnique({
    where: { slug: cuisine },
    select: { name: true },
  });
  if (bySlug) return [bySlug.name];

  const byName = await prisma.cuisine.findUnique({
    where: { name: cuisine },
    select: { name: true },
  });
  if (byName) return [byName.name];

  return [cuisine];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const location = searchParams.get("location");
    const cuisine = searchParams.get("cuisine");
    const locale = resolveLocale(searchParams.get("locale"));
    const locales = getContentLocales(locale);
    // 默认开启自动生成；仅当 autoGenerate=false 时关闭
    const autoGenerate = searchParams.get("autoGenerate") !== "false";

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

    // 地点筛选（支持 slug 和中文名）
    if (location) {
      const names = await resolveLocationFilter(location);
      where.location = { in: names };
    }

    // 菜系筛选（支持 slug 和中文名）
    if (cuisine) {
      const names = await resolveCuisineFilter(cuisine);
      where.cuisine = { in: names };
    }

    // 搜索数据库
    const recipes = await prisma.recipe.findMany({
      where,
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        translations: { where: { locale: { in: locales } } },
      },
    });

    // 如果找到结果，直接返回
    if (recipes.length > 0) {
      const data =
        locale === DEFAULT_LOCALE
          ? recipes
          : recipes.map((recipe) => {
              const translation =
                locales
                  .map((loc) =>
                    recipe.translations.find((item) => item.locale === loc)
                  )
                  .find(Boolean) || null;
              if (!translation) return recipe;
              return {
                ...recipe,
                titleZh: translation.title,
                summary: translation.summary,
              };
            });
      return NextResponse.json({
        success: true,
        data,
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
      location: location ?? undefined,
      cuisine: cuisine ?? undefined,
    });

    if (!generateResult.success) {
      if (generateResult.data) {
        try {
          const draftSlug = `${(generateResult.data.titleZh || query)
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}`;

          await ensureIngredientIconRecords(generateResult.data.ingredients);

          await prisma.recipe.create({
            data: {
              title: generateResult.data.titleZh,
              summary: generateResult.data.summary as unknown as Prisma.InputJsonValue,
              story: (generateResult.data.story ?? generateResult.data.culturalStory ?? null) as unknown as Prisma.InputJsonValue,
              ingredients: generateResult.data.ingredients as unknown as Prisma.InputJsonValue,
              steps: generateResult.data.steps as unknown as Prisma.InputJsonValue,
              styleGuide: generateResult.data.styleGuide as unknown as Prisma.InputJsonValue,
              imageShots: generateResult.data.imageShots as unknown as Prisma.InputJsonValue,
              slug: draftSlug,
              aiGenerated: true,
              status: "draft",
              reviewStatus: "pending",
              transStatus: {
                generateError: generateResult.error,
                validationIssues: generateResult.issues,
              } as Prisma.InputJsonValue,
            },
          });
        } catch (saveError) {
          console.error("保存搜索生成草稿失败:", saveError);
        }
      }

      return NextResponse.json({
        success: true,
        data: [],
        source: "database",
        message: generateResult.data
          ? "未找到相关菜谱，AI生成校验失败，已保存草稿"
          : "未找到相关菜谱，AI生成失败",
        generateError: generateResult.error,
      });
    }

    // 生成slug
    const slug = `${generateResult.data.titleZh.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    // 保存到数据库
    await ensureIngredientIconRecords(generateResult.data.ingredients);

    const newRecipe = await prisma.recipe.create({
      data: {
        title: generateResult.data.titleZh,
        summary: generateResult.data.summary as unknown as Prisma.InputJsonValue,
        story: generateResult.data.story as unknown as Prisma.InputJsonValue,
        ingredients: generateResult.data.ingredients as unknown as Prisma.InputJsonValue,
        steps: generateResult.data.steps as unknown as Prisma.InputJsonValue,
        styleGuide: generateResult.data.styleGuide as unknown as Prisma.InputJsonValue,
        imageShots: generateResult.data.imageShots as unknown as Prisma.InputJsonValue,
        slug,
        aiGenerated: true,
        status: "pending",
        reviewStatus: "pending",
      },
    });

    // 返回新生成的菜谱
    return NextResponse.json({
      success: true,
      data: [newRecipe],
      source: "ai-generated",
      draft: false,
      message: `未找到"${query}"，已生成待审核菜谱`,
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
