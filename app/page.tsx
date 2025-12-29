/**
 * 首页
 *
 * 路由：/
 * 展示所有已发布的食谱卡片，支持筛选
 */

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterBar } from "@/components/filter/FilterBar";
import { RecipeCard } from "@/components/recipe/RecipeCard";

interface HomePageProps {
  searchParams: Promise<{
    location?: string;
    cuisine?: string;
    page?: string;
  }>;
}

const FALLBACK_ASPECTS = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[1/1]"];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const location = params.location;
  const cuisine = params.cuisine;
  const page = parseInt(params.page || "1");
  const limit = 12;

  // 构建查询条件
  const where: any = { isPublished: true };

  if (location) {
    where.location = location;
  }

  if (cuisine) {
    where.cuisine = cuisine;
  }

  // 获取已发布的食谱（带筛选）
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-cream">
      {/* 头部 */}
      <header className="bg-gradient-to-br from-brownWarm via-orangeAccent/60 to-cream text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-5xl font-serif font-medium mb-4">
            Recipe Zen
          </h1>
          <p className="text-white/90 text-lg mb-8">
            治愈系美食研习所 · 用心烹饪每一餐
          </p>

          {/* 搜索栏 */}
          <div className="mt-8">
            <SearchBar placeholder="搜索菜谱...找不到？我们会为您智能生成！" />
          </div>
        </div>
      </header>

      {/* 筛选栏 */}
      <FilterBar />

      {/* 食谱网格 */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {recipes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-textGray text-lg mb-4">暂无食谱</p>
            <Link
              href="/admin/recipes/new"
              className="text-brownWarm hover:underline"
            >
              创建第一个食谱
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-medium text-textDark">
                精选食谱 ({recipes.length})
              </h2>
              <Link
                href="/admin/recipes"
                className="text-sm text-brownWarm hover:underline"
              >
                后台管理 →
              </Link>
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 [column-fill:_balance]">
              {recipes.map((recipe, index) => {
                const summary = recipe.summary as any;
                const aspectClass =
                  FALLBACK_ASPECTS[index % FALLBACK_ASPECTS.length];
                return (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    titleZh={recipe.titleZh}
                    titleEn={recipe.titleEn}
                    summary={summary}
                    location={recipe.location}
                    cuisine={recipe.cuisine}
                    aiGenerated={recipe.aiGenerated}
                    coverImage={recipe.coverImage}
                    aspectClass={aspectClass}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={`/?page=${page - 1}${location ? `&location=${location}` : ""}${cuisine ? `&cuisine=${cuisine}` : ""}`}
                className="px-4 py-2 bg-white border border-sage-200 rounded-lg hover:border-sage-400 transition-colors"
              >
                上一页
              </Link>
            )}

            <span className="px-4 py-2 text-sage-600">
              第 {page} / {totalPages} 页
            </span>

            {page < totalPages && (
              <Link
                href={`/?page=${page + 1}${location ? `&location=${location}` : ""}${cuisine ? `&cuisine=${cuisine}` : ""}`}
                className="px-4 py-2 bg-white border border-sage-200 rounded-lg hover:border-sage-400 transition-colors"
              >
                下一页
              </Link>
            )}
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-brownDark text-white mt-20">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center">
          <p className="text-cream/70 text-sm">
            Recipe Zen © 2025 · 治愈系美食研习所
          </p>
        </div>
      </footer>
    </div>
  );
}
