import { Suspense } from "react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { SearchBar } from "@/components/search/SearchBar";
import { Loader2, Sparkles, ChefHat, ChevronRight, Home } from "lucide-react";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { EmptyStateGenerator } from "@/components/search/EmptyStateGenerator";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";
import { t } from "@/lib/i18n/translations";

interface SearchPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const baseTitle = t("search.metaTitle", locale);
  return {
    title: q
      ? t("search.metaTitleQuery", locale).replace("{query}", q)
      : baseTitle,
    description: t("search.metaDescription", locale),
  };
}

async function SearchResults({
  query,
  locale,
}: {
  query: string;
  locale: Locale;
}) {
  if (!query) {
    return (
      <div className="text-center py-16">
        <ChefHat className="w-16 h-16 mx-auto text-textGray mb-4" />
        <p className="text-textGray">
          {t("search.promptTypeDish", locale)}
        </p>
      </div>
    );
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/search?q=${encodeURIComponent(query)}&locale=${locale}`,
      {
        cache: "no-store", // 不缓存，确保实时搜索
      }
    );

    if (!response.ok) {
      throw new Error(t("search.failed", locale));
    }

    const result = await response.json();
    const recipes = result.data || [];
    const source = result.source; // "database" 或 "ai-generated"

    if (recipes.length === 0) {
      return <EmptyStateGenerator query={query} />;
    }

    return (
      <div>
        {/* AI生成提示 */}
        {source === "ai-generated" && (
          <div className="mb-8 p-6 bg-gradient-to-r from-cream to-orangeAccent/15 rounded-2xl border border-lightGray">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-brownWarm flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-textDark mb-1">
                  {t("search.aiGeneratedTitle", locale)}
                </h3>
                <p className="text-sm text-textGray">
                  {t("search.aiGeneratedDescription", locale).replace("{query}", query)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果统计 */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-textDark">
            {t("search.foundCount", locale).replace("{count}", recipes.length.toString())}
          </h2>
        </div>

        {/* 菜谱列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe: any) => (
            <SearchResultCard
              key={recipe.id}
              id={recipe.id}
              titleZh={recipe.titleZh}
              titleEn={recipe.titleEn}
              summary={recipe.summary}
              location={recipe.location}
              cuisine={recipe.cuisine}
              aiGenerated={recipe.aiGenerated}
              coverImage={recipe.coverImage}
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("搜索错误:", error);
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-2">
          {t("search.failed", locale)}
        </p>
        <p className="text-sm text-textGray">
          {t("search.failedDescription", locale)}
        </p>
      </div>
    );
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const search = await searchParams;
  const query = search.q || "";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* 面包屑导航 */}
      <div className="container mx-auto px-4 pt-4">
        <nav className="flex items-center gap-2 text-sm text-textGray">
          <LocalizedLink href="/" className="hover:text-brownWarm transition-colors">
            <Home className="w-4 h-4" />
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark">
            {query
              ? t("search.breadcrumbQuery", locale).replace("{query}", query)
              : t("search.breadcrumb", locale)}
          </span>
        </nav>
      </div>

      {/* 头部搜索区 */}
      <div className="bg-white border-b border-lightGray mt-4">
        <div className="container mx-auto px-4 py-6">
          <SearchBar defaultValue={query} />
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-textGray animate-spin" />
              <span className="ml-3 text-textGray">
                {query
                  ? t("search.searching", locale)
                  : t("status.loading", locale)}
              </span>
            </div>
          }
        >
          <SearchResults query={query} locale={locale} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
