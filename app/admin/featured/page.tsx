/**
 * 推荐位管理页面
 *
 * 路由: /admin/featured
 * 功能:
 * - Tab 1: 首页推荐（热门精选、定制精选、图库精选）
 * - Tab 2: 一级聚合页配置（排序、置顶、文案）
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Loader2,
  Save,
  Search,
  X,
  Plus,
  GripVertical,
  Trash2,
  Home,
  LayoutList,
  Flame,
  Sparkles,
  Images,
  ArrowUpDown,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Layers,
} from "lucide-react";

interface Recipe {
  id: string;
  titleZh: string;
  coverImage: string | null;
  cuisine: string | null;
  location: string | null;
  viewCount: number;
  createdAt: string;
  isPublished?: boolean;
}

type RecipeFilter = "hot" | "latest" | "custom";

interface FeaturedConfig {
  recipeIds?: string[];
  pinnedRecipeIds?: string[];
  autoFill?: boolean;
  maxCount?: number;
  defaultSort?: "latest" | "popular";
  h1?: string;
  subtitle?: string;
  footerText?: string;
}

const FEATURED_KEYS = {
  HOME_HOT: "homeFeaturedHot",
  HOME_CUSTOM: "homeFeaturedCustom",
  HOME_GALLERY: "homeFeaturedGallery",
  RECIPE_PAGE: "recipePageConfig",
};

// 区块配置类型
interface AggregationBlockConfig {
  type: string;
  enabled: boolean;
  order: number;
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  cardCount: number;
  minThreshold: number;
  collapsed: boolean;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  cuisine: "菜系",
  region: "地区",
  scene: "场景",
  method: "烹饪方式",
  taste: "口味",
  crowd: "人群",
  occasion: "场合",
  ingredient: "食材",
  theme: "主题",
};

export default function FeaturedPage() {
  const [activeTab, setActiveTab] = useState<"home" | "recipe">("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 配置数据
  const [configs, setConfigs] = useState<Record<string, FeaturedConfig>>({});
  const [recipesMap, setRecipesMap] = useState<Record<string, Recipe>>({});

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 可选食谱列表
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>("hot");
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // 区块配置状态
  const [aggregationBlocks, setAggregationBlocks] = useState<AggregationBlockConfig[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState(false);

  // 加载配置
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/featured");
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data);
        setRecipesMap(data.recipesMap || {});
      }
    } catch (error) {
      console.error("加载配置失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载可选食谱列表
  const loadAvailableRecipes = useCallback(async (filter: RecipeFilter, query?: string) => {
    setLoadingRecipes(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (query) params.set("q", query);
      if (filter === "latest") params.set("sort", "latest");
      if (filter === "custom") params.set("custom", "true");

      const response = await fetch(`/api/admin/featured/search?${params}`);
      const data = await response.json();
      if (data.success) {
        setAvailableRecipes(data.data);
      }
    } catch (error) {
      console.error("加载食谱失败:", error);
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  // 加载区块配置
  const loadAggregationBlocks = useCallback(async () => {
    setLoadingBlocks(true);
    try {
      const response = await fetch("/api/admin/aggregation/blocks");
      const data = await response.json();
      if (data.success) {
        setAggregationBlocks(data.data);
      }
    } catch (error) {
      console.error("加载区块配置失败:", error);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // 保存区块配置
  const saveAggregationBlocks = async () => {
    setSavingBlocks(true);
    try {
      const response = await fetch("/api/admin/aggregation/blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: aggregationBlocks }),
      });
      const data = await response.json();
      if (data.success) {
        alert("区块配置保存成功");
      } else {
        alert(data.error?.message || "保存失败");
      }
    } catch (error) {
      console.error("保存区块配置失败:", error);
      alert("保存失败");
    } finally {
      setSavingBlocks(false);
    }
  };

  // 更新单个区块配置
  const updateBlock = (type: string, updates: Partial<AggregationBlockConfig>) => {
    setAggregationBlocks((prev) =>
      prev.map((block) =>
        block.type === type ? { ...block, ...updates } : block
      )
    );
  };

  // 移动区块顺序
  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...aggregationBlocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newBlocks.length) return;

    // 交换 order 值
    const tempOrder = newBlocks[index].order;
    newBlocks[index].order = newBlocks[newIndex].order;
    newBlocks[newIndex].order = tempOrder;

    // 交换位置
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setAggregationBlocks(newBlocks);
  };

  useEffect(() => {
    loadConfigs();
    loadAggregationBlocks();
  }, [loadConfigs, loadAggregationBlocks]);

  useEffect(() => {
    loadAvailableRecipes(recipeFilter, searchQuery);
  }, [recipeFilter, loadAvailableRecipes]);

  // 搜索食谱
  const handleSearch = async (query: string, excludeIds: string[]) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        exclude: excludeIds.join(","),
        limit: "10",
      });
      const response = await fetch(`/api/admin/featured/search?${params}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("搜索失败:", error);
    } finally {
      setSearching(false);
    }
  };

  // 保存配置
  const saveConfig = async (key: string, value: FeaturedConfig) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      if (data.success) {
        await loadConfigs();
        alert("保存成功");
      } else {
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 添加食谱到列表
  const addRecipe = (key: string, recipe: Recipe, field: "recipeIds" | "pinnedRecipeIds" = "recipeIds") => {
    const config = configs[key] || {};
    const ids = config[field] || [];
    if (!ids.includes(recipe.id)) {
      setConfigs({
        ...configs,
        [key]: { ...config, [field]: [...ids, recipe.id] },
      });
      setRecipesMap({ ...recipesMap, [recipe.id]: recipe });
    }
    setSearchQuery("");
    setSearchResults([]);
    setActiveSection(null);
  };

  // 移除食谱
  const removeRecipe = (key: string, recipeId: string, field: "recipeIds" | "pinnedRecipeIds" = "recipeIds") => {
    const config = configs[key] || {};
    const ids = config[field] || [];
    setConfigs({
      ...configs,
      [key]: { ...config, [field]: ids.filter((id) => id !== recipeId) },
    });
  };

  // 移动食谱顺序
  const moveRecipe = (key: string, index: number, direction: "up" | "down", field: "recipeIds" | "pinnedRecipeIds" = "recipeIds") => {
    const config = configs[key] || {};
    const ids = [...(config[field] || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    setConfigs({
      ...configs,
      [key]: { ...config, [field]: ids },
    });
  };

  // 检查食谱是否已添加到某个配置
  const isRecipeAdded = (recipeId: string, key: string, field: "recipeIds" | "pinnedRecipeIds" = "recipeIds") => {
    const config = configs[key] || {};
    const ids = config[field] || [];
    return ids.includes(recipeId);
  };

  // 渲染食谱选择器（左侧已选，右侧可选）
  const renderRecipePicker = (
    key: string,
    title: string,
    description: string,
    field: "recipeIds" | "pinnedRecipeIds" = "recipeIds"
  ) => {
    const config = configs[key] || {};
    const ids = config[field] || [];

    return (
      <div className="bg-white rounded-lg border border-lightGray p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-textDark">{title}</h3>
            <p className="text-sm text-textGray">{description}</p>
          </div>
          <span className="text-sm text-textGray">已选 {ids.length} 个</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：已选食谱 */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-textDark">已选食谱（拖拽排序）</div>
            {ids.length === 0 ? (
              <div className="text-sm text-textGray py-8 text-center border-2 border-dashed border-lightGray rounded-lg">
                从右侧点击添加食谱
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {ids.map((id, index) => {
                  const recipe = recipesMap[id];
                  if (!recipe) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3 bg-cream/50 rounded-lg group"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" />
                      <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                        {recipe.coverImage && (
                          <Image
                            src={recipe.coverImage}
                            alt={recipe.titleZh}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-textDark truncate">
                          {recipe.titleZh}
                        </div>
                        <div className="text-xs text-textGray">
                          {recipe.cuisine || recipe.location || "未分类"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveRecipe(key, index, "up", field)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="上移"
                        >
                          <ArrowUpDown className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          onClick={() => moveRecipe(key, index, "down", field)}
                          disabled={index === ids.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="下移"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeRecipe(key, id, field)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="移除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 右侧：可选食谱 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-textDark">点击添加</div>
              <div className="flex gap-1">
                {[
                  { key: "hot" as const, label: "热门" },
                  { key: "latest" as const, label: "最新" },
                  { key: "custom" as const, label: "AI定制" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setRecipeFilter(filter.key)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      recipeFilter === filter.key
                        ? "bg-brownWarm text-white"
                        : "bg-cream text-textGray hover:bg-brownWarm/10"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索食谱..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadAvailableRecipes(recipeFilter, e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-lightGray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    loadAvailableRecipes(recipeFilter);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* 食谱网格 */}
            {loadingRecipes ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-brownWarm" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
                {availableRecipes.map((recipe) => {
                  const added = isRecipeAdded(recipe.id, key, field);
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        if (!added) {
                          addRecipe(key, recipe, field);
                        }
                      }}
                      disabled={added}
                      className={`relative p-2 rounded-lg text-left transition-all ${
                        added
                          ? "bg-green-50 border-2 border-green-200 opacity-60"
                          : "bg-cream/50 hover:bg-brownWarm/10 border-2 border-transparent"
                      }`}
                    >
                      <div className="aspect-[4/3] rounded bg-gray-200 overflow-hidden mb-2">
                        {recipe.coverImage && (
                          <Image
                            src={recipe.coverImage}
                            alt={recipe.titleZh}
                            width={160}
                            height={120}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="text-xs font-medium text-textDark line-clamp-2">
                        {recipe.titleZh}
                      </div>
                      <div className="text-xs text-textGray mt-1">
                        {recipe.viewCount} 浏览
                      </div>
                      {added && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      {!added && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brownWarm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          推荐位管理
        </h1>
        <p className="text-textGray">管理首页和聚合页的推荐食谱与配置</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b border-lightGray">
        <button
          onClick={() => setActiveTab("home")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "home"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <Home className="w-4 h-4" />
          首页推荐
        </button>
        <button
          onClick={() => setActiveTab("recipe")}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === "recipe"
              ? "text-brownWarm border-b-2 border-brownWarm"
              : "text-textGray hover:text-textDark"
          }`}
        >
          <LayoutList className="w-4 h-4" />
          一级聚合页 /recipe
        </button>
      </div>

      {/* 首页推荐 Tab */}
      {activeTab === "home" && (
        <div className="space-y-6">
          {/* 热门精选 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-medium text-textDark">热门精选</h2>
            </div>
            {renderRecipePicker(
              FEATURED_KEYS.HOME_HOT,
              "首页「本周精选家常菜」区块",
              "手动选择展示的食谱，不足时自动用热门补充"
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={configs[FEATURED_KEYS.HOME_HOT]?.autoFill ?? true}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      [FEATURED_KEYS.HOME_HOT]: {
                        ...configs[FEATURED_KEYS.HOME_HOT],
                        autoFill: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-textGray">不足时自动用热门食谱补充</span>
              </label>
              <button
                onClick={() => saveConfig(FEATURED_KEYS.HOME_HOT, configs[FEATURED_KEYS.HOME_HOT] || {})}
                disabled={saving}
                className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>

          {/* 定制精选 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-medium text-textDark">定制精选</h2>
            </div>
            {renderRecipePicker(
              FEATURED_KEYS.HOME_CUSTOM,
              "首页「AI定制精选」区块",
              "展示用户定制的精选食谱"
            )}
            <div className="flex justify-end">
              <button
                onClick={() => saveConfig(FEATURED_KEYS.HOME_CUSTOM, configs[FEATURED_KEYS.HOME_CUSTOM] || {})}
                disabled={saving}
                className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>

          {/* 图库精选 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-medium text-textDark">图库精选</h2>
            </div>
            {renderRecipePicker(
              FEATURED_KEYS.HOME_GALLERY,
              "首页「美食图库」区块",
              "展示精美的食谱封面图"
            )}
            <div className="flex justify-end">
              <button
                onClick={() => saveConfig(FEATURED_KEYS.HOME_GALLERY, configs[FEATURED_KEYS.HOME_GALLERY] || {})}
                disabled={saving}
                className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一级聚合页 Tab */}
      {activeTab === "recipe" && (
        <div className="space-y-6">
          {/* 区块配置 */}
          <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brownWarm" />
                <h2 className="text-xl font-medium text-textDark">聚合区块配置</h2>
              </div>
              <button
                onClick={saveAggregationBlocks}
                disabled={savingBlocks}
                className="px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingBlocks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存区块配置
              </button>
            </div>
            <p className="text-sm text-textGray">
              配置一级聚合页 /recipe 的浏览区块，仅显示达标的集合（已发布且食谱数 &gt;= 最低要求）
            </p>

            {loadingBlocks ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-brownWarm" />
              </div>
            ) : (
              <div className="space-y-3">
                {aggregationBlocks.map((block, index) => (
                  <div
                    key={block.type}
                    className={`border rounded-lg p-4 ${
                      block.enabled ? "border-brownWarm/30 bg-brownWarm/5" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* 排序按钮 */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveBlock(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveBlock(index, "down")}
                          disabled={index === aggregationBlocks.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 启用开关 */}
                      <button
                        onClick={() => updateBlock(block.type, { enabled: !block.enabled })}
                        className={`p-2 rounded-lg transition-colors ${
                          block.enabled
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                        title={block.enabled ? "点击禁用" : "点击启用"}
                      >
                        {block.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      {/* 区块信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-textDark">
                            {BLOCK_TYPE_LABELS[block.type] || block.type}
                          </span>
                          <span className="text-xs text-textGray bg-gray-100 px-2 py-0.5 rounded">
                            {block.type}
                          </span>
                        </div>
                        <div className="text-sm text-textGray mt-1">
                          {block.title}
                        </div>
                      </div>

                      {/* 卡片数量 */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-textGray">卡片数:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={block.cardCount}
                          onChange={(e) =>
                            updateBlock(block.type, { cardCount: parseInt(e.target.value) || 6 })
                          }
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                      </div>

                      {/* 默认折叠 */}
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={block.collapsed}
                          onChange={(e) => updateBlock(block.type, { collapsed: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-textGray">默认折叠</span>
                      </label>
                    </div>

                    {/* 展开的详细配置 */}
                    {block.enabled && (
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-textGray mb-1">中文标题</label>
                          <input
                            type="text"
                            value={block.title}
                            onChange={(e) => updateBlock(block.type, { title: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-textGray mb-1">英文标题</label>
                          <input
                            type="text"
                            value={block.titleEn || ""}
                            onChange={(e) => updateBlock(block.type, { titleEn: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-textGray mb-1">中文副标题</label>
                          <input
                            type="text"
                            value={block.subtitle || ""}
                            onChange={(e) => updateBlock(block.type, { subtitle: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-textGray mb-1">英文副标题</label>
                          <input
                            type="text"
                            value={block.subtitleEn || ""}
                            onChange={(e) => updateBlock(block.type, { subtitleEn: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 基本配置 */}
          <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
            <h2 className="text-xl font-medium text-textDark">基本配置</h2>

            {/* 排序设置 */}
            <div>
              <label className="block text-sm font-medium text-textDark mb-3">
                食谱列表默认排序
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="defaultSort"
                    value="latest"
                    checked={(configs[FEATURED_KEYS.RECIPE_PAGE]?.defaultSort ?? "latest") === "latest"}
                    onChange={() =>
                      setConfigs({
                        ...configs,
                        [FEATURED_KEYS.RECIPE_PAGE]: {
                          ...configs[FEATURED_KEYS.RECIPE_PAGE],
                          defaultSort: "latest",
                        },
                      })
                    }
                    className="text-brownWarm focus:ring-brownWarm"
                  />
                  <span className="text-sm">最新发布</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="defaultSort"
                    value="popular"
                    checked={configs[FEATURED_KEYS.RECIPE_PAGE]?.defaultSort === "popular"}
                    onChange={() =>
                      setConfigs({
                        ...configs,
                        [FEATURED_KEYS.RECIPE_PAGE]: {
                          ...configs[FEATURED_KEYS.RECIPE_PAGE],
                          defaultSort: "popular",
                        },
                      })
                    }
                    className="text-brownWarm focus:ring-brownWarm"
                  />
                  <span className="text-sm">最热门</span>
                </label>
              </div>
            </div>
          </div>

          {/* 置顶食谱 */}
          {renderRecipePicker(
            FEATURED_KEYS.RECIPE_PAGE,
            "置顶食谱",
            "显示在食谱列表最前面",
            "pinnedRecipeIds"
          )}

          {/* 文案配置 */}
          <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
            <h2 className="text-xl font-medium text-textDark">文案配置</h2>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                页面标题 (H1)
              </label>
              <input
                type="text"
                value={configs[FEATURED_KEYS.RECIPE_PAGE]?.h1 ?? "中国美食食谱大全"}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    [FEATURED_KEYS.RECIPE_PAGE]: {
                      ...configs[FEATURED_KEYS.RECIPE_PAGE],
                      h1: e.target.value,
                    },
                  })
                }
                placeholder="中国美食食谱大全"
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                副标题
              </label>
              <input
                type="text"
                value={configs[FEATURED_KEYS.RECIPE_PAGE]?.subtitle ?? ""}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    [FEATURED_KEYS.RECIPE_PAGE]: {
                      ...configs[FEATURED_KEYS.RECIPE_PAGE],
                      subtitle: e.target.value,
                    },
                  })
                }
                placeholder="系统整理中国各地家常菜做法，按菜系/场景快速找到适合做的菜。"
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                底部收口文案（SEO）
              </label>
              <textarea
                value={configs[FEATURED_KEYS.RECIPE_PAGE]?.footerText ?? ""}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    [FEATURED_KEYS.RECIPE_PAGE]: {
                      ...configs[FEATURED_KEYS.RECIPE_PAGE],
                      footerText: e.target.value,
                    },
                  })
                }
                rows={4}
                placeholder="这里收录了中国各地的家常菜谱，从川菜到粤菜，从快手菜到宴客菜，帮你解决「今天吃什么」的烦恼。每道食谱都经过专业团队审核，配有详细步骤和精美图片，让你轻松做出美味佳肴。"
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              />
              <p className="text-xs text-textGray mt-1">建议 100-200 字，用于 SEO 语义闭环</p>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => saveConfig(FEATURED_KEYS.RECIPE_PAGE, configs[FEATURED_KEYS.RECIPE_PAGE] || {})}
              disabled={saving}
              className="px-6 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
