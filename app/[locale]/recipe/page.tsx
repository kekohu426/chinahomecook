/**
 * 一级聚合页 - 食谱列表
 *
 * 路由：/recipe
 * 功能：
 * - 模块1：页面标题区（H1 + 副标题）
 * - 模块2：按菜系浏览
 * - 模块3：按场景浏览
 * - 模块4：按食材浏览（可选）
 * - 模块5：最新/热门食谱列表（支持置顶）
 * - 模块6：底部收口文案（SEO）
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { prisma } from "@/lib/db/prisma";
import { FilterBar } from "@/components/filter/FilterBar";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Locale } from "@/lib/i18n/config";
import { getContentLocales } from "@/lib/i18n/content";
import { localizePath } from "@/lib/i18n/utils";
import { Clock, Flame } from "lucide-react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import {
  getCuisinesWithCount,
  getScenesWithCount,
  getPopularIngredientsWithCount,
} from "@/lib/aggregation/utils";
import {
  getAggregationPageData,
  type QualifiedCollectionCard,
} from "@/lib/aggregation/qualified-collections";
import type { Prisma } from "@prisma/client";

interface RecipePageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    location?: string;
    cuisine?: string;
    ingredient?: string;
    tag?: string;
    q?: string;
    page?: string;
    sort?: string; // "latest" | "popular"
  }>;
}

interface RecipePageConfig {
  defaultSort: "latest" | "popular";
  pinnedRecipeIds: string[];
  h1: string;
  subtitle: string;
  footerText: string;
}

const DEFAULT_CONFIG: RecipePageConfig = {
  defaultSort: "latest",
  pinnedRecipeIds: [], // TODO: 从数据库配置获取
  h1: "中国美食食谱大全",
  subtitle: "系统整理中国各地家常菜做法，按菜系/场景快速找到适合做的菜。",
  footerText:
    "Recipe Zen 收录了中国各地经典家常菜做法，涵盖川菜、粤菜、湘菜等八大菜系及家常快手菜、减脂餐等多种做饭场景。无论你是烹饪新手还是美食爱好者，都能在这里找到适合的食谱。我们的每道菜谱都经过精心整理，确保步骤清晰、用料准确，让你轻松做出美味中餐。点击上方分类，开始探索你的下一道拿手菜吧！",
};

const DEFAULT_CONFIG_EN: RecipePageConfig = {
  defaultSort: "latest",
  pinnedRecipeIds: [],
  h1: "Chinese Recipes Hub",
  subtitle: "Explore Chinese home recipes by cuisine and cooking scenes.",
  footerText:
    "Recipe Zen features authentic Chinese home cooking recipes, covering the eight major regional cuisines including Sichuan, Cantonese, and Hunan, as well as various cooking scenarios like quick meals and healthy options. Whether you're a beginner or a food enthusiast, you'll find the perfect recipe here. Each recipe is carefully curated with clear instructions and accurate measurements. Start exploring your next favorite dish by browsing the categories above!",
};

// 获取页面配置
// 从 HomeConfig 表读取 recipe_page_config
async function getRecipePageConfig(): Promise<RecipePageConfig> {
  try {
    const config = await prisma.homeConfig.findFirst({
      where: { section: "recipe_page_config" },
    });

    if (!config) {
      return DEFAULT_CONFIG;
    }

    const content = (config.content as Record<string, unknown>) || {};
    return {
      defaultSort: (content.defaultSort as "latest" | "popular") || DEFAULT_CONFIG.defaultSort,
      pinnedRecipeIds: (config.recipeIds as string[]) || (content.pinnedRecipeIds as string[]) || [],
      h1: (content.h1 as string) || config.title || DEFAULT_CONFIG.h1,
      subtitle: (content.subtitle as string) || config.subtitle || DEFAULT_CONFIG.subtitle,
      footerText: (content.footerText as string) || DEFAULT_CONFIG.footerText,
    };
  } catch (error) {
    console.error("获取页面配置失败:", error);
    return DEFAULT_CONFIG;
  }
}

const getCachedConfig = unstable_cache(getRecipePageConfig, ["recipe-page-config"], {
  revalidate: 300,
});

export async function generateMetadata({
  params,
  searchParams,
}: RecipePageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const queryParams = await searchParams;
  const location = queryParams.location;
  const cuisine = queryParams.cuisine;
  const ingredient = queryParams.ingredient;
  const tag = queryParams.tag;
  const query = queryParams.q;
  const hasFilters = Boolean(location || cuisine || ingredient || tag || query);

  const config = await getCachedConfig();
  const baseTitle = isEn
    ? `${config.h1} - Recipe Zen`
    : `${config.h1} - Recipe Zen`;

  const titleParts: string[] = [];
  if (query) {
    titleParts.push(isEn ? `Search "${query}"` : `搜索"${query}"`);
  }

  // 这里的 location/cuisine 现在可能是 slug，实际上如果要完美的 SEO Title，应该查库获取名称
  // 暂时直接使用 slug，后续优化可以查库
  if (cuisine) titleParts.push(isEn ? `${cuisine} Recipes` : `${cuisine}菜谱`);
  if (location) titleParts.push(isEn ? `${location} Flavors` : `${location}风味`);
  if (ingredient) titleParts.push(isEn ? `${ingredient} Ideas` : `${ingredient}做法`);
  if (tag) titleParts.push(`#${tag}`);

  if (hasFilters) {
    return {
      title: titleParts.length > 0 ? `${titleParts.join(" · ")} - ${baseTitle}` : baseTitle,
      robots: { index: false, follow: true }, // 筛选结果页通常不索引
      alternates: { canonical: `/${locale}/recipe` },
    };
  }

  return {
    title: baseTitle,
    description: isEn ? DEFAULT_CONFIG_EN.subtitle : config.subtitle,
  };
}

export default async function RecipePage({ params, searchParams }: RecipePageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const locales = getContentLocales(locale);
  const queryParams = await searchParams;
  const location = queryParams.location;
  const cuisine = queryParams.cuisine;
  const ingredientParam = queryParams.ingredient;
  const tag = queryParams.tag;
  const query = queryParams.q;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;
  const hasFilters = Boolean(location || cuisine || ingredientParam || tag || query);

  // 获取页面配置
  const config = await getCachedConfig();
  const sortParam = queryParams.sort || config.defaultSort;
  const currentSort = sortParam === "popular" ? "popular" : "latest";

  // 构建 Prisma 查询条件
  const where: Prisma.RecipeWhereInput = {
    status: "published",
  };

  if (location) {
    // 支持按 Slug 或 Name 查找
    where.location = {
      OR: [
        { slug: location },
        { name: location } // 兼容旧链接
      ]
    };
  }

  if (cuisine) {
    where.cuisine = {
      OR: [
        { slug: cuisine },
        { name: cuisine }
      ]
    };
  }

  if (ingredientParam) {
    // 简单实现：通过标题或 Ingredient JSON 搜索
    // 理想情况下应该搜索食材表关联，当前基于字符串匹配
    const searchTerms = ingredientParam.split(",").map(t => t.trim()).filter(Boolean);
    if (searchTerms.length > 0) {
      // TODO: 复杂食材搜索逻辑，目前简单匹配标题或原JSON
      // 既然是字符串搜索，暂时用 Title contains
      where.OR = searchTerms.map(term => ({
        title: { contains: term, mode: "insensitive" }
      }));
    }
  }

  if (tag) {
    // 通过 RecipeTag 关联表查询
    where.tags = {
      some: {
        tag: {
          slug: tag,
          isActive: true
        }
      }
    };
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      // 搜索翻译标题
      {
        translations: {
          some: {
            locale: isEn ? "en" : locale,
            title: { contains: query, mode: "insensitive" }
          }
        }
      }
    ];
  }

  // 排序
  const orderBy: Prisma.RecipeOrderByWithRelationInput[] =
    currentSort === "popular"
      ? [{ viewCount: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  // 聚合查询：为了性能，仅在无筛选的第一页加载这些数据
  const loadAggregations = !hasFilters && page === 1;

  // 置顶食谱逻辑：仅在第一页且无筛选时生效
  const pinnedIds = config.pinnedRecipeIds || [];
  const hasPinnedRecipes = !hasFilters && page === 1 && pinnedIds.length > 0;

  // 构建查询条件：排除置顶食谱（它们会单独查询并放在前面）
  const mainWhere = hasPinnedRecipes
    ? { ...where, id: { notIn: pinnedIds } }
    : where;

  // 计算主列表需要获取的数量（减去置顶数量）
  const mainLimit = hasPinnedRecipes ? Math.max(0, limit - pinnedIds.length) : limit;

  const [
    pinnedRecipes,
    mainRecipes,
    total,
    aggregationData,
    ingredientCards,
  ] = await Promise.all([
    // 获取置顶食谱（按置顶顺序）
    hasPinnedRecipes
      ? prisma.recipe.findMany({
          where: { id: { in: pinnedIds }, status: "published" },
          include: {
            cuisine: {
              include: {
                translations: { where: { locale: { in: locales } } }
              }
            },
            location: {
              include: {
                translations: { where: { locale: { in: locales } } }
              }
            },
            translations: {
              where: { locale: { in: locales }, isReviewed: true }
            },
            tags: {
              include: {
                tag: {
                  include: {
                    translations: { where: { locale: { in: locales } } }
                  }
                }
              }
            }
          },
        })
      : Promise.resolve([]),
    // 获取主列表食谱
    mainLimit > 0
      ? prisma.recipe.findMany({
          where: mainWhere,
          orderBy,
          skip: hasPinnedRecipes ? 0 : (page - 1) * limit,
          take: mainLimit,
          include: {
            cuisine: {
              include: {
                translations: { where: { locale: { in: locales } } }
              }
            },
            location: {
              include: {
                translations: { where: { locale: { in: locales } } }
              }
            },
            translations: {
              where: { locale: { in: locales }, isReviewed: true }
            },
            tags: {
              include: {
                tag: {
                  include: {
                    translations: { where: { locale: { in: locales } } }
                  }
                }
              }
            }
          },
        })
      : Promise.resolve([]),
    prisma.recipe.count({ where }),
    loadAggregations ? getAggregationPageData(locale) : { blocks: [] },
    loadAggregations ? getPopularIngredientsWithCount(12, 10) : [],
  ]);

  // 合并置顶食谱和主列表（置顶按配置顺序排序）
  const sortedPinnedRecipes = hasPinnedRecipes
    ? pinnedIds
        .map(id => pinnedRecipes.find(r => r.id === id))
        .filter((r): r is NonNullable<typeof r> => r !== undefined)
    : [];
  const recipesData = [...sortedPinnedRecipes, ...mainRecipes];

  const totalPages = Math.ceil(total / limit);

  // 构建分页链接参数
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    if (currentSort !== config.defaultSort) params.set("sort", currentSort);
    if (location) params.set("location", location);
    if (cuisine) params.set("cuisine", cuisine);
    if (ingredientParam) params.set("ingredient", ingredientParam);
    if (tag) params.set("tag", tag);
    if (query) params.set("q", query);
    return `${localizePath("/recipe", locale)}?${params.toString()}`;
  };

  // 构建排序链接
  const buildSortUrl = (sort: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", "1"); // 切换排序重置页码
    if (sort !== config.defaultSort) params.set("sort", sort);
    if (location) params.set("location", location);
    if (cuisine) params.set("cuisine", cuisine);
    if (ingredientParam) params.set("ingredient", ingredientParam);
    if (tag) params.set("tag", tag);
    if (query) params.set("q", query);
    return `${localizePath("/recipe", locale)}?${params.toString()}`;
  };

  // 标题生成
  const pageH1 = isEn ? DEFAULT_CONFIG_EN.h1 : config.h1;
  const pageSubtitle = isEn ? DEFAULT_CONFIG_EN.subtitle : config.subtitle;

  const headerTitle = hasFilters
    ? query
      ? `${isEn ? "Search:" : "搜索:"} ${query}`
      : ingredientParam
        ? `${isEn ? "Ingredient:" : "食材："}${ingredientParam}`
        : tag
          ? `#${tag}`
          : isEn ? "Recipe Results" : "筛选结果"
    : pageH1;

  const headerSubtitle = hasFilters
    ? `${isEn ? "Found" : "找到"} ${total} ${isEn ? "recipes" : "个相关食谱"}`
    : pageSubtitle;

  // JSON-LD
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recipesite.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageH1,
    description: pageSubtitle,
    url: `${baseUrl}/${locale}/recipe`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: recipesData.map((recipe, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/${locale}/recipe/${recipe.slug}`
      })),
    },
  };

  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      {/* Hero Section */}
      <section
        className="w-full text-white"
        style={{
          background: "linear-gradient(135deg, #C6996B 0%, #E8DCC8 100%)",
          minHeight: hasFilters ? "200px" : "300px",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-[60px] py-[60px] flex flex-col justify-center h-full">
          {/* Breadcrumb could go here */}

          <h1 className="text-4xl md:text-[48px] font-bold text-white mb-3 flex items-center gap-3">
            <span className="text-3xl md:text-4xl">🍜</span>
            {headerTitle}
          </h1>

          <p className="text-base text-white/80 max-w-[600px] leading-relaxed">
            {headerSubtitle}
          </p>
        </div>
      </section>

      {/* 筛选栏 */}
      {hasFilters && <FilterBar basePath={localizePath("/recipe", locale)} />}

      <main className="max-w-[1280px] mx-auto px-[60px]">
        {/* 聚合模块 (仅无筛选且第一页展示) - 使用达标集合作为数据源 */}
        {!hasFilters && page === 1 && aggregationData.blocks.length > 0 && (
          <>
            {aggregationData.blocks.map((block, blockIndex) => (
              <section
                key={block.type}
                className={`py-20 ${blockIndex > 0 ? "border-t border-cream" : ""}`}
              >
                <div className="mb-10">
                  <h2 className="text-[32px] font-bold text-textDark mb-3">
                    {isEn ? (block.titleEn || block.title) : block.title}
                  </h2>
                  {(block.subtitle || block.subtitleEn) && (
                    <p className="text-base text-textGray">
                      {isEn ? (block.subtitleEn || block.subtitle) : block.subtitle}
                    </p>
                  )}
                </div>
                <div className={`grid gap-6 ${
                  block.type === "cuisine" || block.type === "ingredient"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-2 md:grid-cols-3"
                }`}>
                  {block.collections.map((c) => (
                    <LocalizedLink
                      key={c.id}
                      href={c.path}
                      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {c.coverImage ? (
                          <SafeImage
                            src={c.coverImage}
                            alt={c.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-4xl">
                            🍳
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{c.name}</h3>
                        <p className="text-sm text-gray-500">
                          {c.publishedCount} {isEn ? "recipes" : "道菜"}
                        </p>
                      </div>
                    </LocalizedLink>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {/* 食谱列表 */}
        <section className={`py-20 ${!hasFilters && page === 1 && aggregationData.blocks.length > 0 ? "border-t border-cream" : ""}`}>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-[32px] font-bold text-textDark">
              {hasFilters ? (isEn ? "Result" : "结果") : (isEn ? "All Recipes" : "所有食谱")}
              <span className="text-lg font-normal text-gray-500 ml-2">({total})</span>
            </h2>

            {/* Sort Controls */}
            {!hasFilters && (
              <div className="flex gap-2">
                <LocalizedLink href={buildSortUrl("latest")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentSort === "latest" ? "bg-brownWarm text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
                  <Clock className="w-4 h-4 inline mr-1" /> {isEn ? "Latest" : "最新"}
                </LocalizedLink>
                <LocalizedLink href={buildSortUrl("popular")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentSort === "popular" ? "bg-brownWarm text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
                  <Flame className="w-4 h-4 inline mr-1" /> {isEn ? "Popular" : "最热"}
                </LocalizedLink>
              </div>
            )}
          </div>

          {recipesData.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {isEn ? "No recipes found." : "暂时没有相关食谱。"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipesData.map(recipe => {
                // 翻译处理
                const translation = recipe.translations[0];
                // 菜系名翻译
                const cuisineTrans = recipe.cuisine?.translations.find(t => t.locale === locale);
                // 地域名翻译
                const locationTrans = recipe.location?.translations.find(t => t.locale === locale);

                return (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    slug={translation?.slug || recipe.slug}
                    titleZh={recipe.title}
                    title={translation?.title || recipe.title}
                    titleEn={recipe.translations.find(t => t.locale === 'en')?.title}
                    coverImage={recipe.coverImage || ""}
                    cuisine={cuisineTrans?.name || recipe.cuisine?.name || ""}
                    location={locationTrans?.name || recipe.location?.name}
                    summary={(translation?.summary as any) || recipe.summary}
                    aiGenerated={recipe.aiGenerated}
                    aspectClass="aspect-[4/3]"
                  />
                );
              })}
            </div>
          )}

          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-12">
              {page > 1 && (
                <LocalizedLink href={buildPageUrl(page - 1)} className="px-6 py-2 bg-white rounded-full border hover:border-brownWarm transition-colors">
                  {isEn ? "Previous" : "上一页"}
                </LocalizedLink>
              )}
              <span className="px-4 py-2 text-gray-500">{page} / {totalPages}</span>
              {page < totalPages && (
                <LocalizedLink href={buildPageUrl(page + 1)} className="px-6 py-2 bg-white rounded-full border hover:border-brownWarm transition-colors">
                  {isEn ? "Next" : "下一页"}
                </LocalizedLink>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
