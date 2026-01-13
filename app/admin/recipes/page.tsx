/**
 * 后台管理 - 食谱列表页
 *
 * 路由：/admin/recipes
 * 显示所有食谱，支持搜索、筛选、多选批量操作
 */

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Loader2, CheckCircle, XCircle, Tag } from "lucide-react";

interface Translation {
  id: string;
  locale: string;
  isReviewed: boolean;
  reviewedAt: string | null;
}

// tags 按类型分组的格式
type TagsByType = Record<string, { id: string; name: string; slug: string }[]>;

interface Recipe {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "pending" | "published" | "archived";
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
  cuisine: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  tags: TagsByType;
  translations?: Translation[];
}

type BatchAction = "publish" | "unpublish" | "approve" | "reject" | "translate";

interface TranslationProgress {
  isOpen: boolean;
  total: number;
  current: number;
  successCount: number;
  failedCount: number;
  currentTitle: string;
  status: "idle" | "translating" | "complete";
  results: { title: string; status: "success" | "failed"; error?: string }[];
  autoApprove: boolean;
}

const PAGE_SIZE = 20;

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [targetLocales, setTargetLocales] = useState<Locale[]>(
    SUPPORTED_LOCALES.filter((loc) => loc !== DEFAULT_LOCALE) as Locale[]
  );

  // 分页状态
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // 翻译进度状态
  const [translateProgress, setTranslateProgress] = useState<TranslationProgress>({
    isOpen: false,
    total: 0,
    current: 0,
    successCount: 0,
    failedCount: 0,
    currentTitle: "",
    status: "idle",
    results: [],
    autoApprove: false,
  });

  // 搜索防抖 (300ms)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // 搜索时重置页码
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // 计算全选状态
  const allSelected = useMemo(() => {
    return recipes.length > 0 && selectedIds.size === recipes.length;
  }, [recipes.length, selectedIds.size]);

  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < recipes.length;
  }, [recipes.length, selectedIds.size]);

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
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (reviewFilter !== "all") {
        params.append("reviewStatus", reviewFilter);
      }
      params.append("includeTranslations", "true");

      const response = await fetch(`/api/admin/recipes?${params}`, {
        signal: controller.signal,
      });
      const data = await response.json();

      if (data.success) {
        setRecipes(data.data);
        // 更新分页信息
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
        // 清空选择
        setSelectedIds(new Set());
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
  }, [page, debouncedSearch, statusFilter, reviewFilter]);

  // 切换单个选择
  const toggleSelect = (id: string) => {
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

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipes.map((r) => r.id)));
    }
  };

  // 流式批量翻译
  const handleStreamTranslate = async (autoApprove: boolean) => {
    if (selectedIds.size === 0) {
      alert("请先选择食谱");
      return;
    }

    if (targetLocales.length === 0) {
      alert("请选择至少一个目标语言");
      return;
    }

    // 打开进度弹窗
    setTranslateProgress({
      isOpen: true,
      total: selectedIds.size,
      current: 0,
      successCount: 0,
      failedCount: 0,
      currentTitle: "",
      status: "translating",
      results: [],
      autoApprove,
    });

    try {
      const response = await fetch("/api/admin/recipes/batch/translate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeIds: Array.from(selectedIds),
          targetLocales,
          autoApprove,
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let pendingData = "";

      const handleEvent = (payload: string) => {
        try {
          const data = JSON.parse(payload);

          if (data.type === "translating") {
            setTranslateProgress((prev) => ({
              ...prev,
              current: data.current,
              currentTitle: data.title,
            }));
          } else if (data.type === "progress") {
            setTranslateProgress((prev) => ({
              ...prev,
              current: data.current,
              successCount: data.successCount,
              failedCount: data.failedCount,
              currentTitle: data.title,
              results: [
                ...prev.results,
                {
                  title: data.title,
                  status: data.status,
                  error: data.error,
                },
              ],
            }));
          } else if (data.type === "complete") {
            setTranslateProgress((prev) => ({
              ...prev,
              status: "complete",
              successCount: data.successCount,
              failedCount: data.failedCount,
            }));
          }
        } catch {
          // 忽略解析错误
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
          buffer = buffer.slice(newlineIndex + 1);

          if (line === "") {
            if (pendingData) {
              handleEvent(pendingData);
              pendingData = "";
            }
          } else if (line.startsWith("data:")) {
            const dataLine = line.slice(5).trimStart();
            pendingData = pendingData ? `${pendingData}\n${dataLine}` : dataLine;
          }

          newlineIndex = buffer.indexOf("\n");
        }
      }

      if (pendingData) {
        handleEvent(pendingData);
      }
    } catch (error) {
      console.error("批量翻译失败:", error);
      setTranslateProgress((prev) => ({
        ...prev,
        status: "complete",
      }));
      alert("批量翻译失败");
    }
  };

  // 关闭翻译进度弹窗
  const closeTranslateProgress = () => {
    setTranslateProgress((prev) => ({
      ...prev,
      isOpen: false,
    }));
    loadRecipes();
    setSelectedIds(new Set());
  };

  // 批量操作
  const handleBatchAction = async (action: BatchAction) => {
    if (selectedIds.size === 0) {
      alert("请先选择食谱");
      return;
    }

    const actionLabels: Record<BatchAction, string> = {
      publish: "发布",
      unpublish: "下架",
      approve: "审核通过",
      reject: "审核拒绝",
      translate: "翻译",
    };

    // 拒绝操作需要输入原因
    let rejectReason: string | undefined;
    if (action === "reject") {
      const reason = prompt(`请输入拒绝 ${selectedIds.size} 个食谱的原因（可选）:`);
      if (reason === null) {
        // 用户点击取消
        return;
      }
      rejectReason = reason || undefined;
    } else if (
      !confirm(`确定要${actionLabels[action]}选中的 ${selectedIds.size} 个食谱吗？`)
    ) {
      return;
    }

    setBatchLoading(true);
    try {
      const response = await fetch("/api/admin/recipes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recipeIds: Array.from(selectedIds),
          targetLocales: action === "translate" ? targetLocales : undefined,
          autoApprove: false,
          rejectReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadRecipes();
      } else {
        alert(data.message || data.error || "操作失败");
      }
    } catch (error) {
      console.error("批量操作失败:", error);
      alert("批量操作失败");
    } finally {
      setBatchLoading(false);
    }
  };

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

  // 发布/下架
  const handleTogglePublish = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      const response = await fetch(`/api/admin/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        alert("更新状态失败");
        return;
      }

      loadRecipes();
    } catch (error) {
      console.error("更新发布状态失败:", error);
      alert("更新状态失败");
    }
  };

  // 获取翻译状态图标
  const getTranslationStatus = (
    translations: Translation[] | undefined,
    locale: string
  ) => {
    if (!translations) return "none";
    const t = translations.find((t) => t.locale === locale);
    if (!t) return "none";
    return t.isReviewed ? "reviewed" : "pending";
  };

  // 筛选条件变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [statusFilter, reviewFilter]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort();
    };
  }, []);

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

        {/* 快捷导航 */}
        <div className="flex gap-3">
          <Link
            href="/admin/generate"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm rounded-lg transition-all"
          >
            AI生成菜谱
          </Link>
        <Link
          href="/admin/review/recipes"
          className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm rounded-lg transition-colors"
        >
          审核管理
        </Link>
          <Link
            href="/admin/config"
            className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 text-sm rounded-lg transition-colors"
          >
            配置管理
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 text-sm rounded-lg transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="bg-white rounded-md shadow-card p-4 mb-4 flex flex-wrap gap-4">
        <Input
          placeholder="搜索食谱名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-sm"
        >
          <option value="all">全部发布状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="pending">待发布</option>
          <option value="archived">已归档</option>
        </select>

        <select
          value={reviewFilter}
          onChange={(e) => setReviewFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-sm"
        >
          <option value="all">全部审核状态</option>
          <option value="approved">已审核</option>
          <option value="pending">待审核</option>
          <option value="rejected">已拒绝</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-textGray">
          <span className="whitespace-nowrap">翻译目标:</span>
          {SUPPORTED_LOCALES.filter((loc) => loc !== DEFAULT_LOCALE).map(
            (loc) => {
              const checked = targetLocales.includes(loc as Locale);
              return (
                <label
                  key={loc}
                  className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setTargetLocales((prev) =>
                        e.target.checked
                          ? [...prev, loc as Locale]
                          : prev.filter((l) => l !== loc)
                      );
                    }}
                  />
                  <span>{loc.toUpperCase()}</span>
                </label>
              );
            }
          )}
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 flex items-center gap-4">
          <span className="text-blue-700 font-medium">
            已选择 {selectedIds.size} 项
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchAction("approve")}
              disabled={batchLoading}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              批量审核通过
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchAction("publish")}
              disabled={batchLoading}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              批量发布
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchAction("unpublish")}
              disabled={batchLoading}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              批量下架
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStreamTranslate(false)}
              disabled={batchLoading || translateProgress.status === "translating"}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              批量翻译 ({targetLocales.map((l) => l.toUpperCase()).join(", ")})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStreamTranslate(true)}
              disabled={batchLoading || translateProgress.status === "translating"}
              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
              title="翻译后自动审核通过"
            >
              翻译+审核
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchAction("reject")}
              disabled={batchLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              批量拒绝
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            取消选择
          </Button>
        </div>
      )}

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
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={allSelected}
                    // @ts-ignore - indeterminate is valid but not in types
                    data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  食谱名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  标签
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  审核状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  发布状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textDark">
                  翻译状态
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
                <tr
                  key={recipe.id}
                  className={`hover:bg-gray-50 ${
                    selectedIds.has(recipe.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedIds.has(recipe.id)}
                      onCheckedChange={() => toggleSelect(recipe.id)}
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
                      {recipe.tags?.cooking_method?.slice(0, 1).map((tag) => (
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
                    {recipe.reviewStatus === "approved" ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-sm">
                        已审核
                      </span>
                    ) : recipe.reviewStatus === "rejected" ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-sm">
                        已拒绝
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-sm">
                        待审核
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {recipe.status === "published" ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-sm">
                        已发布
                      </span>
                    ) : recipe.status === "archived" ? (
                      <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded-sm">
                        已归档
                      </span>
                    ) : recipe.status === "pending" ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-sm">
                        待发布
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-sm">
                        草稿
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {SUPPORTED_LOCALES.filter(
                        (loc) => loc !== DEFAULT_LOCALE
                      ).map((loc) => {
                        const status = getTranslationStatus(
                          recipe.translations,
                          loc
                        );
                        return (
                          <span
                            key={loc}
                            className={`px-2 py-1 text-xs rounded-sm ${
                              status === "reviewed"
                                ? "bg-green-100 text-green-700"
                                : status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                            title={
                              status === "reviewed"
                                ? "已审核"
                                : status === "pending"
                                ? "待审核"
                                : "未翻译"
                            }
                          >
                            {loc.toUpperCase()}
                            {status === "reviewed"
                              ? " ✓"
                              : status === "pending"
                              ? " ⏳"
                              : " ✗"}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-textGray">
                    {new Date(recipe.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/recipe/${recipe.id}`}>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </Link>
                      <Link href={`/admin/recipes/${recipe.id}/edit`}>
                        <Button variant="outline" size="sm">
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleTogglePublish(recipe.id, recipe.status)
                        }
                        className="text-brownWarm hover:text-brownWarm/90 hover:bg-cream"
                      >
                        {recipe.status === "published" ? "下架" : "发布"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        删除
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

      {/* 翻译进度弹窗 */}
      {translateProgress.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-textDark">
                批量翻译{translateProgress.autoApprove ? " (自动审核)" : ""}
              </h3>
              {translateProgress.status === "complete" && (
                <button
                  onClick={closeTranslateProgress}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* 进度条 */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-textGray">
                  {translateProgress.status === "translating"
                    ? `正在翻译: ${translateProgress.currentTitle}`
                    : "翻译完成"}
                </span>
                <span className="text-textDark font-medium">
                  {translateProgress.current} / {translateProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    translateProgress.status === "complete"
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                  style={{
                    width: `${
                      translateProgress.total > 0
                        ? (translateProgress.current / translateProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>成功 {translateProgress.successCount}</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>失败 {translateProgress.failedCount}</span>
                </div>
                {translateProgress.status === "translating" && (
                  <div className="flex items-center gap-1 text-purple-600 ml-auto">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>翻译中...</span>
                  </div>
                )}
              </div>
            </div>

            {/* 结果列表 */}
            {translateProgress.results.length > 0 && (
              <div className="px-6 pb-4">
                <div className="text-sm text-textGray mb-2">翻译结果:</div>
                <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                  {translateProgress.results.map((result, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 flex items-center justify-between text-sm ${
                        result.status === "failed" ? "bg-red-50" : ""
                      }`}
                    >
                      <span className="truncate flex-1">{result.title}</span>
                      {result.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <span className="text-red-500 text-xs flex-shrink-0 ml-2">
                          {result.error || "失败"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 弹窗底部 */}
            {translateProgress.status === "complete" && (
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <Button onClick={closeTranslateProgress}>
                  关闭
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
