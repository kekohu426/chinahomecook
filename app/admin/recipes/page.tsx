/**
 * 后台管理 - 食谱列表页
 *
 * 路由：/admin/recipes
 * 显示所有食谱，支持搜索、筛选、编辑、删除
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Edit2, Trash2 } from "lucide-react";

// tags 按类型分组的格式
type TagsByType = Record<string, { id: string; name: string; slug: string }[]>;

interface Recipe {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "pending" | "published" | "archived";
  reviewStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  cuisine: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  collection: { id: string; name: string; type: string } | null;
  tags: TagsByType;
}

interface CuisineOption {
  id: string;
  name: string;
  slug: string;
}

interface LocationOption {
  id: string;
  name: string;
  slug: string;
}

interface CollectionOption {
  id: string;
  name: string;
  type: string;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 20;

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 新增筛选条件
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");

  // 标签筛选
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [tasteFilter, setTasteFilter] = useState<string>("all");
  const [crowdFilter, setCrowdFilter] = useState<string>("all");
  const [occasionFilter, setOccasionFilter] = useState<string>("all");

  // 筛选选项
  const [cuisineOptions, setCuisineOptions] = useState<CuisineOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<CollectionOption[]>([]);

  // 标签选项
  const [sceneOptions, setSceneOptions] = useState<TagOption[]>([]);
  const [methodOptions, setMethodOptions] = useState<TagOption[]>([]);
  const [tasteOptions, setTasteOptions] = useState<TagOption[]>([]);
  const [crowdOptions, setCrowdOptions] = useState<TagOption[]>([]);
  const [occasionOptions, setOccasionOptions] = useState<TagOption[]>([]);

  // 分页状态
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<string>("");
  const [batchLoading, setBatchLoading] = useState(false);

  // 搜索防抖 (300ms)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // 加载筛选选项
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [cuisinesRes, locationsRes, collectionsRes, tagsRes] =
          await Promise.all([
            fetch("/api/config/cuisines"),
            fetch("/api/config/locations"),
            fetch("/api/admin/collections?page=1&pageSize=200"),
            fetch("/api/admin/config/tags/available"),
          ]);

        const [cuisinesData, locationsData, collectionsData, tagsData] =
          await Promise.all([
            cuisinesRes.json(),
            locationsRes.json(),
            collectionsRes.json(),
            tagsRes.json(),
          ]);

        if (cuisinesData.success) setCuisineOptions(cuisinesData.data || []);
        if (locationsData.success) setLocationOptions(locationsData.data || []);
        if (collectionsData.success) setCollectionOptions(collectionsData.data || []);

        if (tagsData.success && tagsData.data) {
          setSceneOptions(tagsData.data.scenes || []);
          setMethodOptions(tagsData.data.cookingMethods || []);
          setTasteOptions(tagsData.data.tastes || []);
          setCrowdOptions(tagsData.data.crowds || []);
          setOccasionOptions(tagsData.data.occasions || []);
        }
      } catch (error) {
        console.error("加载筛选选项失败:", error);
      }
    }
    loadFilterOptions();
  }, []);

  // 加载食谱列表
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", PAGE_SIZE.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (cuisineFilter !== "all") params.append("cuisineId", cuisineFilter);
      if (locationFilter !== "all") params.append("locationId", locationFilter);
      if (collectionFilter !== "all") params.append("collectionId", collectionFilter);
      // 标签筛选
      if (sceneFilter !== "all") params.append("sceneId", sceneFilter);
      if (methodFilter !== "all") params.append("methodId", methodFilter);
      if (tasteFilter !== "all") params.append("tasteId", tasteFilter);
      if (crowdFilter !== "all") params.append("crowdId", crowdFilter);
      if (occasionFilter !== "all") params.append("occasionId", occasionFilter);

      const response = await fetch(`/api/admin/recipes?${params}`, {
        signal: controller.signal,
      });
      const data = await response.json();

      if (data.success) {
        setRecipes(data.data);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      console.error("加载食谱失败:", error);
    } finally {
      if (listAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [page, debouncedSearch, statusFilter, cuisineFilter, locationFilter, collectionFilter, sceneFilter, methodFilter, tasteFilter, crowdFilter, occasionFilter]);

  // 删除食谱
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除《${title}》吗？`)) return;

    try {
      const response = await fetch(`/api/admin/recipes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadRecipes();
      } else {
        alert("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  // 筛选条件变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [statusFilter, cuisineFilter, locationFilter, collectionFilter, sceneFilter, methodFilter, tasteFilter, crowdFilter, occasionFilter]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const ids = new Set(recipes.map((r) => r.id));
    setSelectedIds((prev) => new Set([...prev].filter((id) => ids.has(id))));
  }, [recipes]);

  const toggleSelectAll = () => {
    if (recipes.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = recipes.every((r) => next.has(r.id));
      if (allSelected) {
        recipes.forEach((r) => next.delete(r.id));
      } else {
        recipes.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchAction = async () => {
    if (!batchAction) {
      alert("请选择批量操作类型");
      return;
    }
    if (selectedIds.size === 0) {
      alert("请先选择食谱");
      return;
    }

    let rejectReason: string | undefined;
    if (batchAction === "reject") {
      const reason = prompt("请输入拒绝原因（可选）:");
      if (reason === null) return;
      rejectReason = reason.trim() || undefined;
    } else {
      const actionLabelMap: Record<string, string> = {
        publish: "发布",
        unpublish: "下架",
        approve: "审核通过",
        reject: "拒绝",
      };
      if (!confirm(`确定要批量${actionLabelMap[batchAction] || "操作"}所选食谱吗？`)) {
        return;
      }
    }

    setBatchLoading(true);
    try {
      const response = await fetch("/api/admin/recipes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: batchAction,
          recipeIds: Array.from(selectedIds),
          rejectReason,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "批量操作失败");
      }

      alert(data.message || "批量操作成功");
      setSelectedIds(new Set());
      setBatchAction("");
      loadRecipes();
    } catch (error) {
      console.error("批量操作失败:", error);
      alert(error instanceof Error ? error.message : "批量操作失败");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div>
      {/* 页头 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-serif font-medium text-textDark">
            食谱管理
            {total > 0 && (
              <span className="ml-3 text-lg font-normal text-textGray">
                共 {total} 个食谱
              </span>
            )}
          </h1>
          <Link href="/admin/recipes/new">
            <Button className="bg-brownWarm hover:bg-brownWarm/90">
              + 创建新食谱
            </Button>
          </Link>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="bg-white rounded-md shadow-card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="搜索食谱名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="pending">待审核</option>
            <option value="archived">已归档</option>
          </select>

          <select
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部菜系</option>
            {cuisineOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部地点</option>
            {locationOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部聚合页</option>
            {collectionOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* 标签筛选 */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
          <select
            value={sceneFilter}
            onChange={(e) => setSceneFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部场景</option>
            {sceneOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部烹饪方法</option>
            {methodOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={tasteFilter}
            onChange={(e) => setTasteFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部口味</option>
            {tasteOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={crowdFilter}
            onChange={(e) => setCrowdFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部人群</option>
            {crowdOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={occasionFilter}
            onChange={(e) => setOccasionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
          >
            <option value="all">全部场合</option>
            {occasionOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 食谱列表 */}
      {loading ? (
        <div className="text-center py-12 text-textGray">加载中...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-textGray">
          暂无食谱
          <Link
            href="/admin/recipes/new"
            className="block mt-4 text-brownWarm hover:underline"
          >
            创建第一个食谱
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-3 text-sm text-textGray">
              <span>已选 {selectedIds.size} 条</span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-brownWarm hover:underline"
              >
                清空选择
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={batchAction}
                onChange={(e) => setBatchAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
              >
                <option value="">批量操作</option>
                <option value="approve">审核通过</option>
                <option value="reject">审核拒绝</option>
                <option value="publish">发布</option>
                <option value="unpublish">下架为草稿</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBatchAction}
                disabled={batchLoading}
              >
                {batchLoading ? "处理中..." : "执行"}
              </Button>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark w-10">
                  <input
                    type="checkbox"
                    checked={recipes.length > 0 && recipes.every((r) => selectedIds.has(r.id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  食谱名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  分类/标签
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  聚合页
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  创建时间
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-textDark">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(recipe.id)}
                      onChange={() => toggleSelectOne(recipe.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-textDark">
                        {recipe.title}
                      </div>
                      <div className="text-sm text-textGray">
                        {recipe.slug}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {recipe.cuisine && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                          {recipe.cuisine.name}
                        </span>
                      )}
                      {recipe.location && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          {recipe.location.name}
                        </span>
                      )}
                      {/* 场景标签 */}
                      {recipe.tags?.scene?.slice(0, 1).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {/* 烹饪方法标签 */}
                      {recipe.tags?.method?.slice(0, 1).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {/* 口味标签 */}
                      {recipe.tags?.taste?.slice(0, 1).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-xs rounded bg-pink-100 text-pink-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {/* 显示更多标签数量 */}
                      {(() => {
                        const totalTags = Object.values(recipe.tags || {}).flat().length;
                        return totalTags > 3 ? (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                            +{totalTags - 3}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {recipe.collection ? (
                      <Link
                        href={`/admin/collections/${recipe.collection.id}`}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded hover:bg-indigo-200"
                      >
                        {recipe.collection.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {recipe.status === "published" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-sm inline-block w-fit">
                          已发布
                        </span>
                      ) : recipe.status === "archived" ? (
                        <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded-sm inline-block w-fit">
                          已归档
                        </span>
                      ) : recipe.status === "pending" ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-sm inline-block w-fit">
                          待审核
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-sm inline-block w-fit">
                          草稿
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-textGray">
                    {new Date(recipe.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/recipes/${recipe.id}/preview`} target="_blank">
                        <Button variant="outline" size="sm" title="预览">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/recipes/${recipe.id}/edit`}>
                        <Button variant="outline" size="sm" title="编辑">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-textGray">
                显示 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} / 共 {total} 条
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm text-textDark">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
