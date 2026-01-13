/**
 * 场景聚合页（升级版）
 *
 * 路由：/[locale]/recipe/scene/[slug]
 * 展示特定场景的食谱列表，包含 Hero、精选推荐、相关场景
 *
 * 注意：Scene 模型已迁移到 Tag 模型，type = "scene"
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
import {
  ChevronRight,
  Home,
  Clock,
  ChefHat,
  Sparkles,
  Utensils,
} from "lucide-react";

interface ScenePageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// 场景图标映射
const SCENE_ICONS: Record<string, string> = {
  "quick-meal": "⚡",
  "family-dinner": "👨‍👩‍👧‍👦",
  "party": "🎉",
  "holiday": "🎊",
  "romantic": "💕",
  "brunch": "🌅",
  "picnic": "🧺",
  "bbq": "🔥",
  "comfort-food": "🏠",
  "healthy": "🥗",
};

// 从数据库获取场景信息（现在是 Tag 模型）
async function getSceneFromDB(slug: string, locales: string[]) {
  const scene = await prisma.tag.findFirst({
    where: { slug, type: "scene" },
    include: {
      translations: {
        where: { locale: { in: locales } },
      },
    },
  });
  if (!scene || !scene.isActive) return null;
  return scene;
}

export async function generateMetadata({
  params,
}: ScenePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const locales = getContentLocales(locale);
  const scene = await getSceneFromDB(slug, locales);
  if (!scene) return { title: "Not Found" };

  const isEn = locale === "en";
  const translation = locales
    .map((loc) => scene.translations.find((t) => t.locale === loc))
    .find(Boolean);
  const name = translation?.name || scene.name;

  return {
    title: isEn
      ? `${name} Recipes - Recipe Zen`
      : `${name}食谱大全 - Recipe Zen`,
    description: isEn
      ? `Discover perfect ${name.toLowerCase()} recipes. Step-by-step guides for every cooking moment.`
      : `精选${name}相关食谱，步骤详细，适合各种烹饪场景。`,
    alternates: {
      canonical: `/${locale}/recipe/scene/${slug}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((loc) => [loc, `/${loc}/recipe/scene/${slug}`])
      ),
    },
  };
}

export default async function ScenePage({
  params,
  searchParams,
}: ScenePageProps) {
  const { locale, slug } = await params;
  const locales = getContentLocales(locale);
  const queryParams = await searchParams;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;

  const scene = await getSceneFromDB(slug, locales);
  if (!scene) notFound();

  const isEn = locale === "en";
  const translation = locales
    .map((loc) => scene.translations.find((t) => t.locale === loc))
    .find(Boolean);
  const sceneName = translation?.name || scene.name;
  // Tag model doesn't have description, use empty string
  const sceneDescription = "";
  const sceneIcon = SCENE_ICONS[slug] || "🍽️";

  // 通过 RecipeTag 关联查询食谱
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        status: "published",
        tags: {
          some: {
            tag: { slug, type: "scene" },
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
            tag: { slug, type: "scene" },
          },
        },
      },
    }),
  ]);

  // Hero 代表菜品
  const heroRecipe = recipes[0] || null;

  // 精选菜品（仅首页且有足够食谱时显示）
  const showFeatured = page === 1 && recipes.length >= 4;
  const featuredRecipes = showFeatured ? recipes.slice(0, 4) : [];
  const mainRecipes = showFeatured ? recipes.slice(4) : recipes;

  // 相关场景（从 Tag 模型获取）
  const relatedScenes = await prisma.tag.findMany({
    where: { type: "scene", isActive: true, slug: { not: slug } },
    orderBy: { sortOrder: "asc" },
    take: 6,
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });

  const totalPages = Math.ceil(total / limit);

  // 分页 URL
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    return `/${locale}/recipe/scene/${slug}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-emerald-700/90 via-emerald-600/80 to-teal-500/70 overflow-hidden">
        {/* 背景图 */}
        {heroRecipe?.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={heroRecipe.coverImage}
              alt={sceneName}
              fill
              className="object-cover opacity-25"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-800/90 via-emerald-700/70 to-transparent" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-8 py-16 lg:py-20">
          {/* 面包屑 */}
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
              {isEn ? "Recipes" : "食谱"}
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{sceneName}</span>
          </nav>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{sceneIcon}</span>
                <h1 className="text-4xl lg:text-5xl font-serif font-medium text-white">
                  {sceneName}
                  {isEn ? " Recipes" : "食谱"}
                </h1>
              </div>

              <p className="text-white/90 text-lg leading-relaxed max-w-2xl mb-6">
                {sceneDescription ||
                  (isEn
                    ? `Discover perfect recipes for ${sceneName.toLowerCase()}. Curated collection with step-by-step instructions.`
                    : `精选${sceneName}相关食谱，步骤详细，让每个烹饪时刻都充满美味。`)}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm">
                  <Utensils className="w-4 h-4" />
                  {isEn ? `${total} recipes` : `共 ${total} 道菜谱`}
                </span>
                <LocalizedLink
                  href="/ai-custom"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-full text-sm font-medium hover:bg-cream transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {isEn ? "AI Custom" : "AI 定制"}
                </LocalizedLink>
              </div>
            </div>

            {/* 代表菜品预览 */}
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
                  {isEn ? "Top Picks" : "精选推荐"}
                </h2>
                <p className="text-sm text-textGray mt-1">
                  {isEn
                    ? "Most popular recipes for this occasion"
                    : "最受欢迎的场景食谱"}
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
                const displayTitle = recipeTranslation?.title || recipe.title;
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
                      <h3 className="font-medium text-textDark text-sm group-hover:text-emerald-600 line-clamp-1">
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-textGray">
                        {summary?.timeTotalMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {summary.timeTotalMin}
                            {isEn ? "min" : "分钟"}
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
              {isEn
                ? "No recipes found for this scene yet"
                : "暂无该场景食谱"}
            </p>
            <div className="flex justify-center gap-4">
              <LocalizedLink
                href="/ai-custom"
                className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
              >
                {isEn ? "Try AI Custom" : "试试 AI 定制"}
              </LocalizedLink>
              <LocalizedLink
                href="/recipe"
                className="px-6 py-3 border border-emerald-600 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-colors"
              >
                {isEn ? "Browse All" : "浏览全部食谱"}
              </LocalizedLink>
            </div>
          </div>
        ) : (
          <>
            {/* 全部食谱 */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif font-medium text-textDark">
                  {isEn ? "All Recipes" : "全部食谱"}
                </h2>
                <p className="text-sm text-textGray mt-1">
                  {isEn ? `${total} dishes found` : `共找到 ${total} 道菜谱`}
                </p>
              </div>
            </div>

            {/* 食谱网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mainRecipes.map((recipe) => {
                const recipeTranslation = locales
                  .map((loc) =>
                    recipe.translations.find((t) => t.locale === loc)
                  )
                  .find(Boolean);
                const summary = recipe.summary as any;
                const displayTitle = recipeTranslation?.title || recipe.title;
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
                      <h3 className="font-medium text-textDark group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {displayTitle}
                      </h3>
                      {summary?.tagline && (
                        <p className="text-sm text-textGray mt-1 line-clamp-1">
                          {summary.tagline}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {summary?.timeTotalMin && (
                          <span className="flex items-center gap-1 text-xs text-textGray">
                            <Clock className="w-3 h-3" />
                            {summary.timeTotalMin} {isEn ? "min" : "分钟"}
                          </span>
                        )}
                        {summary?.difficulty && (
                          <span className="text-xs text-textGray">
                            {summary.difficulty === "easy"
                              ? isEn
                                ? "Easy"
                                : "简单"
                              : summary.difficulty === "medium"
                              ? isEn
                                ? "Medium"
                                : "中等"
                              : isEn
                              ? "Hard"
                              : "困难"}
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
                className="px-5 py-2.5 bg-white border border-lightGray rounded-lg hover:border-emerald-500 transition-colors"
              >
                {isEn ? "Previous" : "上一页"}
              </Link>
            )}
            <span className="px-4 py-2 text-textGray">
              {isEn
                ? `Page ${page} / ${totalPages}`
                : `第 ${page} / ${totalPages} 页`}
            </span>
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-5 py-2.5 bg-white border border-lightGray rounded-lg hover:border-emerald-500 transition-colors"
              >
                {isEn ? "Next" : "下一页"}
              </Link>
            )}
          </div>
        )}

        {/* 相关场景 */}
        {relatedScenes.length > 0 && (
          <section className="mt-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-serif font-medium text-textDark mb-6">
                {isEn ? "Explore More Scenes" : "探索更多场景"}
              </h2>
              <div className="bg-white rounded-xl border border-lightGray p-5">
                <div className="flex flex-wrap gap-2">
                  {relatedScenes.map((s) => {
                    const t = s.translations.find((t) =>
                      locales.includes(t.locale)
                    );
                    const icon = SCENE_ICONS[s.slug] || "🍽️";
                    return (
                      <LocalizedLink
                        key={s.id}
                        href={`/recipe/scene/${s.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-cream text-sm text-textGray rounded-full hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        <span>{icon}</span>
                        {t?.name || s.name}
                      </LocalizedLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
