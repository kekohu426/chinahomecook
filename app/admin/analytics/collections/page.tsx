"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Eye, Calendar, Filter } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  type: string;
  viewCount: number;
  lastViewedAt: string | null;
  status: string;
}

interface AnalyticsData {
  collections: Collection[];
  total: number;
  totalViews: number;
}

export default function CollectionAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "low">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [filter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/admin/analytics/collections?${params}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cuisine: "菜系",
      scene: "场景",
      theme: "主题",
      method: "烹饪方式",
      taste: "口味",
      crowd: "人群",
      occasion: "场合",
      ingredient: "食材",
      region: "区域",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "从未访问";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return `${Math.floor(days / 30)}个月前`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brownWarm mx-auto"></div>
            <p className="mt-4 text-textGray">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* 页头 */}
      <div className="bg-white border-b border-cream">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/collections"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-textGray" />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-medium text-textDark">
                📊 聚合页流量监控
              </h1>
              <p className="text-sm text-textGray mt-1">
                查看所有聚合页的访问数据，发现高流量落地页
              </p>
            </div>
          </div>

          {/* 统计卡片 */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">总聚合页数</span>
                </div>
                <div className="text-3xl font-bold text-blue-900">{data.total}</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">总访问量</span>
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {data.totalViews.toLocaleString()}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">平均访问量</span>
                </div>
                <div className="text-3xl font-bold text-amber-900">
                  {Math.round(data.totalViews / data.total)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow-card p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-textGray" />
              <span className="text-sm font-medium text-textDark">筛选：</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === "all"
                    ? "bg-brownWarm text-white"
                    : "bg-gray-100 text-textGray hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter("high")}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === "high"
                    ? "bg-brownWarm text-white"
                    : "bg-gray-100 text-textGray hover:bg-gray-200"
                }`}
              >
                高流量 🔥
              </button>
              <button
                onClick={() => setFilter("low")}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === "low"
                    ? "bg-brownWarm text-white"
                    : "bg-gray-100 text-textGray hover:bg-gray-200"
                }`}
              >
                低流量
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-textGray">类型：</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">全部类型</option>
                <option value="cuisine">菜系</option>
                <option value="scene">场景</option>
                <option value="theme">主题</option>
                <option value="method">烹饪方式</option>
                <option value="taste">口味</option>
                <option value="crowd">人群</option>
                <option value="occasion">场合</option>
                <option value="ingredient">食材</option>
                <option value="region">区域</option>
              </select>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  访问量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  最后访问
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textGray uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.collections.map((collection, index) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textGray">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-textDark">
                        {collection.name}
                      </span>
                      {collection.viewCount > 1000 && (
                        <span className="text-xs">🔥</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-textGray">
                      {getTypeLabel(collection.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-textDark">
                      {collection.viewCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textGray">
                    {formatDate(collection.lastViewedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        collection.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-textGray"
                      }`}
                    >
                      {collection.status === "published" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/collections/${collection.id}`}
                      className="text-brownWarm hover:text-brownWarm/80 font-medium"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data?.collections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-textGray">暂无数据</p>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        {data && data.collections.some((c) => c.viewCount > 1000) && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              💡 <strong>提示：</strong>标记 🔥 的聚合页流量较高，可以考虑在
              <Link href="/admin/recipe-page" className="underline mx-1">
                一级聚合页配置
              </Link>
              中添加展示。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
