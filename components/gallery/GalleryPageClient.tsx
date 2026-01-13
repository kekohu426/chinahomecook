"use client";

import { useState, useMemo } from "react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { Search, X, Clock, ChefHat } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

interface GalleryRecipe {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  cuisineId: string | null;
  cuisineName: string | null;
  cuisineSlug: string | null;
  locationId: string | null;
  locationName: string | null;
  totalTime: number;
  difficulty: string | null;
  tagIds: string[];
  tagNames: string[];
}

interface FilterOption {
  id: string;
  name: string;
  slug: string;
}

interface GalleryPageClientProps {
  recipes: GalleryRecipe[];
  cuisines: FilterOption[];
  locations: FilterOption[];
  sceneTags: FilterOption[];
  total: number;
  locale: Locale;
}

// 翻译文案
const translations = {
  zh: {
    searchPlaceholder: "输入菜名搜索...",
    cuisineLabel: "菜系",
    sceneLabel: "场景",
    all: "全部",
    clearFilters: "清空筛选",
    showing: "正在显示",
    found: "共找到",
    dishes: "道菜",
    minutes: "分钟",
    beginner: "新手",
    medium: "中等",
    advanced: "进阶",
    noResults: "没有找到匹配的菜谱",
    tryOther: "试试其他筛选条件",
    viewRecipe: "查看做法",
  },
  en: {
    searchPlaceholder: "Search dishes...",
    cuisineLabel: "Cuisine",
    sceneLabel: "Scene",
    all: "All",
    clearFilters: "Clear filters",
    showing: "Showing",
    found: "Found",
    dishes: "dishes",
    minutes: "min",
    beginner: "Beginner",
    medium: "Medium",
    advanced: "Advanced",
    noResults: "No matching recipes found",
    tryOther: "Try different filters",
    viewRecipe: "View Recipe",
  },
};

// 难度显示
const difficultyLabels = {
  zh: { easy: "新手", medium: "中等", hard: "进阶" },
  en: { easy: "Beginner", medium: "Medium", hard: "Advanced" },
};

export function GalleryPageClient({
  recipes,
  cuisines,
  sceneTags,
  total,
  locale,
}: GalleryPageClientProps) {
  const t = translations[locale] || translations.zh;
  const diffLabels = difficultyLabels[locale] || difficultyLabels.zh;

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);

  // 前端即时过滤
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!recipe.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 菜系过滤
      if (selectedCuisine && recipe.cuisineId !== selectedCuisine) {
        return false;
      }

      // 场景过滤
      if (selectedScene && !recipe.tagIds.includes(selectedScene)) {
        return false;
      }

      return true;
    });
  }, [recipes, searchQuery, selectedCuisine, selectedScene]);

  // 是否有筛选条件
  const hasFilters = searchQuery || selectedCuisine || selectedScene;

  // 清空所有筛选
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCuisine(null);
    setSelectedScene(null);
  };

  // 获取当前筛选描述
  const getFilterDescription = () => {
    const parts: string[] = [];
    if (selectedCuisine) {
      const cuisine = cuisines.find((c) => c.id === selectedCuisine);
      if (cuisine) parts.push(cuisine.name);
    }
    if (selectedScene) {
      const scene = sceneTags.find((s) => s.id === selectedScene);
      if (scene) parts.push(scene.name);
    }
    return parts.join(" · ");
  };

  // 生成优化的 Alt 标签
  const getOptimizedAlt = (recipe: GalleryRecipe) => {
    const parts = [recipe.title + "的做法"];
    if (recipe.cuisineName) {
      parts.push(recipe.cuisineName);
    }
    parts.push("高清图片");
    return parts.join(" - ");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* 快速筛选区 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-6 mb-8">
        {/* 搜索框 */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-sage-200 bg-sage-50 focus:outline-none focus:ring-2 focus:ring-brownWarm/30 focus:border-brownWarm transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sage-200 text-sage-600 flex items-center justify-center hover:bg-sage-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 菜系筛选 - 标签样式 */}
        {cuisines.length > 0 && (
          <div className="mb-4">
            <span className="text-sm text-sage-600 mr-3">{t.cuisineLabel}:</span>
            <div className="inline-flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setSelectedCuisine(null)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  !selectedCuisine
                    ? "bg-brownWarm text-white"
                    : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                }`}
              >
                {t.all}
              </button>
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine.id}
                  onClick={() =>
                    setSelectedCuisine(
                      selectedCuisine === cuisine.id ? null : cuisine.id
                    )
                  }
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCuisine === cuisine.id
                      ? "bg-brownWarm text-white"
                      : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                  }`}
                >
                  {cuisine.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 场景筛选 - 标签样式 */}
        {sceneTags.length > 0 && (
          <div className="mb-4">
            <span className="text-sm text-sage-600 mr-3">{t.sceneLabel}:</span>
            <div className="inline-flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => setSelectedScene(null)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  !selectedScene
                    ? "bg-orangeAccent text-white"
                    : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                }`}
              >
                {t.all}
              </button>
              {sceneTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() =>
                    setSelectedScene(selectedScene === tag.id ? null : tag.id)
                  }
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    selectedScene === tag.id
                      ? "bg-orangeAccent text-white"
                      : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 清空筛选按钮 */}
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-brownWarm hover:text-brownDark transition-colors"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      {/* 当前筛选提示 */}
      {hasFilters && (
        <div className="mb-6 text-sage-600">
          <span>
            {t.showing}: {getFilterDescription()}
            {getFilterDescription() && " · "}
            {t.found}{" "}
            <span className="font-semibold text-textDark">
              {filteredRecipes.length}
            </span>{" "}
            {t.dishes}
          </span>
        </div>
      )}

      {/* 图片网格区 */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-textGray text-lg mb-2">{t.noResults}</p>
          <p className="text-sage-500 text-sm">{t.tryOther}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredRecipes.map((recipe) => (
            <article
              key={recipe.id}
              className="recipe-card group"
              itemScope
              itemType="https://schema.org/Recipe"
            >
              <LocalizedLink
                href={`/recipe/${recipe.id}`}
                className="block bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                aria-label={`${t.viewRecipe}: ${recipe.title}`}
              >
                {/* 图片 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={recipe.coverImage || "/placeholder-food.jpg"}
                    alt={getOptimizedAlt(recipe)}
                    width={800}
                    height={600}
                    loading="lazy"
                    itemProp="image"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* 标题 */}
                <div className="p-3 md:p-4">
                  <h3
                    itemProp="name"
                    className="font-medium text-textDark text-sm md:text-base line-clamp-1 mb-2"
                  >
                    {recipe.title}
                  </h3>

                  {/* 标签区 */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {recipe.cuisineName && (
                      <span className="px-2 py-0.5 bg-brownWarm/10 text-brownWarm rounded">
                        {recipe.cuisineName}
                      </span>
                    )}
                    {recipe.totalTime > 0 && (
                      <span className="flex items-center gap-1 text-sage-500">
                        <Clock className="w-3 h-3" />
                        {recipe.totalTime}
                        {t.minutes}
                      </span>
                    )}
                    {recipe.difficulty && (
                      <span className="flex items-center gap-1 text-sage-500">
                        <ChefHat className="w-3 h-3" />
                        {diffLabels[recipe.difficulty as keyof typeof diffLabels] ||
                          recipe.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Schema.org 隐藏数据 */}
                  {recipe.cuisineName && (
                    <meta itemProp="recipeCategory" content={recipe.cuisineName} />
                  )}
                  {recipe.totalTime > 0 && (
                    <meta
                      itemProp="totalTime"
                      content={`PT${recipe.totalTime}M`}
                    />
                  )}
                </div>
              </LocalizedLink>
            </article>
          ))}
        </div>
      )}

      {/* 加载完成提示 */}
      {!hasFilters && filteredRecipes.length > 0 && (
        <div className="text-center py-8 text-sage-500">
          {locale === "en"
            ? `Showing all ${total} recipes`
            : `已展示全部 ${total} 道菜谱`}
        </div>
      )}
    </div>
  );
}
