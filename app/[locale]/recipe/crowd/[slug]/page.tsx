/**
 * 人群聚合页（升级版）
 *
 * 路由：/[locale]/recipe/crowd/[slug]
 * 展示适合特定人群的食谱列表，包含 Hero、精选推荐、相关人群
 *
 * 注意：Crowd 模型已迁移到 Tag 模型，type = "crowd"
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { getContentLocales } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/config";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import type { SeoConfig } from "@/lib/types/collection";
import { ensureEnglish, titleFromSlug } from "@/lib/i18n/english";
import {
  ChevronRight,
  Home,
  Clock,
  ChefHat,
  Sparkles,
  Users,
} from "lucide-react";

interface CrowdPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// 人群图标映射
const CROWD_ICONS: Record<string, string> = {
  "children": "👶",
  "elderly": "👴",
  "pregnant": "🤰",
  "vegetarian": "🥬",
  "diabetic": "💉",
  "weight-loss": "⚖️",
  "athletes": "🏃",
  "office-workers": "💼",
  "students": "📚",
  "family": "👨‍👩‍👧‍👦",
  "couples": "💑",
  "singles": "🧑",
};

// 从数据库获取人群信息（现在是 Tag 模型）
async function getCrowdFromDB(slug: string, locales: string[]) {
  const crowd = await prisma.tag.findFirst({
    where: { slug, type: "crowd" },
    include: {
      translations: {
        where: { locale: { in: locales } },
      },
    },
  });
  if (!crowd || !crowd.isActive) return null;
  return crowd;
}

export async function generateMetadata({
  params,
}: CrowdPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const locales = getContentLocales(locale);
  const crowd = await getCrowdFromDB(slug, locales);
  if (!crowd) return { title: "Not Found" };

  const isEn = locale === "en";
  const translation = locales
    .map((loc) => crowd.translations.find((t) => t.locale === loc))
    .find(Boolean);
  const name = translation?.name || crowd.name;
  const collection = await prisma.collection.findFirst({
    where: {
      type: "crowd",
      tagId: crowd.id,
      status: "published",
    },
    select: { seo: true },
  });
  const seo = (collection?.seo as SeoConfig) || undefined;
  const metaTitleFallback = t("recipe.crowd.metaTitle", locale).replace(
    "{name}",
    name
  );
  const metaDescriptionFallback = t("recipe.crowd.metaDescription", locale).replace(
    "{name}",
    isEn ? name.toLowerCase() : name
  );

  return {
    title:
      (isEn ? ensureEnglish(seo?.titleEn, "") : seo?.titleZh) ||
      metaTitleFallback,
    description:
      (isEn ? ensureEnglish(seo?.descriptionEn, "") : seo?.descriptionZh) ||
      metaDescriptionFallback,
    keywords: seo?.keywords,
    robots: seo?.noIndex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: `/${locale}/recipe/crowd/${slug}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, `/${loc}/recipe/crowd/${slug}`])
      ),
    },
  };
}

export default async function CrowdPage({
  params,
  searchParams,
}: CrowdPageProps) {
  const { locale, slug } = await params;
  const locales = getContentLocales(locale);
  const queryParams = await searchParams;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;

  const crowd = await getCrowdFromDB(slug, locales);
  if (!crowd) notFound();

  const isEn = locale === "en";
  const translation = locales
    .map((loc) => crowd.translations.find((t) => t.locale === loc))
    .find(Boolean);
  const crowdNameRaw = translation?.name || crowd.name;
  const crowdName = isEn
    ? ensureEnglish(crowdNameRaw, ensureEnglish(titleFromSlug(slug), "Crowd"))
    : crowdNameRaw;
  // Tag model doesn't have description, use empty string
  const crowdDescription = "";
  const crowdIcon = CROWD_ICONS[slug] || "👥";
  const collection = await prisma.collection.findFirst({
    where: {
      type: "crowd",
      tagId: crowd.id,
      status: "published",
    },
    select: { seo: true },
  });
  const seo = (collection?.seo as SeoConfig) || undefined;
  const crowdNameDescription = isEn ? crowdName.toLowerCase() : crowdName;
  const headerTitle = isEn
    ? ensureEnglish(seo?.h1En, "") ||
      t("recipe.crowd.headerTitle", locale).replace("{name}", crowdName)
    : seo?.h1Zh ||
      t("recipe.crowd.headerTitle", locale).replace("{name}", crowdName);
  const headerSubtitle =
    (isEn ? ensureEnglish(seo?.subtitleEn, "") : seo?.subtitleZh) ||
    (crowdDescription ||
      t("recipe.crowd.headerSubtitle", locale).replace(
        "{name}",
        crowdNameDescription
      ));
  const footerText = isEn ? ensureEnglish(seo?.footerTextEn, "") : seo?.footerTextZh;

  // 通过 RecipeTag 关联查询食谱
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        status: "published",
        tags: {
          some: {
            tag: { slug, type: "crowd" },
          },
        },
      },
      orderBy: { viewCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        translations: { where: { locale: { in: locales }, isReviewed: true } },
      },
    }),
    prisma.recipe.count({
      where: {
        status: "published",
        tags: {
          some: {
            tag: { slug, type: "crowd" },
          },
        },
      },
    }),
  ]);

  // Hero 代表菜品
  const heroRecipe = recipes[0] || null;

  // 精选菜品
  const showFeatured = page === 1 && recipes.length >= 4;
  const featuredRecipes = showFeatured ? recipes.slice(0, 4) : [];
  const mainRecipes = showFeatured ? recipes.slice(4) : recipes;

  // 相关人群（从 Tag 模型获取）
  const relatedCrowds = await prisma.tag.findMany({
    where: { type: "crowd", isActive: true, slug: { not: slug } },
    orderBy: { sortOrder: "asc" },
    take: 6,
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });

  const totalPages = Math.ceil(total / limit);

  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    return `/${locale}/recipe/crowd/${slug}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-sky-600/90 via-sky-500/80 to-cyan-400/70 overflow-hidden">
        {heroRecipe?.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={heroRecipe.coverImage}
              alt={crowdName}
              fill
              className="object-cover opacity-25"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-sky-700/90 via-sky-600/70 to-transparent" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-8 py-16 lg:py-20">
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
            <LocalizedLink
              href="/"
              className="hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <LocalizedLink
              href="/recipe"
              className="hover:text-white transition-colors"
            >
              {t("nav.recipes", locale)}
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{crowdName}</span>
          </nav>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{crowdIcon}</span>
                <h1 className="text-4xl lg:text-5xl font-serif font-medium text-white">
                  {headerTitle}
                </h1>
              </div>

              <p className="text-white/90 text-lg leading-relaxed max-w-2xl mb-6">
                {headerSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm">
                  <Users className="w-4 h-4" />
                  {t("common.recipesCount", locale).replace("{count}", String(total))}
                </span>
                <LocalizedLink
                  href="/ai-custom"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sky-600 rounded-full text-sm font-medium hover:bg-cream transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {t("common.aiCustom", locale)}
                </LocalizedLink>
              </div>
            </div>

            {heroRecipe?.coverImage && (
              <div className="hidden lg:block">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <Image
                    src={heroRecipe.coverImage}
                    alt={heroRecipe.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white font-medium">
                      {heroRecipe.title}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 精选推荐 */}
      {showFeatured && featuredRecipes.length > 0 && (
        <section className="py-12 bg-white border-b border-cream">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-medium text-textDark">
                  {t("common.signaturePicks", locale)}
                </h2>
                <p className="text-sm text-textGray mt-1">
                  {t("common.popularDishes", locale)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredRecipes.map((recipe) => {
                const recipeTranslation = locales
                  .map((loc) =>
                    recipe.translations.find((t) => t.locale === loc)
                  )
                  .find(Boolean);
                const summary = recipe.summary as any;
                const rawTitle = recipeTranslation?.title || recipe.title;
                const displayTitle = isEn
                  ? ensureEnglish(rawTitle, "Recipe")
                  : rawTitle;
                return (
                  <LocalizedLink
                    key={recipe.id}
                    href={`/recipe/${recipe.slug || recipe.id}`}
                    className="group bg-cream rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-lightGray">
                      {recipe.coverImage ? (
                        <Image
                          src={recipe.coverImage}
                          alt={displayTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-textGray">
                          <ChefHat className="w-10 h-10 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-textDark text-sm group-hover:text-sky-600 line-clamp-1">
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-textGray">
                        {summary?.timeTotalMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {summary.timeTotalMin}
                            {t("recipe.min", locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {recipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <ChefHat className="w-16 h-16 mx-auto text-textGray/30 mb-4" />
            <p className="text-textGray text-lg mb-6">
              {t("common.noRecipesYet", locale)}
            </p>
            <div className="flex justify-center gap-4">
              <LocalizedLink
                href="/ai-custom"
                className="px-6 py-3 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition-colors"
              >
                {t("common.tryAiCustom", locale)}
              </LocalizedLink>
              <LocalizedLink
                href="/recipe"
                className="px-6 py-3 border border-sky-600 text-sky-600 rounded-full hover:bg-sky-600 hover:text-white transition-colors"
              >
                {t("common.browseAll", locale)}
              </LocalizedLink>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif font-medium text-textDark">
                  {t("common.allRecipes", locale)}
                </h2>
                <p className="text-sm text-textGray mt-1">
                  {t("common.recipesFound", locale).replace("{count}", String(total))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mainRecipes.map((recipe) => {
                const recipeTranslation = locales
                  .map((loc) =>
                    recipe.translations.find((t) => t.locale === loc)
                  )
                  .find(Boolean);
                const summary = recipe.summary as any;
                const rawTitle = recipeTranslation?.title || recipe.title;
                const displayTitle = isEn
                  ? ensureEnglish(rawTitle, "Recipe")
                  : rawTitle;
                return (
                  <LocalizedLink
                    key={recipe.id}
                    href={`/recipe/${recipe.slug || recipe.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-lightGray">
                      {recipe.coverImage ? (
                        <Image
                          src={recipe.coverImage}
                          alt={displayTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-textGray">
                          <ChefHat className="w-12 h-12 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-textDark group-hover:text-sky-600 transition-colors line-clamp-1">
                        {displayTitle}
                      </h3>
                      {summary?.tagline && (
                        <p className="text-sm text-textGray mt-1 line-clamp-1">
                          {isEn ? ensureEnglish(summary.tagline, "") : summary.tagline}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {summary?.timeTotalMin && (
                          <span className="flex items-center gap-1 text-xs text-textGray">
                            <Clock className="w-3 h-3" />
                            {summary.timeTotalMin} {t("recipe.min", locale)}
                          </span>
                        )}
                        {summary?.difficulty && (
                          <span className="text-xs text-textGray">
                            {summary.difficulty === "easy"
                              ? t("recipe.easy", locale)
                              : summary.difficulty === "medium"
                              ? t("recipe.medium", locale)
                              : t("recipe.hard", locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          </>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-5 py-2.5 bg-white border border-lightGray rounded-lg hover:border-sky-500 transition-colors"
              >
                {t("common.previous", locale)}
              </Link>
            )}
            <span className="px-4 py-2 text-textGray">
              {t("common.pageOf", locale).replace("{current}", String(page)).replace("{total}", String(totalPages))}
            </span>
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-5 py-2.5 bg-white border border-lightGray rounded-lg hover:border-sky-500 transition-colors"
              >
                {t("common.nextPage", locale)}
              </Link>
            )}
          </div>
        )}

        {/* 相关人群 */}
        {relatedCrowds.length > 0 && (
          <section className="mt-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-serif font-medium text-textDark mb-6">
                {t("common.exploreMore", locale)}
              </h2>
              <div className="bg-white rounded-xl border border-lightGray p-5">
                <div className="flex flex-wrap gap-2">
                  {relatedCrowds.map((c) => {
                    const trans = c.translations.find((tr) =>
                      locales.includes(tr.locale)
                    );
                    const relatedNameRaw = trans?.name || c.name;
                    const relatedName = isEn
                      ? ensureEnglish(
                          relatedNameRaw,
                          ensureEnglish(titleFromSlug(c.slug), "Crowd")
                        )
                      : relatedNameRaw;
                    const icon = CROWD_ICONS[c.slug] || "👥";
                    return (
                      <LocalizedLink
                        key={c.id}
                        href={`/recipe/crowd/${c.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-cream text-sm text-textGray rounded-full hover:bg-sky-600 hover:text-white transition-colors"
                      >
                        <span>{icon}</span>
                        {relatedName}
                      </LocalizedLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {footerText && (
          <section className="mt-12">
            <div className="bg-white rounded-2xl border border-cream p-6 text-sm text-textGray leading-relaxed">
              {footerText}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
