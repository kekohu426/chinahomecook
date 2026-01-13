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

interface SearchPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const { q } = await searchParams;
  const baseTitle = isEn ? "Search Recipes - Recipe Zen" : "搜索食谱 - Recipe Zen";
  return {
    title: q
      ? isEn
        ? `Search “${q}” - Recipe Zen`
        : `搜索“${q}” - Recipe Zen`
      : baseTitle,
    description: isEn
      ? "Search recipes, ingredients, and cooking ideas in Recipe Zen."
      : "在 Recipe Zen 搜索食谱、食材与烹饪灵感。",
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
          {locale === "en" ? "Type a dish to start searching" : "请输入菜名开始搜索"}
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
      throw new Error(locale === "en" ? "Search failed" : "搜索失败");
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
                  {locale === "en"
                    ? "✨ AI generated a new recipe for you"
                    : "✨ AI为您生成了新菜谱"}
                </h3>
                <p className="text-sm text-textGray">
                  {locale === "en"
                    ? `We couldn't find "${query}", so we created one for you.`
                    : `我们没有找到"${query}"的现有菜谱，已使用AI为您生成了专属食谱！`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果统计 */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-textDark">
            {locale === "en" ? "Found" : "找到"}{" "}
            <span className="text-brownWarm">{recipes.length}</span>{" "}
            {locale === "en" ? "recipes" : "个相关菜谱"}
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
          {locale === "en" ? "Search failed" : "搜索出错了"}
        </p>
        <p className="text-sm text-textGray">
          {locale === "en" ? "Please try again later" : "请稍后重试"}
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
              ? `${locale === "en" ? "Search:" : "搜索:"} ${query}`
              : locale === "en"
              ? "Search"
              : "搜索"}
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
                  ? locale === "en"
                    ? "Searching..."
                    : "正在搜索..."
                  : locale === "en"
                  ? "Loading..."
                  : "加载中..."}
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
