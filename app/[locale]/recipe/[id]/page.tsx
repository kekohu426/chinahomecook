/**
 * 食谱详情页
 *
 * 路由：/recipe/[id]
 * 支持通过 slug 或 ID 访问
 * 如果通过 ID 访问，会重定向到 slug URL
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/db/prisma";
import type { Recipe } from "@/types/recipe";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";
import { RecipeDetailClientV2 } from "@/components/recipe/RecipeDetailClient.v2";
import { ChevronRight, Home } from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getContentLocales } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";
import { LOCALE_ISO_CODES } from "@/lib/i18n/config";
import type { Metadata } from "next";
import { generateAlternates } from "@/lib/seo/alternates";
import { localizePath } from "@/lib/i18n/utils";
import { auth } from "@/lib/auth";

/**
 * 通过 slug 或 ID 查找食谱
 * 优先使用 slug 查找
 */
type RecipeWithTranslations = Awaited<ReturnType<typeof prisma.recipe.findUnique>> & {
  cuisine: { id: string; name: string; slug: string } | null;
  location: { id: string; name: string; slug: string } | null;
  translations: {
    locale: string;
    title: string;
    summary: any;
    story: any;
    ingredients: any;
    steps: any;
    styleGuide: any;
    imageShots: any;
  }[];
};

async function findRecipeBySlugOrId(
  idOrSlug: string,
  includeTranslations?: { locales: string[] }
): Promise<RecipeWithTranslations | null> {
  const includeOptions = includeTranslations
    ? {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        translations: {
          where: { locale: { in: includeTranslations.locales }, isReviewed: true },
        },
      }
    : {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
      };

  // 先尝试按 slug 查找
  let recipe = await prisma.recipe.findUnique({
    where: { slug: idOrSlug },
    include: includeOptions,
  });

  // 如果没找到，按 ID 查找
  if (!recipe) {
    recipe = await prisma.recipe.findUnique({
      where: { id: idOrSlug },
      include: includeOptions,
    });
  }

  return recipe as unknown as RecipeWithTranslations | null;
}

interface RecipePageProps {
  params: Promise<{ id: string; locale: Locale }>;
  searchParams?: Promise<{ preview?: string; version?: string }>;
}

async function canPreview(searchParams?: { preview?: string }) {
  const previewFlag = searchParams?.preview;
  if (previewFlag !== "1" && previewFlag !== "true") return false;
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function generateMetadata({
  params,
  searchParams,
}: RecipePageProps): Promise<Metadata> {
  const { id: rawId, locale } = await params;
  const previewAllowed = await canPreview(await searchParams);
  // URL 解码，处理中文 slug
  const idOrSlug = decodeURIComponent(rawId);
  const locales = getContentLocales(locale);
  const isEn = locale === "en";

  try {
    const recipe = await findRecipeBySlugOrId(idOrSlug, { locales });

    if (!recipe || (recipe.status !== "published" && !previewAllowed)) {
      return { title: isEn ? "Recipe not found" : "食谱不存在" };
    }

    const translation =
      locales
        .map((loc) => recipe.translations.find((item) => item.locale === loc))
        .find(Boolean) || null;
    const title = translation?.title || recipe.title;
    const summary = translation?.summary as any;
    const description =
      summary?.oneLine ||
      summary?.healingTone ||
      (isEn ? "A trusted recipe reviewed by our team." : "专业审核的可靠食谱。");

    // 使用 slug 生成规范 URL
    const alternates = generateAlternates(`/recipe/${recipe.slug}`, locale);
    const ogLocale = LOCALE_ISO_CODES[locale] || "zh-CN";

    return {
      title,
      description,
      alternates,
      openGraph: {
        title,
        description,
        type: "article",
        locale: ogLocale,
        images: recipe.coverImage ? [{ url: recipe.coverImage }] : undefined,
      },
    };
  } catch (error) {
    console.error("Failed to generate recipe metadata:", error);
    return { title: isEn ? "Recipe" : "食谱" };
  }
}

export default async function RecipePage({ params, searchParams }: RecipePageProps) {
  const { id: rawId, locale } = await params;
  const resolvedSearchParams = await searchParams;
  // URL 解码，处理中文 slug
  const idOrSlug = decodeURIComponent(rawId);
  const locales = getContentLocales(locale);
  const previewAllowed = await canPreview(resolvedSearchParams);

  // 检查版本参数，默认使用 v2
  const version = resolvedSearchParams?.version || "v2";

  // 从数据库获取食谱（支持 slug 或 ID）
  const recipeData = await findRecipeBySlugOrId(idOrSlug, { locales });

  if (!recipeData || (recipeData.status !== "published" && !previewAllowed)) {
    notFound();
  }

  // 如果通过 ID 访问且 slug 存在，重定向到 slug URL
  if (idOrSlug === recipeData.id && recipeData.slug && recipeData.slug !== recipeData.id) {
    redirect(localizePath(`/recipe/${recipeData.slug}`, locale));
  }

  // 菜系信息（现在是关联对象）
  const cuisineSlug = recipeData.cuisine?.slug || null;
  const cuisineName = recipeData.cuisine?.name || null;
  const cuisineHref = cuisineSlug
    ? `/recipe/cuisine/${encodeURIComponent(cuisineSlug)}`
    : null;

  // 地点信息（现在是关联对象）
  const locationName = recipeData.location?.name || null;

  // 获取相关食谱（同菜系或同地区）
  const relatedWhere: any = {
    status: "published",
    id: { not: recipeData.id },
    OR: [] as any[],
  };
  if (recipeData.cuisineId) {
    relatedWhere.OR.push({ cuisineId: recipeData.cuisineId });
  }
  if (recipeData.locationId) {
    relatedWhere.OR.push({ locationId: recipeData.locationId });
  }
  if (relatedWhere.OR.length === 0) {
    delete relatedWhere.OR;
  }

  const relatedRecipes = await prisma.recipe.findMany({
    where: relatedWhere,
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      cuisine: { select: { id: true, name: true, slug: true } },
      location: { select: { id: true, name: true, slug: true } },
      // 安全：只获取已审核的翻译
      translations: { where: { locale: { in: locales }, isReviewed: true } },
    },
  });

  const translation =
    locales
      .map((loc) => recipeData.translations.find((item) => item.locale === loc))
      .find(Boolean) || null;

  // 转换为 Recipe 类型
  const recipe: Recipe = {
    schemaVersion: "1.1.0",
    titleZh: translation?.title || recipeData.title,
    titleEn: undefined,
    summary: (translation?.summary as any) || (recipeData.summary as any),
    story: (translation?.story as any) || (recipeData.story as any),
    ingredients:
      (translation?.ingredients as any) || (recipeData.ingredients as any),
    steps: (translation?.steps as any) || (recipeData.steps as any),
    styleGuide:
      (translation?.styleGuide as any) || (recipeData.styleGuide as any),
    imageShots:
      (translation?.imageShots as any) || (recipeData.imageShots as any),
    nutrition: (recipeData.nutrition as any) || undefined,
    faq: (recipeData.faq as any) || undefined,
    tips: (recipeData.tips as any) || undefined,
    troubleshooting: (recipeData.troubleshooting as any) || undefined,
    relatedRecipes: (recipeData.relatedRecipes as any) || undefined,
    pairing: (recipeData.pairing as any) || undefined,
    seo: (recipeData.seo as any) || undefined,
    notes: (recipeData.notes as any) || undefined,
  };

  // 构建步骤图片映射（优先步骤内 imageUrl，其次配图方案）
  const stepImages = (recipe.imageShots || []).reduce<Record<string, string | undefined>>((acc, shot) => {
    const url = (shot as any).imageUrl;
    if (shot.key) {
      acc[shot.key] = url;
      const digits = shot.key.replace(/\D/g, "");
      if (digits) {
        acc[`step${digits}`] = url;
        acc[digits] = url;
      }
    }
    return acc;
  }, {});
  (recipe.steps || []).forEach((step: any) => {
    if (step?.id && step?.imageUrl) {
      stepImages[step.id] = step.imageUrl;
      const digits = String(step.id).replace(/\D/g, "");
      if (digits) {
        stepImages[`step${digits}`] = step.imageUrl;
        stepImages[digits] = step.imageUrl;
      }
    }
  });

  // 封面图 - 收集所有封面图用于轮播
  const coverImages: string[] = [];

  // 优先使用 imageShots 中的封面图
  const coverKeys = ["cover_main", "cover_detail", "cover_inside", "cover", "hero", "final"];
  coverKeys.forEach((key) => {
    if (stepImages[key]) {
      coverImages.push(stepImages[key]!);
    }
  });

  // 如果有 coverImage 字段且不在列表中，添加到开头
  if (recipeData.coverImage && !coverImages.includes(recipeData.coverImage)) {
    coverImages.unshift(recipeData.coverImage);
  }

  // 如果没有封面图，使用第一张步骤图
  if (coverImages.length === 0 && recipe.steps?.[0]) {
    const firstStepImage = (recipe.steps[0] as any).imageUrl;
    if (firstStepImage) {
      coverImages.push(firstStepImage);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <Header />

      {/* 面包屑导航 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-textGray">
          <LocalizedLink href="/" className="hover:text-brownWarm transition-colors">
            <Home className="w-4 h-4" />
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <LocalizedLink href="/recipe" className="hover:text-brownWarm transition-colors">
            {locale === "en" ? "Recipes" : "食谱"}
          </LocalizedLink>
          {cuisineName && cuisineHref && (
            <>
              <ChevronRight className="w-4 h-4" />
              <LocalizedLink
                href={cuisineHref}
                className="hover:text-brownWarm transition-colors"
              >
                {cuisineName}
              </LocalizedLink>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark truncate max-w-[200px]">
            {recipe.titleZh}
          </span>
        </nav>
      </div>

      {version === "v2" ? (
        <RecipeDetailClientV2
          recipe={recipe}
          coverImages={coverImages}
          stepImages={stepImages}
        />
      ) : (
        <RecipeDetailClient
          recipe={recipe}
          coverImage={coverImages[0]}
          stepImages={stepImages}
        />
      )}

      {/* 相关食谱推荐 */}
      {relatedRecipes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-lightGray">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-medium text-textDark">
              {locale === "en" ? "Related Recipes" : "相关食谱推荐"}
            </h2>
            <LocalizedLink
              href={cuisineHref || "/recipe"}
              className="text-brownWarm hover:underline text-sm"
            >
              {locale === "en"
                ? `More ${cuisineName || "recipes"} →`
                : `查看更多 ${cuisineName || "食谱"} →`}
            </LocalizedLink>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedRecipes.map((related) => {
              const relatedTranslation =
                locales
                  .map((loc) =>
                    related.translations.find((item: { locale: string }) => item.locale === loc)
                  )
                  .find(Boolean) || null;
              return (
              <RecipeCard
                key={related.id}
                id={related.id}
                slug={related.slug}
                titleZh={relatedTranslation?.title || related.title}
                title={relatedTranslation?.title || related.title}
                summary={(relatedTranslation?.summary as any) || (related.summary as any)}
                location={related.location?.name || null}
                cuisine={related.cuisine?.name || null}
                aiGenerated={related.aiGenerated}
                coverImage={related.coverImage}
                aspectClass="aspect-[4/3]"
              />
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
