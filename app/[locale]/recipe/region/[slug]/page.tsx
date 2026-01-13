/**
 * 地区/风味聚合页
 *
 * 路由：/[locale]/recipe/region/[slug]
 * 展示特定地区/风味的食谱列表
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
import type { Locale } from "@/lib/i18n/config";
import { ChevronRight, Home } from "lucide-react";

interface RegionPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const FALLBACK_ASPECTS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[1/1]"];

async function getLocationBySlug(slug: string, locale: Locale) {
  const locales = getContentLocales(locale);
  const location = await prisma.location.findUnique({
    where: { slug },
    include: { translations: { where: { locale: { in: locales } } } },
  });
  if (location) return location;
  return prisma.location.findUnique({
    where: { name: slug },
    include: { translations: { where: { locale: { in: locales } } } },
  });
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const location = await getLocationBySlug(slug, locale);
  if (!location) return { title: "Not Found" };
  const isEn = locale === "en";
  const translation = location.translations.find((t) => t.locale === locale);
  const name = translation?.name || location.name;
  return {
    title: isEn ? `${name} Recipes - Recipe Zen` : `${name}风味食谱 - Recipe Zen`,
    description: isEn
      ? `Explore recipes inspired by ${name} flavors.`
      : `精选${name}风味家常菜谱。`,
  };
}

export default async function RegionPage({
  params,
  searchParams,
}: RegionPageProps) {
  const { locale, slug } = await params;
  const location = await getLocationBySlug(slug, locale);
  if (!location || !location.isActive) notFound();

  const locales = getContentLocales(locale);
  const isEn = locale === "en";
  const translation = location.translations.find((t) => t.locale === locale);
  const name = translation?.name || location.name;
  const description = translation?.description || location.description || "";
  const queryParams = await searchParams;
  const page = parseInt(queryParams.page || "1");
  const limit = 12;

  const where = {
    status: "published" as const,
    locationId: location.id,
  };

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cuisine: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        translations: { where: { locale: { in: locales }, isReviewed: true } },
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const buildPageUrl = (pageNum: number) =>
    `${localizePath(`/recipe/region/${slug}`, locale)}?page=${pageNum}`;

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
            <span className="text-textDark">{name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-textDark mb-3">
            {name}
          </h1>
          <p className="text-textGray text-lg max-w-3xl">
            {description ||
              (isEn
                ? `Regional recipes inspired by ${name}.`
                : `精选${name}风味家常菜谱。`)}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {recipes.length === 0 ? (
          <div className="text-center py-20 text-textGray">
            {isEn ? "No recipes found yet." : "暂无相关食谱。"}
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
              <LocalizedLink
                href={buildPageUrl(page - 1)}
                className="px-4 py-2 bg-white border border-sage-200 rounded-lg hover:border-sage-400 transition-colors"
              >
                {isEn ? "Prev" : "上一页"}
              </LocalizedLink>
            )}

            <span className="px-4 py-2 text-sage-600">
              {isEn ? `Page ${page} / ${totalPages}` : `第 ${page} / ${totalPages} 页`}
            </span>

            {page < totalPages && (
              <LocalizedLink
                href={buildPageUrl(page + 1)}
                className="px-4 py-2 bg-white border border-sage-200 rounded-lg hover:border-sage-400 transition-colors"
              >
                {isEn ? "Next" : "下一页"}
              </LocalizedLink>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
