/**
 * 手动选择模式组件
 *
 * 从食谱库中手动挑选食谱
 */

"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { CollectionDetail } from "@/lib/types/collection-api";

interface ManualSelectModeProps {
  collection: CollectionDetail;
  onRefresh: () => Promise<void>;
}

interface RecipeSearchItem {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface MatchedRecipe {
  id: string;
  title: string;
  titleZh?: string;
  coverImage: string | null;
  status: string;
  isPinned: boolean;
  isExcluded: boolean;
}

export default function ManualSelectMode({ collection, onRefresh }: ManualSelectModeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [recipes, setRecipes] = useState<MatchedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [batchAdding, setBatchAdding] = useState(false);

  // 加载已添加的食谱
  useEffect(() => {
    loadRecipes();
  }, [collection.id]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}/recipes?pageSize=50`);
      const data = await response.json();
      if (data.success) {
        setRecipes(data.data?.recipes || []);
      }
    } catch (error) {
      console.error("加载食谱失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索食谱
  useEffect(() => {
    const keyword = searchQuery.trim();
    if (keyword.length < 1) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams();
        params.set("search", keyword);
        params.set("limit", "10");
        const response = await fetch(`/api/admin/recipes?${params.toString()}`);
        const data = await response.json();
        if (!cancelled && data.success) {
          setSearchResults(data.data || []);
        }
      } catch (error) {
        console.error("搜索失败:", error);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // 添加食谱
  const handleAddRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", recipeId }),
      });
      const data = await response.json();
      if (data.success) {
        await onRefresh();
        await loadRecipes();
        setSearchQuery("");
        setSearchResults([]);
      } else {
        alert(data.error || "添加失败");
      }
    } catch (error) {
      console.error("添加失败:", error);
      alert("添加失败");
    }
  };

  // 批量添加食谱
  const handleBatchAdd = async () => {
    if (selectedRecipeIds.length === 0) {
      alert("请先选择要添加的食谱");
      return;
    }

    setBatchAdding(true);
    try {
      // 逐个添加（因为 API 是单个添加的）
      let successCount = 0;
      let failCount = 0;

      for (const recipeId of selectedRecipeIds) {
        try {
          const response = await fetch(`/api/admin/collections/${collection.id}/operations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pin", recipeId }),
          });
          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      await onRefresh();
      await loadRecipes();
      setSelectedRecipeIds([]);
      setSearchQuery("");
      setSearchResults([]);

      if (failCount === 0) {
        alert(`成功添加 ${successCount} 个食谱`);
      } else {
        alert(`成功添加 ${successCount} 个，失败 ${failCount} 个`);
      }
    } catch (error) {
      console.error("批量添加失败:", error);
      alert("批量添加失败");
    } finally {
      setBatchAdding(false);
    }
  };

  // 切换选中状态
  const toggleSelection = (recipeId: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const availableRecipes = searchResults.filter(
      (r) => !collection.pinnedRecipeIds.includes(r.id) && !collection.excludedRecipeIds.includes(r.id)
    );

    if (selectedRecipeIds.length === availableRecipes.length) {
      setSelectedRecipeIds([]);
    } else {
      setSelectedRecipeIds(availableRecipes.map((r) => r.id));
    }
  };

  // 移除食谱
  const handleRemoveRecipe = async (recipeId: string) => {
    if (!confirm("确定要移除这道食谱吗？")) return;

    try {
      const response = await fetch(`/api/admin/collections/${collection.id}/pin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: [recipeId] }),
      });
      if (response.ok) {
        await onRefresh();
        await loadRecipes();
      }
    } catch (error) {
      console.error("移除失败:", error);
    }
  };

  const pinnedRecipes = recipes.filter(r => r.isPinned);

  return (
    <div className="space-y-6">
      {/* 当前状态 */}
      <div className="bg-white rounded-lg border border-cream p-6">
        <h4 className="text-base font-medium text-textDark mb-4">当前状态</h4>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pinnedRecipes.length}</div>
            <div className="text-xs text-textGray">已手动添加</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {pinnedRecipes.filter(r => r.status === "published").length}
            </div>
            <div className="text-xs text-textGray">已发布</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {pinnedRecipes.filter(r => r.status === "pending").length}
            </div>
            <div className="text-xs text-textGray">待审核</div>
          </div>
        </div>

        {/* 达标状态 */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          {collection.publishedCount >= collection.minRequired ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">
                已达标！当前 {collection.publishedCount} 道，最低要求 {collection.minRequired} 道
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                还需 {collection.minRequired - collection.publishedCount} 道食谱才能达标
              </span>
            </>
          )}
        </div>
      </div>

      {/* 搜索添加 */}
      <div className="bg-white rounded-lg border border-cream p-6">
        <h4 className="text-base font-medium text-textDark mb-4">从食谱库中选择</h4>

        <div className="relative mb-4">
          <Search className="h-4 w-4 text-textGray absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入菜名或 slug 搜索..."
            className="w-full pl-9 pr-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm text-sm"
          />
          {searching && (
            <Loader2 className="h-4 w-4 text-textGray absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
          )}
        </div>

        {searchResults.length > 0 && (
          <div>
            {/* 批量操作栏 */}
            <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedRecipeIds.length > 0 &&
                      selectedRecipeIds.length ===
                        searchResults.filter(
                          (r) =>
                            !collection.pinnedRecipeIds.includes(r.id) &&
                            !collection.excludedRecipeIds.includes(r.id)
                        ).length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-brownWarm border-cream rounded focus:ring-brownWarm"
                  />
                  <span className="text-sm text-textGray">全选</span>
                </label>
                {selectedRecipeIds.length > 0 && (
                  <span className="text-sm text-textGray">
                    已选中 {selectedRecipeIds.length} 个
                  </span>
                )}
              </div>
              {selectedRecipeIds.length > 0 && (
                <button
                  onClick={handleBatchAdd}
                  disabled={batchAdding}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {batchAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      批量添加 ({selectedRecipeIds.length})
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="border border-cream rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-textGray w-10"></th>
                    <th className="px-3 py-2 text-left text-xs text-textGray">菜名</th>
                    <th className="px-3 py-2 text-left text-xs text-textGray">状态</th>
                    <th className="px-3 py-2 text-right text-xs text-textGray">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream">
                  {searchResults.map((recipe) => {
                    const alreadyAdded = collection.pinnedRecipeIds.includes(recipe.id);
                    const isExcluded = collection.excludedRecipeIds.includes(recipe.id);
                    const isSelected = selectedRecipeIds.includes(recipe.id);
                    const canSelect = !alreadyAdded && !isExcluded;

                    return (
                      <tr key={recipe.id} className={isSelected ? "bg-blue-50" : ""}>
                        <td className="px-3 py-2">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(recipe.id)}
                              className="h-4 w-4 text-brownWarm border-cream rounded focus:ring-brownWarm"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-textDark">
                          {recipe.title}
                          <div className="text-xs text-textGray">{recipe.slug}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-textGray">
                          {recipe.status === "published" ? "已发布" : recipe.status === "pending" ? "待审核" : "草稿"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {alreadyAdded ? (
                            <span className="text-xs text-green-600">已添加</span>
                          ) : isExcluded ? (
                            <span className="text-xs text-red-600">已排除</span>
                          ) : (
                            <button
                              onClick={() => handleAddRecipe(recipe.id)}
                              className="text-xs text-brownWarm hover:underline"
                            >
                              添加
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {searchQuery.trim().length >= 1 && !searching && searchResults.length === 0 && (
          <div className="text-center py-4 text-sm text-textGray">
            未找到匹配食谱
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 手动添加的食谱会显示在下方的“已加入的食谱”列表中，并标注为“手动添加”
        </p>
      </div>
    </div>
  );
}
