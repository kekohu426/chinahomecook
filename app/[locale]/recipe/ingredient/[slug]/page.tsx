/**
 * 食材聚合页
 *
 * 路由：/[locale]/recipe/ingredient/[slug]
 * 展示包含特定食材的食谱列表
 *
 * 注意：由于 mainIngredients 字段不存在于新 Schema
 * 暂时通过标题搜索实现（TODO: 实现 ingredients JSON 搜索）
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { getContentLocales } from "@/lib/i18n/content";
import { localizePath } from "@/lib/i18n/utils";
import type { SeoConfig } from "@/lib/types/collection";
import type { Locale } from "@/lib/i18n/config";
import { ChevronRight, Home, Leaf } from "lucide-react";
import Link from "next/link";

interface IngredientPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const FALLBACK_ASPECTS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[1/1]"];

export async function generateMetadata({
  params,
}: IngredientPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const ingredient = decodeURIComponent(slug);
  const locales = getContentLocales(locale);
  const isEn = locale === "en";
  const tag = await prisma.tag.findFirst({
    where: { slug: ingredient, type: "ingredient" },
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });
  const collection = tag
    ? await prisma.collection.findFirst({
        where: {
          type: "ingredient",
          tagId: tag.id,
          status: "published",
        },
        select: { seo: true },
      })
    : null;
  const seo = (collection?.seo as SeoConfig) || undefined;
  const ingredientName = tag
    ? (isEn
        ? tag.translations.find((t) => t.locale === locale)?.name || tag.name
        : tag.name)
    : ingredient;
  return {
    title:
      (isEn ? seo?.titleEn : seo?.titleZh) ||
      (isEn
        ? `${ingredientName} Recipes - Recipe Zen`
        : `${ingredientName}做法 - Recipe Zen`),
    description:
      (isEn ? seo?.descriptionEn : seo?.descriptionZh) ||
      (isEn
        ? `Explore recipes featuring ${ingredientName}.`
        : `精选${ingredientName}相关做法，家常易做。`),
    keywords: seo?.keywords,
    robots: seo?.noIndex ? { index: false, follow: true } : undefined,
  };
}

export default async function IngredientPage({
  params,
  searchParams,
}: IngredientPageProps) {
  const { locale, slug } = await params;
  const ingredient = decodeURIComponent(slug);
  const locales = getContentLocales(locale);
  const isEn = locale === "en";
  const queryParams = await searchParams;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;

  if (!ingredient) notFound();

  // 查找食材标签
  const tag = await prisma.tag.findFirst({
    where: { slug: ingredient, type: "ingredient" },
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });

  // 如果找到标签，使用标签查询；否则回退到标题搜索
  const ingredientName = tag
    ? (isEn ? (tag.translations.find(t => t.locale === locale)?.name || tag.name) : tag.name)
    : decodeURIComponent(ingredient);

  const where = tag
    ? {
        status: "published" as const,
        tags: { some: { tagId: tag.id } },
      }
    : {
        status: "published" as const,
        title: { contains: ingredientName },
      };

  // 获取对应的 Collection 以获取置顶食谱
  const collection = tag
    ? await prisma.collection.findFirst({
        where: {
          type: "ingredient",
          tagId: tag.id,
          status: "published",
        },
        select: {
          pinnedRecipeIds: true,
          seo: true,
        },
      })
    : null;

  const pinnedIds = collection?.pinnedRecipeIds || [];
  const seo = (collection?.seo as SeoConfig) || undefined;
  const headerTitle = isEn
    ? seo?.h1En || ingredientName
    : seo?.h1Zh || ingredientName;
  const headerSubtitle =
    (isEn ? seo?.subtitleEn : seo?.subtitleZh) ||
    (isEn
      ? `Recipes featuring ${ingredientName}, curated for home cooking.`
      : `围绕${ingredientName}的家常做法合集。`);
  const footerText = isEn ? seo?.footerTextEn : seo?.footerTextZh;
  const hasPinnedRecipes = page === 1 && pinnedIds.length > 0;

  // 获取置顶食谱（仅第一页）
  const pinnedRecipes = hasPinnedRecipes
    ? await prisma.recipe.findMany({
        where: { id: { in: pinnedIds }, status: "published" },
        include: {
          cuisine: { select: { id: true, name: true, slug: true } },
          location: { select: { id: true, name: true, slug: true } },
          translations: { where: { locale: { in: locales }, isReviewed: true } },
        },
      })
    : [];

  // 按置顶顺序排序
  const sortedPinnedRecipes = hasPinnedRecipes
    ? pinnedIds
        .map((id) => pinnedRecipes.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
    : [];

  // 计算主列表需要获取的数量
  const mainLimit = hasPinnedRecipes ? Math.max(0, limit - sortedPinnedRecipes.length) : limit;
  const mainWhere = hasPinnedRecipes ? { ...where, id: { notIn: pinnedIds } } : where;

  const [mainRecipesData, total] = await Promise.all([
    mainLimit > 0
      ? prisma.recipe.findMany({
          where: mainWhere,
          orderBy: { createdAt: "desc" },
          skip: hasPinnedRecipes ? 0 : (page - 1) * limit,
          take: mainLimit,
          include: {
            cuisine: { select: { id: true, name: true, slug: true } },
            location: { select: { id: true, name: true, slug: true } },
            translations: { where: { locale: { in: locales }, isReviewed: true } },
          },
        })
      : Promise.resolve([]),
    prisma.recipe.count({ where }),
  ]);

  // 合并置顶和主列表
  const recipes = [...sortedPinnedRecipes, ...mainRecipesData];

  const totalPages = Math.ceil(total / limit);
  const buildPageUrl = (pageNum: number) =>
    `${localizePath(`/recipe/ingredient/${encodeURIComponent(ingredient)}`, locale)}?page=${pageNum}`;

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="bg-white border-b border-cream">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <nav className="flex items-center gap-2 text-sm text-textGray mb-4">
            <LocalizedLink href="/" className="hover:text-brownWarm transition-colors">
              <Home className="w-4 h-4" />
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <LocalizedLink href="/recipe" className="hover:text-brownWarm transition-colors">
              {isEn ? "Recipes" : "食谱"}
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-textDark">{ingredientName}</span>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-textDark">
              {headerTitle}
            </h1>
          </div>
          <p className="text-textGray text-lg max-w-3xl">
            {headerSubtitle}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {recipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Leaf className="w-16 h-16 mx-auto text-textGray/30 mb-4" />
            <p className="text-textGray text-lg mb-6">
              {isEn ? "No recipes found yet." : "暂无相关食谱。"}
            </p>
            <LocalizedLink
              href="/recipe"
              className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            >
              {isEn ? "Browse All Recipes" : "浏览全部食谱"}
            </LocalizedLink>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-medium text-textDark">
                {isEn ? "Latest Recipes" : "最新食谱"} ({total})
              </h2>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 [column-fill:_balance]">
              {recipes.map((recipe, index) => {
                const translation =
                  locales
                    .map((loc) => recipe.translations.find((item) => item.locale === loc))
                    .find(Boolean) || null;
                const summary = recipe.summary as any;
                const aspectClass =
                  FALLBACK_ASPECTS[index % FALLBACK_ASPECTS.length];
                return (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    slug={recipe.slug}
                    titleZh={recipe.title}
                    title={translation?.title || recipe.title}
                    summary={(translation?.summary as any) || summary}
                    location={recipe.location?.name || null}
                    cuisine={recipe.cuisine?.name || null}
                    aiGenerated={recipe.aiGenerated}
                    coverImage={recipe.coverImage}
                    aspectClass={aspectClass}
                  />
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-4 py-2 bg-white border border-sage-200 rounded-lg hover:border-sage-400 transition-colors"
              >
                {isEn ? "Prev" : "上一页"}
              </Link>
            )}

            <span className="px-4 py-2 text-sage-600">
              {isEn ? `Page ${page} / ${totalPages}` : `第 ${page} / ${totalPages} 页`}
            </span>

            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-4 py-2 bg-white border border-sage-200 rounded-lg hover:border-sage-400 transition-colors"
              >
                {isEn ? "Next" : "下一页"}
              </Link>
            )}
          </div>
        )}

        {footerText && (
          <div className="mt-16 bg-white rounded-2xl border border-cream p-6 text-sm text-textGray leading-relaxed">
            {footerText}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
