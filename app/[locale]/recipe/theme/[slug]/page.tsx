/**
 * 主题聚合页
 *
 * 路由：/[locale]/recipe/theme/[slug]
 * 展示特定主题的食谱列表（如：家常菜、下饭菜、减脂餐等）
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { getContentLocales } from "@/lib/i18n/content";
import { localizePath } from "@/lib/i18n/utils";
import { buildRuleWhereClause } from "@/lib/collection/rule-engine";
import type { RuleConfig, SeoConfig } from "@/lib/types/collection";
import type { Locale } from "@/lib/i18n/config";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import Link from "next/link";

interface ThemePageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const FALLBACK_ASPECTS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[1/1]"];

export async function generateMetadata({
  params,
}: ThemePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  // 优先使用合集名称，其次使用主题标签
  const collection = await prisma.collection.findFirst({
    where: {
      slug,
      type: { in: ["theme", "topic"] },
      status: "published",
    },
    select: { name: true, nameEn: true, seo: true },
  });

  const tag = collection
    ? null
    : await prisma.tag.findFirst({
        where: { slug, type: "theme" },
        select: { name: true },
      });

  const seo = (collection?.seo as SeoConfig) || undefined;
  const themeName =
    (isEn ? seo?.h1En || seo?.titleEn : seo?.h1Zh || seo?.titleZh) ||
    (collection
      ? isEn
        ? collection.nameEn || collection.name
        : collection.name
      : tag?.name || decodeURIComponent(slug));

  return {
    title:
      (isEn ? seo?.titleEn : seo?.titleZh) ||
      (isEn
        ? `${themeName} Recipes - Recipe Zen`
        : `${themeName}食谱 - Recipe Zen`),
    description:
      (isEn ? seo?.descriptionEn : seo?.descriptionZh) ||
      (isEn
        ? `Explore ${themeName} recipes, curated for home cooking.`
        : `精选${themeName}相关食谱，家常易做。`),
    keywords: seo?.keywords,
    robots: seo?.noIndex ? { index: false, follow: true } : undefined,
  };
}

export default async function ThemePage({
  params,
  searchParams,
}: ThemePageProps) {
  const { locale, slug } = await params;
  const locales = getContentLocales(locale);
  const isEn = locale === "en";
  const queryParams = await searchParams;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;

  // 优先使用合集配置
  const collection = await prisma.collection.findFirst({
    where: {
      slug,
      type: { in: ["theme", "topic"] },
      status: "published",
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      descriptionEn: true,
      seo: true,
      rules: true,
      cuisineId: true,
      locationId: true,
      tagId: true,
      pinnedRecipeIds: true,
      excludedRecipeIds: true,
    },
  });

  const tag = collection
    ? null
    : await prisma.tag.findFirst({
        where: { slug, type: "theme" },
        include: {
          translations: { where: { locale: { in: locales } } },
        },
      });

  if (!collection && !tag) notFound();

  const translation = tag?.translations.find((t) => t.locale === locale);
  const seo = (collection?.seo as SeoConfig) || undefined;
  const themeName = collection
    ? (isEn ? seo?.h1En || collection.nameEn || collection.name : seo?.h1Zh || collection.name)
    : isEn
      ? seo?.h1En || translation?.name || tag!.name
      : seo?.h1Zh || tag!.name;
  const subtitle =
    (isEn ? seo?.subtitleEn : seo?.subtitleZh) ||
    (collection?.description || collection?.descriptionEn
      ? isEn
        ? collection.descriptionEn || collection.description
        : collection.description || collection.descriptionEn
      : null);
  const footerText = isEn ? seo?.footerTextEn : seo?.footerTextZh;

  const baseWhere = collection
    ? buildRuleWhereClause(collection.rules as RuleConfig, {
        cuisineId: collection.cuisineId,
        locationId: collection.locationId,
        tagId: collection.tagId,
        excludedRecipeIds: collection.excludedRecipeIds,
      })
    : {
        tags: { some: { tagId: tag!.id } },
      };

  const pinnedIds = collection?.pinnedRecipeIds || [];
  const excludedIds = collection?.excludedRecipeIds || [];
  const matchWhere =
    pinnedIds.length > 0
      ? {
          AND: [
            { OR: [baseWhere, { id: { in: pinnedIds } }] },
            excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {},
          ],
        }
      : baseWhere;

  const hasPinned = page === 1 && pinnedIds.length > 0;
  const mainLimit = hasPinned ? Math.max(0, limit - pinnedIds.length) : limit;
  const mainWhere = hasPinned
    ? { AND: [matchWhere, { id: { notIn: pinnedIds } }, { status: "published" }] }
    : { AND: [matchWhere, { status: "published" }] };

  const pinnedWhere = hasPinned
    ? { AND: [{ id: { in: pinnedIds } }, { status: "published" }] }
    : null;

  const [pinnedRecipes, mainRecipes, total] = await Promise.all([
    hasPinned
      ? prisma.recipe.findMany({
          where: pinnedWhere!,
          include: {
            cuisine: { select: { id: true, name: true, slug: true } },
            location: { select: { id: true, name: true, slug: true } },
            translations: { where: { locale: { in: locales }, isReviewed: true } },
          },
        })
      : Promise.resolve([]),
    mainLimit > 0
      ? prisma.recipe.findMany({
          where: mainWhere,
          orderBy: { createdAt: "desc" },
          skip: hasPinned ? 0 : (page - 1) * limit,
          take: mainLimit,
          include: {
            cuisine: { select: { id: true, name: true, slug: true } },
            location: { select: { id: true, name: true, slug: true } },
            translations: { where: { locale: { in: locales }, isReviewed: true } },
          },
        })
      : Promise.resolve([]),
    prisma.recipe.count({ where: { AND: [matchWhere, { status: "published" }] } }),
  ]);

  const sortedPinned = hasPinned
    ? pinnedIds
        .map((id) => pinnedRecipes.find((recipe) => recipe.id === id))
        .filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== undefined)
    : [];

  const recipes = [...sortedPinned, ...mainRecipes];

  const totalPages = Math.ceil(total / limit);
  const buildPageUrl = (pageNum: number) =>
    `${localizePath(`/recipe/theme/${slug}`, locale)}?page=${pageNum}`;

  return (
    <div className="min-h-screen bg-cream">
      {collection && <PageViewTracker collectionId={collection.id} />}
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
            <span className="text-textDark">{themeName}</span>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-textDark">
              {themeName}
            </h1>
          </div>
          <p className="text-textGray text-lg max-w-3xl">
            {subtitle ||
              (isEn
                ? `${themeName} recipes, curated for home cooking.`
                : `${themeName}相关食谱合集，适合家庭烹饪。`)}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {recipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Sparkles className="w-16 h-16 mx-auto text-textGray/30 mb-4" />
            <p className="text-textGray text-lg mb-6">
              {isEn ? "No recipes found yet." : "暂无相关食谱。"}
            </p>
            <LocalizedLink
              href="/recipe"
              className="px-6 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
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
                const recipeTranslation =
                  locales
                    .map((loc) => recipe.translations.find((item) => item.locale === loc))
                    .find(Boolean) || null;
                const summary = recipe.summary as Record<string, unknown>;
                const aspectClass =
                  FALLBACK_ASPECTS[index % FALLBACK_ASPECTS.length];
                return (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    slug={recipe.slug}
                    titleZh={recipe.title}
                    title={recipeTranslation?.title || recipe.title}
                    summary={(recipeTranslation?.summary as Record<string, unknown>) || summary}
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
                className="px-4 py-2 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition-colors"
              >
                {isEn ? "Prev" : "上一页"}
              </Link>
            )}

            <span className="px-4 py-2 text-amber-600">
              {isEn ? `Page ${page} / ${totalPages}` : `第 ${page} / ${totalPages} 页`}
            </span>

            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-4 py-2 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition-colors"
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
