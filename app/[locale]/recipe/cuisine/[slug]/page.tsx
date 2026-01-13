/**
 * 菜系聚合页（重新设计版）
 *
 * 路由：/[locale]/recipe/cuisine/[slug]
 * 展示特定菜系的食谱列表 + SEO 内容块（导读/FAQ/内链）
 */

import { notFound } from "next/navigation";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";
import {
  ChevronRight,
  Home,
  ChevronDown,
  Clock,
  ChefHat,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

interface CuisinePageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{
    location?: string;
    region?: string;
    cuisine?: string;
    ingredient?: string;
    page?: string;
    // 标签筛选
    scene?: string;
    method?: string;
    taste?: string;
    crowd?: string;
    occasion?: string;
  }>;
}

// 获取菜系信息
async function getCuisineData(slug: string, locale: Locale) {
  const locales = getContentLocales(locale);

  const cuisine = await prisma.cuisine.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });

  if (!cuisine || !cuisine.isActive) {
    return null;
  }

  // TODO: CuisineSeoBlock 模型在新 Schema 中不存在
  // 需要后续添加 SEO 内容块支持
  const seoBlock = null;

  return { cuisine, seoBlock };
}

// 解析地点参数
async function resolveLocationFilter(location: string): Promise<string | null> {
  const bySlug = await prisma.location.findUnique({
    where: { slug: location },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const byName = await prisma.location.findFirst({
    where: { name: location },
    select: { id: true },
  });
  if (byName) return byName.id;

  return null;
}

export async function generateMetadata({
  params,
  searchParams,
}: CuisinePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const queryParams = await searchParams;
  const locationParam = queryParams.location || queryParams.region;
  // 检查所有筛选参数，包括标签筛选
  const hasFilters = locationParam || queryParams.ingredient || queryParams.cuisine ||
    queryParams.scene || queryParams.method || queryParams.taste ||
    queryParams.crowd || queryParams.occasion;

  const data = await getCuisineData(slug, locale);
  if (!data) return { title: "Not Found" };

  const { cuisine, seoBlock } = data;
  const isEn = locale === "en";

  const cuisineTranslation = cuisine.translations.find((t) => t.locale === locale);
  const cuisineName = cuisineTranslation?.name || cuisine.name;

  // 筛选页：noindex + canonical
  if (hasFilters) {
    return {
      title: `${cuisineName}${isEn ? " Recipes" : "菜谱"}`,
      robots: { index: false, follow: true },
      alternates: {
        canonical: `/${locale}/recipe/cuisine/${slug}`,
      },
    };
  }

  // 默认模板（SEO 内容块功能待实现）
  return {
    title: isEn
      ? `${cuisineName} Recipes - Recipe Zen`
      : `${cuisineName}菜谱大全 - Recipe Zen`,
    description: isEn
      ? `Explore authentic ${cuisineName} recipes with step-by-step instructions.`
      : `精选${cuisineName}做法大全，新手友好，步骤详解。`,
  };
}

export default async function CuisinePage({
  params,
  searchParams,
}: CuisinePageProps) {
  const { locale, slug } = await params;
  const locales = getContentLocales(locale);
  const queryParams = await searchParams;
  const locationParam = queryParams.location || queryParams.region;
  const ingredient = queryParams.ingredient;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;

  const data = await getCuisineData(slug, locale);
  if (!data) notFound();

  const { cuisine, seoBlock } = data;
  const isEn = locale === "en";

  const cuisineTranslation = cuisine.translations.find((t) => t.locale === locale);
  const cuisineName = cuisineTranslation?.name || cuisine.name;

  // 查询条件
  const where: any = {
    status: "published",
    cuisineId: cuisine.id,
  };

  if (locationParam) {
    const locationId = await resolveLocationFilter(locationParam);
    if (locationId) {
      where.locationId = locationId;
    }
  }

  if (ingredient) {
    // TODO: 食材搜索需要通过 ingredients JSON 字段实现
    // 暂时通过标题搜索
    const ingredients = ingredient.split(",").map((i) => i.trim()).filter(Boolean);
    if (ingredients.length > 0) {
      where.title = { contains: ingredients[0] };
    }
  }

  // 获取对应的 Collection 以获取置顶食谱
  const collection = await prisma.collection.findFirst({
    where: {
      type: "cuisine",
      cuisineId: cuisine.id,
      status: "published",
    },
    select: {
      pinnedRecipeIds: true,
    },
  });

  const pinnedIds = collection?.pinnedRecipeIds || [];
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

  // 获取食谱
  const [mainRecipesData, total] = await Promise.all([
    mainLimit > 0
      ? prisma.recipe.findMany({
          where: mainWhere,
          orderBy: { viewCount: "desc" },
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

  // 获取代表菜品（用于Hero背景）
  const heroRecipe = recipes[0] || null;

  // 精选菜品（仅首页且有足够食谱时显示）
  const showFeatured = page === 1 && recipes.length >= 4;
  const featuredRecipes = showFeatured ? recipes.slice(0, 4) : [];
  const mainRecipes = showFeatured ? recipes.slice(4) : recipes;

  // 相关菜系（自动获取）
  const relatedCuisines = await prisma.cuisine.findMany({
    where: { isActive: true, slug: { not: slug } },
    orderBy: { sortOrder: "asc" },
    take: 6,
    include: {
      translations: { where: { locale: { in: locales } } },
    },
  });

  // TODO: BlogPost 模型在新 Schema 中不存在
  // 相关博客功能待实现
  const relatedBlogs: { slug: string; title: string }[] = [];

  const totalPages = Math.ceil(total / limit);

  // 分页 URL
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    if (locationParam) params.set("location", locationParam);
    if (ingredient) params.set("ingredient", ingredient);
    return `/${locale}/recipe/cuisine/${slug}?${params.toString()}`;
  };

  // 相关链接
  const cuisineLinks = relatedCuisines.map((c) => {
    const t = c.translations.find((t) => locales.includes(t.locale));
    return { title: t?.name || c.name, url: `/recipe/cuisine/${c.slug}` };
  });

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-brownWarm/90 via-brownWarm/80 to-orangeAccent/70 overflow-hidden">
        {/* 背景图 */}
        {heroRecipe?.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={heroRecipe.coverImage}
              alt={cuisineName}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brownWarm/90 via-brownWarm/70 to-transparent" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-8 py-16 lg:py-20">
          {/* 面包屑 */}
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
            <LocalizedLink href="/" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <LocalizedLink href="/recipe" className="hover:text-white transition-colors">
              {isEn ? "Recipes" : "食谱"}
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{cuisineName}</span>
          </nav>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-medium text-white mb-4">
                {cuisineName}{isEn ? " Recipes" : "菜谱"}
              </h1>

              <p className="text-white/90 text-lg mb-6">
                {isEn
                  ? `Explore authentic ${cuisineName} recipes with step-by-step instructions.`
                  : `精选${cuisineName}家常做法，步骤详细，新手友好。`}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm">
                  <ChefHat className="w-4 h-4" />
                  {isEn ? `${total} recipes` : `共 ${total} 道菜谱`}
                </span>
                <LocalizedLink
                  href="/ai-custom"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brownWarm rounded-full text-sm font-medium hover:bg-cream transition-colors"
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
                    <p className="text-white font-medium">{heroRecipe.title}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 精选推荐（仅首页且有足够食谱） */}
      {showFeatured && featuredRecipes.length > 0 && (
        <section className="py-12 bg-white border-b border-cream">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-medium text-textDark">
                  {isEn ? "Signature Picks" : "本菜系精选"}
                </h2>
                <p className="text-sm text-textGray mt-1">
                  {isEn ? "Most popular dishes to start with" : "最受欢迎的代表菜"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredRecipes.map((recipe) => {
                const translation = locales
                  .map((loc) => recipe.translations.find((t) => t.locale === loc))
                  .find(Boolean);
                const summary = recipe.summary as any;
                const displayTitle = translation?.title || recipe.title;
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
                      <h3 className="font-medium text-textDark text-sm group-hover:text-brownWarm line-clamp-1">
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-textGray">
                        {summary?.timeTotalMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {summary.timeTotalMin}{isEn ? "min" : "分钟"}
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
              {isEn ? "No recipes found for this cuisine yet" : "暂无该菜系食谱"}
            </p>
            <div className="flex justify-center gap-4">
              <LocalizedLink
                href="/ai-custom"
                className="px-6 py-3 bg-brownWarm text-white rounded-full hover:bg-brownDark transition-colors"
              >
                {isEn ? "Try AI Custom" : "试试 AI 定制"}
              </LocalizedLink>
              <LocalizedLink
                href="/recipe"
                className="px-6 py-3 border border-brownWarm text-brownWarm rounded-full hover:bg-brownWarm hover:text-white transition-colors"
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
                const translation = locales
                  .map((loc) => recipe.translations.find((t) => t.locale === loc))
                  .find(Boolean);
                const summary = recipe.summary as any;
                const displayTitle = translation?.title || recipe.title;
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
                      <h3 className="font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-1">
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
                              ? isEn ? "Easy" : "简单"
                              : summary.difficulty === "medium"
                              ? isEn ? "Medium" : "中等"
                              : isEn ? "Hard" : "困难"}
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
                className="px-5 py-2.5 bg-white border border-lightGray rounded-lg hover:border-brownWarm transition-colors"
              >
                {isEn ? "Previous" : "上一页"}
              </Link>
            )}
            <span className="px-4 py-2 text-textGray">
              {isEn ? `Page ${page} / ${totalPages}` : `第 ${page} / ${totalPages} 页`}
            </span>
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-5 py-2.5 bg-white border border-lightGray rounded-lg hover:border-brownWarm transition-colors"
              >
                {isEn ? "Next" : "下一页"}
              </Link>
            )}
          </div>
        )}

        {/* 相关菜系 */}
        {cuisineLinks.length > 0 && (
          <section className="mt-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-serif font-medium text-textDark mb-6">
                {isEn ? "Explore More" : "探索更多"}
              </h2>
              <div className="bg-white rounded-xl border border-lightGray p-5">
                <h3 className="text-base font-medium text-textDark mb-3">
                  {isEn ? "Other Cuisines" : "其他菜系"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cuisineLinks.slice(0, 6).map((link, index) => (
                    <LocalizedLink
                      key={index}
                      href={link.url}
                      className="px-3 py-1.5 bg-cream text-sm text-textGray rounded-full hover:bg-brownWarm hover:text-white transition-colors"
                    >
                      {link.title}
                    </LocalizedLink>
                  ))}
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
