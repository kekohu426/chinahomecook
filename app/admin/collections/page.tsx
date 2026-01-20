/**
 * 二级聚合页管理 - 列表页面
 *
 * 路由: /admin/collections
 * 功能: 显示所有聚合页，支持按类型/状态/达标筛选，显示进度和达标状态
 *
 * 核心口径：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 进度：progress = publishedCount / targetCount * 100
 * 3. 列表使用缓存字段 cached*
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Layers,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import type { CollectionListItem } from "@/lib/types/collection-api";
import {
  CollectionTypeLabel,
  CollectionStatusLabel,
  getQualifiedStatusInfo,
} from "@/lib/types/collection";

// 类型选项
const TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "cuisine", label: "菜系" },
  { value: "region", label: "区域" },
  { value: "scene", label: "场景" },
  { value: "method", label: "烹饪方式" },
  { value: "taste", label: "口味" },
  { value: "crowd", label: "人群" },
  { value: "occasion", label: "场合" },
  { value: "ingredient", label: "食材" },
  { value: "theme", label: "主题" },
];

// 状态选项
const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已归档" },
];

// 达标选项
const QUALIFIED_OPTIONS = [
  { value: "", label: "全部" },
  { value: "true", label: "已达标" },
  { value: "false", label: "未达标" },
];

export default function CollectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const typeFilter = searchParams.get("type") || "";
  const statusFilter = searchParams.get("status") || "";
  const qualifiedFilter = searchParams.get("qualified") || "";
  const filter = searchParams.get("filter") || ""; // featured | landing

  const loadCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (qualifiedFilter) params.set("qualified", qualifiedFilter);
      if (filter) params.set("filter", filter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/collections?${params}`);
      const data = await response.json();
      if (data.success) {
        setCollections(data.data);
        if (data.meta) {
          setTotalPages(data.meta.totalPages);
          setTotal(data.meta.total);
        }
      }
    } catch (error) {
      console.error("加载聚合页列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, qualifiedFilter, filter, searchQuery, page]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setPage(1); // 重置页码
    router.push(`/admin/collections?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPage(1);
    router.push("/admin/collections");
  };

  // 统计数据
  const stats = {
    total: total,
    qualified: collections.filter((c) => c.qualifiedStatus === "qualified").length,
    near: collections.filter((c) => c.qualifiedStatus === "near").length,
    unqualified: collections.filter((c) => c.qualifiedStatus === "unqualified").length,
  };

  const hasFilters = typeFilter || statusFilter || qualifiedFilter || searchQuery;

  // 获取页面标题
  const getPageTitle = () => {
    if (filter === "featured") return "⭐ 精品聚合页";
    if (filter === "landing") return "📄 落地页";
    return "二级聚合页管理";
  };

  const getPageDescription = () => {
    if (filter === "featured") return "在一级聚合页展示的精品聚合页";
    if (filter === "landing") return "不在一级聚合页展示的落地页（SEO流量入口）";
    return "管理菜系、场景、口味等聚合页的内容和 SEO";
  };

  return (
    <div>
      {/* 面包屑 */}
      <div className="text-sm text-textGray mb-4">
        <Link href="/admin" className="hover:text-brownWarm">配置</Link>
        <span className="mx-2">/</span>
        <span className="text-textDark">{getPageTitle()}</span>
      </div>

      {/* 页头 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-textGray">{getPageDescription()}</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          创建合集
        </Link>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b border-lightGray mb-6">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => updateFilter("type", option.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              typeFilter === option.value
                ? "text-brownWarm border-brownWarm"
                : "text-textGray border-transparent hover:text-textDark"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-brownWarm" />
            <div>
              <div className="text-2xl font-bold text-textDark">{stats.total}</div>
              <div className="text-xs text-textGray">总数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-textDark">{stats.qualified}</div>
              <div className="text-xs text-textGray">已达标</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-textDark">{stats.near}</div>
              <div className="text-xs text-textGray">接近达标</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-textDark">{stats.unqualified}</div>
              <div className="text-xs text-textGray">未达标</div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textGray" />
            <input
              type="text"
              placeholder="搜索名称或 slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadCollections()}
              className="w-full pl-10 pr-4 py-2 border border-cream rounded-lg text-sm focus:outline-none focus:border-brownWarm"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="px-3 py-2 border border-cream rounded-lg text-sm focus:outline-none focus:border-brownWarm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 达标筛选 */}
          <select
            value={qualifiedFilter}
            onChange={(e) => updateFilter("qualified", e.target.value)}
            className="px-3 py-2 border border-cream rounded-lg text-sm focus:outline-none focus:border-brownWarm"
          >
            {QUALIFIED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 清空筛选 */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-textGray hover:text-textDark"
            >
              <X className="h-4 w-4" />
              清空筛选
            </button>
          )}

          {/* 刷新 */}
          <button
            onClick={loadCollections}
            disabled={loading}
            className="p-2 text-textGray hover:text-brownWarm disabled:opacity-50"
            title="刷新列表"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-brownWarm" />
          <span className="ml-2 text-textGray">加载中...</span>
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-textGray mb-4">暂无聚合页数据</p>
          <Link
            href="/admin/collections/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            创建第一个合集
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-cream">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  进度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  食谱数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  编辑时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-textGray uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {collections.map((collection) => {
                const qualifiedInfo = getQualifiedStatusInfo(collection.qualifiedStatus as any);
                const statusLabel = CollectionStatusLabel[collection.status as keyof typeof CollectionStatusLabel] || collection.status;
                const typeLabel = CollectionTypeLabel[collection.type as keyof typeof CollectionTypeLabel] || collection.type;

                return (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {collection.coverImage ? (
                          <Image
                            src={collection.coverImage}
                            alt={collection.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-cream flex items-center justify-center">
                            <Layers className="h-5 w-5 text-textGray" />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/collections/${collection.id}`}
                            className="text-sm font-medium text-textDark hover:text-brownWarm"
                          >
                            {collection.name}
                          </Link>
                          {collection.nameEn && (
                            <div className="text-xs text-textGray">{collection.nameEn}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-textGray">{typeLabel}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-textGray font-mono">{collection.path}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              collection.progress >= 100
                                ? "bg-green-500"
                                : collection.progress >= 80
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(collection.progress, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-textGray text-center">
                          {collection.progress}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-medium text-textDark">
                          {collection.cachedPublishedCount}
                        </span>
                        <span className="text-textGray"> / {collection.targetCount}</span>
                      </div>
                      {collection.cachedPendingCount > 0 && (
                        <div className="text-xs text-amber-600">
                          +{collection.cachedPendingCount} 待审核
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                            collection.status === "published"
                              ? "bg-green-100 text-green-700"
                              : collection.status === "draft"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            qualifiedInfo.color === "green"
                              ? "text-green-600"
                              : qualifiedInfo.color === "yellow"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {qualifiedInfo.icon} {qualifiedInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textGray">
                      {new Date(collection.updatedAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/collections/${collection.id}`}
                          className="inline-flex items-center gap-1 text-sm text-brownWarm hover:text-brownDark"
                        >
                          编辑
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-cream">
              <div className="text-sm text-textGray">
                共 {total} 条，第 {page} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pageNum
                          ? "bg-brownWarm text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-textGray">...</span>}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
