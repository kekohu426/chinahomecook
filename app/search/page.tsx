import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { Loader2, Sparkles, ChefHat } from "lucide-react";
import { SearchResultCard } from "@/components/search/SearchResultCard";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return (
      <div className="text-center py-16">
        <ChefHat className="w-16 h-16 mx-auto text-textGray mb-4" />
        <p className="text-textGray">请输入菜名开始搜索</p>
      </div>
    );
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/search?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store", // 不缓存，确保实时搜索
      }
    );

    if (!response.ok) {
      throw new Error("搜索失败");
    }

    const result = await response.json();
    const recipes = result.data || [];
    const source = result.source; // "database" 或 "ai-generated"

    if (recipes.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-textGray mb-4">未找到相关菜谱</p>
          <p className="text-sm text-textGray">
            尝试搜索其他菜名，我们会为您智能生成！
          </p>
        </div>
      );
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
                  ✨ AI为您生成了新菜谱
                </h3>
                <p className="text-sm text-textGray">
                  我们没有找到&quot;{query}&quot;的现有菜谱，已使用AI为您生成了专属食谱！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果统计 */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-textDark">
            找到 <span className="text-brownWarm">{recipes.length}</span> 个相关菜谱
          </h2>
        </div>

        {/* 菜谱列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe: any) => (
            <SearchResultCard
              key={recipe.id}
              id={recipe.id}
              titleZh={recipe.titleZh}
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
        <p className="text-red-500 mb-2">搜索出错了</p>
        <p className="text-sm text-textGray">请稍后重试</p>
      </div>
    );
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="min-h-screen bg-cream">
      {/* 头部搜索区 */}
      <div className="bg-white border-b border-lightGray sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <SearchBar defaultValue={query} />
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-textGray animate-spin" />
              <span className="ml-3 text-textGray">
                {query ? "正在搜索..." : "加载中..."}
              </span>
            </div>
          }
        >
          <SearchResults query={query} />
        </Suspense>
      </div>
    </div>
  );
}
