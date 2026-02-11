"use client";

import { useState, useMemo, useEffect } from "react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import {
  Search,
  X,
  Clock,
  ChefHat,
  MapPin,
  UtensilsCrossed,
  Sun,
  Flame,
  Heart,
  Users,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { containsCjk, ensureEnglish, titleFromSlug } from "@/lib/i18n/english";
import { translateTagName } from "@/lib/i18n/tag-english";
import { cn } from "@/lib/utils";

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
  originalName?: string;
  translations?: Array<{ locale: string; name: string }>;
}

interface GalleryPageClientProps {
  recipes: GalleryRecipe[];
  cuisines: FilterOption[];
  locations: FilterOption[];
  sceneTags: FilterOption[];
  total: number;
  locale: Locale;
}

const translations = {
  zh: {
    searchPlaceholder: "搜索菜谱，例如：宫保鸡丁、红烧肉",
    searchButton: "搜索",
    aiHint: "没找到？我们可以帮你智能生成",
    locationLabel: "地区",
    cuisineLabel: "菜系",
    sceneLabel: "场景",
    methodLabel: "做法",
    tasteLabel: "口味",
    crowdLabel: "人群",
    occasionLabel: "场合",
    all: "全部",
    clearFilters: "清除所有筛选",
    moreFilters: "更多筛选",
    lessFilters: "收起筛选",
    showing: "当前显示",
    found: "共找到",
    dishes: "道菜",
    minutes: "分钟",
    beginner: "新手",
    medium: "中等",
    advanced: "进阶",
    noResults: "没有找到匹配的菜谱",
    tryOther: "请尝试其他筛选条件",
    viewRecipe: "查看做法",
    showingAll: "已展示全部",
    recipesText: "道菜谱",
  },
  en: {
    searchPlaceholder: "Search recipes... e.g. Kung Pao Chicken",
    searchButton: "Search",
    aiHint: "Can't find it? We'll generate one for you!",
    locationLabel: "Region",
    cuisineLabel: "Cuisine",
    sceneLabel: "Scene",
    methodLabel: "Method",
    tasteLabel: "Taste",
    crowdLabel: "For",
    occasionLabel: "Occasion",
    all: "All",
    clearFilters: "Clear all filters",
    moreFilters: "More filters",
    lessFilters: "Less filters",
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
    showingAll: "Showing all",
    recipesText: "recipes",
  },
};

// 闅惧害鏄剧ず
const difficultyLabels = {
  zh: { easy: "鏂版墜", medium: "涓瓑", hard: "杩涢樁" },
  en: { easy: "Beginner", medium: "Medium", hard: "Advanced" },
};

export function GalleryPageClient({
  recipes,
  cuisines,
  locations,
  sceneTags,
  total,
  locale,
}: GalleryPageClientProps) {
  const t = translations[locale] || translations.zh;
  const diffLabels = difficultyLabels[locale] || difficultyLabels.zh;

  // Filter state.
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string | null>(null);
  const [selectedCrowd, setSelectedCrowd] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);

  // UI state.
  const [expanded, setExpanded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [gridSize, setGridSize] = useState<"normal" | "compact">("normal");

  // 棰濆鏍囩鏁版嵁
  const [methods, setMethods] = useState<FilterOption[]>([]);
  const [tastes, setTastes] = useState<FilterOption[]>([]);
  const [crowds, setCrowds] = useState<FilterOption[]>([]);
  const [occasions, setOccasions] = useState<FilterOption[]>([]);

  // 鍔犺浇棰濆鏍囩
  useEffect(() => {
    async function loadExtraTags() {
      try {
        const [methodsRes, tastesRes, crowdsRes, occasionsRes] = await Promise.all([
          fetch(`/api/admin/config/tags/cooking-methods?locale=${locale}`),
          fetch(`/api/admin/config/tags/tastes?locale=${locale}`),
          fetch(`/api/admin/config/tags/crowds?locale=${locale}`),
          fetch(`/api/admin/config/tags/occasions?locale=${locale}`),
        ]);

        const [methodsData, tastesData, crowdsData, occasionsData] = await Promise.all([
          methodsRes.json(),
          tastesRes.json(),
          crowdsRes.json(),
          occasionsRes.json(),
        ]);

        const normalizeTags = (
          items: Array<FilterOption & { isActive?: boolean }>,
          type?: "scene" | "method" | "taste" | "crowd" | "occasion"
        ) =>
          items
            .filter((tag) => tag.isActive !== false)
            .map((tag) => {
              if (locale !== "en") return tag;
              const fallback = titleFromSlug(tag.slug, tag.originalName || tag.name);
              const cleaned = ensureEnglish(tag.name, fallback);
              const safeName = containsCjk(tag.name) ? cleaned || fallback || tag.name : tag.name;
              const finalName = translateTagName({
                name: safeName,
                originalName: tag.originalName,
                slug: tag.slug,
                type,
                locale,
              });
              return { ...tag, name: finalName };
            });

        if (methodsData.success) setMethods(normalizeTags(methodsData.data, "method"));
        if (tastesData.success) setTastes(normalizeTags(tastesData.data, "taste"));
        if (crowdsData.success) setCrowds(normalizeTags(crowdsData.data, "crowd"));
        if (occasionsData.success) setOccasions(normalizeTags(occasionsData.data, "occasion"));
      } catch (error) {
        console.error("鍔犺浇鏍囩澶辫触:", error);
      }
    }
    loadExtraTags();
  }, [locale]);

  // 鍓嶇鍗虫椂杩囨护
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // 鎼滅储杩囨护
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!recipe.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 鍦扮偣杩囨护
      if (selectedLocation && recipe.locationId !== selectedLocation) {
        return false;
      }

      // 鑿滅郴杩囨护
      if (selectedCuisine && recipe.cuisineId !== selectedCuisine) {
        return false;
      }

      // 鍦烘櫙杩囨护
      if (selectedScene && !recipe.tagIds.includes(selectedScene)) {
        return false;
      }

      // 鍋氭硶杩囨护
      if (selectedMethod && !recipe.tagIds.includes(selectedMethod)) {
        return false;
      }

      // 鍙ｅ懗杩囨护
      if (selectedTaste && !recipe.tagIds.includes(selectedTaste)) {
        return false;
      }

      // 浜虹兢杩囨护
      if (selectedCrowd && !recipe.tagIds.includes(selectedCrowd)) {
        return false;
      }

      // 鍦哄悎杩囨护
      if (selectedOccasion && !recipe.tagIds.includes(selectedOccasion)) {
        return false;
      }

      return true;
    });
  }, [recipes, searchQuery, selectedLocation, selectedCuisine, selectedScene, selectedMethod, selectedTaste, selectedCrowd, selectedOccasion]);

  // Whether any filter is active.
  const hasFilters =
    searchQuery ||
    selectedLocation ||
    selectedCuisine ||
    selectedScene ||
    selectedMethod ||
    selectedTaste ||
    selectedCrowd ||
    selectedOccasion;

  // Active filter count.
  const activeFilterCount = [
    selectedLocation,
    selectedCuisine,
    selectedScene,
    selectedMethod,
    selectedTaste,
    selectedCrowd,
    selectedOccasion,
  ].filter(Boolean).length;

  // Clear all filters.
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedLocation(null);
    setSelectedCuisine(null);
    setSelectedScene(null);
    setSelectedMethod(null);
    setSelectedTaste(null);
    setSelectedCrowd(null);
    setSelectedOccasion(null);
  };

  // 鎼滅储澶勭悊
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  // 鐢熸垚浼樺寲鐨?Alt 鏍囩
  const getOptimizedAlt = (recipe: GalleryRecipe) => {
    const parts = [recipe.title + t.recipeOf];
    if (recipe.cuisineName) {
      parts.push(recipe.cuisineName);
    }
    parts.push(t.hdPhoto);
    return parts.join(" - ");
  };

  // 娓叉煋绛涢€夌粍
  const renderFilterGroup = (
    icon: React.ReactNode,
    label: string,
    items: FilterOption[],
    selectedValue: string | null,
    setSelectedValue: (value: string | null) => void,
    activeColor: string = "bg-brownWarm"
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="flex items-start gap-3 py-3 border-b border-lightGray last:border-0">
        <div className="flex items-center gap-2 text-textGray font-medium shrink-0 min-w-[80px] pt-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedValue(null)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap",
              !selectedValue
                ? `${activeColor} text-white shadow-md`
                : "bg-lightGray text-textGray hover:bg-cream/70"
            )}
          >
            {t.all}
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedValue(selectedValue === item.id ? null : item.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap",
                selectedValue === item.id
                  ? `${activeColor} text-white shadow-md`
                  : "bg-lightGray text-textGray hover:bg-cream/70"
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* 绛涢€夊崱鐗?*/}
      <div className="bg-white rounded-2xl shadow-lg border border-lightGray mb-8 overflow-hidden">
        {/* 鎼滅储鏍?- 浼樺寲璁捐 */}
        <div className="p-6 bg-gradient-to-r from-cream/70 to-white border-b border-lightGray">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-brownWarm" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-32 py-4 text-base rounded-full border-2 border-lightGray focus:border-brownWarm focus:outline-none focus:ring-4 focus:ring-brownWarm/10 transition-all bg-white text-textDark placeholder:text-textGray/70"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 px-6 py-2.5 bg-brownWarm hover:bg-brownDark text-white rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    {t.searchButton}
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-textGray">
              <Sparkles className="w-4 h-4 text-orangeAccent" />
              <span>{t.aiHint}</span>
            </div>
          </form>
        </div>

        {/* 涓昏绛涢€?- 鍦扮偣鍜岃彍绯?*/}
        <div className="px-6 py-4">
          {renderFilterGroup(
            <MapPin className="w-4 h-4" />,
            t.locationLabel,
            locations,
            selectedLocation,
            setSelectedLocation
          )}
          {renderFilterGroup(
            <UtensilsCrossed className="w-4 h-4" />,
            t.cuisineLabel,
            cuisines,
            selectedCuisine,
            setSelectedCuisine
          )}
          {renderFilterGroup(
            <Sun className="w-4 h-4" />,
            t.sceneLabel,
            sceneTags,
            selectedScene,
            setSelectedScene,
            "bg-orangeAccent"
          )}
        </div>

        {/* 灞曞紑鏇村绛涢€?*/}
        {(methods.length > 0 || tastes.length > 0 || crowds.length > 0 || occasions.length > 0) && (
          <>
            <div className="px-6 py-3 border-t border-lightGray">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium text-textGray hover:text-brownWarm transition-colors w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{expanded ? t.lessFilters : t.moreFilters}</span>
                  {!expanded && activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-brownWarm text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {expanded && (
              <div className="px-6 py-4 bg-cream/60 border-t border-lightGray">
                {renderFilterGroup(
                  <Flame className="w-4 h-4" />,
                  t.methodLabel,
                  methods,
                  selectedMethod,
                  setSelectedMethod,
                  "bg-clayRed"
                )}
                {renderFilterGroup(
                  <Heart className="w-4 h-4" />,
                  t.tasteLabel,
                  tastes,
                  selectedTaste,
                  setSelectedTaste,
                  "bg-matchaGreen"
                )}
                {renderFilterGroup(
                  <Users className="w-4 h-4" />,
                  t.crowdLabel,
                  crowds,
                  selectedCrowd,
                  setSelectedCrowd,
                  "bg-warmWood"
                )}
                {renderFilterGroup(
                  <Calendar className="w-4 h-4" />,
                  t.occasionLabel,
                  occasions,
                  selectedOccasion,
                  setSelectedOccasion,
                  "bg-brownDark"
                )}
              </div>
            )}
          </>
        )}

        {/* 搴曢儴鎿嶄綔鏍?*/}
        {hasFilters && (
          <div className="px-6 py-4 border-t border-lightGray flex items-center justify-between bg-cream/40">
            <div className="text-sm text-textGray">
              {t.found}{" "}
              <span className="font-semibold text-brownWarm">{filteredRecipes.length}</span>{" "}
              {t.dishes}
            </div>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              {t.clearFilters}
            </button>
          </div>
        )}
      </div>

      {/* 缃戞牸瑙嗗浘鍒囨崲 */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-textGray">
          {hasFilters ? (
            <>
              {t.showing} <span className="font-medium text-textDark">{filteredRecipes.length}</span> {t.dishes}
            </>
          ) : (
            <>
              {t.showingAll} <span className="font-medium text-textDark">{total}</span> {t.recipesText}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGridSize("normal")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              gridSize === "normal" ? "bg-brownWarm text-white" : "bg-lightGray text-textGray hover:bg-cream/70"
            )}
            title="Normal grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridSize("compact")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              gridSize === "compact" ? "bg-brownWarm text-white" : "bg-lightGray text-textGray hover:bg-cream/70"
            )}
            title="Compact grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 鍥剧墖缃戞牸鍖?*/}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lightGray flex items-center justify-center">
            <Search className="w-8 h-8 text-textGray/70" />
          </div>
          <p className="text-textDark text-lg mb-2">{t.noResults}</p>
          <p className="text-textGray text-sm">{t.tryOther}</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-4 md:gap-6",
          gridSize === "compact"
            ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        )}>
          {filteredRecipes.map((recipe) => (
            <article
              key={recipe.id}
              className="recipe-card group"
              itemScope
              itemType="https://schema.org/Recipe"
            >
              <LocalizedLink
                href={`/recipe/${recipe.id}`}
                className="block bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                aria-label={`${t.viewRecipe}: ${recipe.title}`}
              >
                {/* 鍥剧墖 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={recipe.coverImage || "/placeholder-food.jpg"}
                    alt={getOptimizedAlt(recipe)}
                    width={800}
                    height={600}
                    loading="lazy"
                    itemProp="image"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* 鎮诞閬僵 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* 鏍囬鍜屼俊鎭?*/}
                <div className={cn(
                  "p-3",
                  gridSize === "normal" && "md:p-4"
                )}>
                  <h3
                    itemProp="name"
                    className={cn(
                      "font-medium text-textDark line-clamp-1 mb-2 group-hover:text-brownWarm transition-colors",
                      gridSize === "compact" ? "text-sm" : "text-sm md:text-base"
                    )}
                  >
                    {recipe.title}
                  </h3>

                  {/* 鏍囩鍖?*/}
                  <div className={cn(
                    "flex flex-wrap items-center gap-2",
                    gridSize === "compact" ? "text-[10px]" : "text-xs"
                  )}>
                    {recipe.cuisineName && (
                      <span className="px-2 py-0.5 bg-brownWarm/10 text-brownWarm rounded">
                        {recipe.cuisineName}
                      </span>
                    )}
                    {gridSize === "normal" && (
                      <>
                        {recipe.totalTime > 0 && (
                          <span className="flex items-center gap-1 text-textGray">
                            <Clock className="w-3 h-3" />
                            {recipe.totalTime}
                            {t.minutes}
                          </span>
                        )}
                        {recipe.difficulty && (
                          <span className="flex items-center gap-1 text-textGray">
                            <ChefHat className="w-3 h-3" />
                            {diffLabels[recipe.difficulty as keyof typeof diffLabels] ||
                              recipe.difficulty}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Schema.org 闅愯棌鏁版嵁 */}
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

      {/* 鍔犺浇瀹屾垚鎻愮ず */}
      {!hasFilters && filteredRecipes.length > 0 && (
        <div className="text-center py-8 text-textGray">
          {t.showingAll} {total} {t.recipesText}
        </div>
      )}
    </div>
  );
}
