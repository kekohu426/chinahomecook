/**
 * 后台管理 - 运营仪表板
 *
 * 路由：/admin/dashboard
 * 显示食谱管理相关的统计数据
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChefHat,
  Globe,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  MapPin,
  UtensilsCrossed,
  Languages,
  AlertCircle,
  ListTodo,
  Layers,
  Play,
  Tag,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  recipes: {
    total: number;
    published: number;
    draft: number;
    approved: number;
    pending: number;
    aiGenerated: number;
    recentWeek: number;
  };
  translations: {
    total: number;
    approved: number;
    pending: number;
    recentWeek: number;
    coverage: Record<string, { total: number; approved: number }>;
  };
  jobs: {
    running: number;
    pending: number;
    failed: number;
  };
  tags: {
    pendingReview: number;
  };
  collections: {
    total: number;
    ready: number;
    lowCoverage: number;
  };
  distribution: {
    byCuisine: { name: string; count: number }[];
    byLocation: { name: string; count: number }[];
  };
  trend: { date: string; count: number }[];
  todos: {
    type: string;
    priority: "high" | "medium" | "low";
    message: string;
    action: { type: string; url?: string };
  }[];
  attentionCollections: {
    id: string;
    name: string;
    type: string;
    status: string;
    minRequired: number;
    targetCount: number;
  }[];
  activeJobs: {
    id: string;
    sourceType: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    progress: number;
    status: string;
    createdAt: string;
  }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-textDark">{value}</div>
          <div className="text-sm text-textGray">{label}</div>
          {subValue && (
            <div className="text-xs text-textGray mt-1">{subValue}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-textDark">{label}</span>
        <span className="text-textGray">
          {value} / {max} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DistributionChart({
  title,
  icon: Icon,
  data,
  color,
}: {
  title: string;
  icon: React.ElementType;
  data: { name: string; count: number }[];
  color: string;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="text-lg font-medium text-textDark">{title}</h3>
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-textGray text-sm">暂无数据</p>
        ) : (
          data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm text-textDark w-24 truncate">
                {item.name || "未分类"}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${color.replace("text-", "bg-")}`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-textGray w-10 text-right">
                {item.count}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 待办事项组件
function TodoList({
  todos,
}: {
  todos: DashboardStats["todos"];
}) {
  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="h-5 w-5 text-brownWarm" />
        <h3 className="text-lg font-medium text-textDark">待办事项</h3>
      </div>
      {todos.length === 0 ? (
        <div className="text-center py-8 text-textGray">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
          <p>所有任务已完成</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((todo, index) => (
            <Link
              key={index}
              href={todo.action.url || "#"}
              className={`flex items-center justify-between p-3 rounded-lg border ${priorityColors[todo.priority]} hover:shadow-sm transition-shadow`}
            >
              <span className="text-sm font-medium">{todo.message}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 需关注聚合页组件
function AttentionCollections({
  collections,
}: {
  collections: DashboardStats["attentionCollections"];
}) {
  const statusColors: Record<string, string> = {
    low: "bg-red-500",
    draft: "bg-gray-400",
    ready: "bg-green-500",
  };

  const typeLabels: Record<string, string> = {
    cuisine: "菜系",
    scene: "场景",
    method: "烹饪方式",
    taste: "口味",
    crowd: "人群",
    occasion: "场合",
    topic: "专题",
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-medium text-textDark">需关注的聚合页</h3>
        </div>
        <Link
          href="/admin/collections?status=low"
          className="text-sm text-brownWarm hover:underline"
        >
          查看全部
        </Link>
      </div>
      {collections.length === 0 ? (
        <div className="text-center py-8 text-textGray">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
          <p>所有聚合页状态良好</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/admin/collections/${collection.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${statusColors[collection.status] || "bg-gray-400"}`}
                />
                <div>
                  <div className="text-sm font-medium text-textDark">
                    {collection.name}
                  </div>
                  <div className="text-xs text-textGray">
                    {typeLabels[collection.type] || collection.type} · 目标 {collection.targetCount} 篇
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-textGray" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 进行中的任务组件
function ActiveJobs({
  jobs,
}: {
  jobs: DashboardStats["activeJobs"];
}) {
  const statusLabels: Record<string, string> = {
    pending: "等待中",
    running: "进行中",
    completed: "已完成",
    failed: "失败",
    cancelled: "已取消",
  };

  const statusColors: Record<string, string> = {
    pending: "text-gray-500",
    running: "text-blue-500",
    completed: "text-green-500",
    failed: "text-red-500",
    cancelled: "text-gray-400",
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-textDark">进行中的任务</h3>
        </div>
        <Link
          href="/admin/jobs"
          className="text-sm text-brownWarm hover:underline"
        >
          查看全部
        </Link>
      </div>
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-textGray">
          <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>暂无进行中的任务</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/admin/jobs/${job.id}`}
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-textDark">
                  {job.sourceType === "collection" ? "聚合页生成" : "手动生成"}
                </span>
                <span className={`text-xs ${statusColors[job.status]}`}>
                  {statusLabels[job.status]}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="text-xs text-textGray">
                {job.successCount}/{job.totalCount} 完成
                {job.failedCount > 0 && ` · ${job.failedCount} 失败`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 趋势图组件
function TrendChart({
  data,
}: {
  data: DashboardStats["trend"];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-medium text-textDark">7天新增趋势</h3>
      </div>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((item, index) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const date = new Date(item.date);
          const dayLabel = date.toLocaleDateString("zh-CN", { weekday: "short" });

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <span className="text-xs text-textGray mb-1">{item.count}</span>
                <div
                  className="w-full bg-green-400 rounded-t transition-all"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-xs text-textGray mt-2">{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("加载仪表板数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-textGray">加载中...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">加载数据失败</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页头 */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          运营仪表板
        </h1>
        <p className="text-textGray">食谱管理数据概览</p>
      </div>

      {/* 快捷导航 */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/admin/recipes"
          className="px-4 py-2 bg-brownWarm hover:bg-brownDark text-white text-sm rounded-lg transition-colors"
        >
          食谱管理
        </Link>
        <Link
          href="/admin/review/recipes"
          className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm rounded-lg transition-colors"
        >
          审核管理
        </Link>
        <Link
          href="/admin/generate"
          className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm rounded-lg transition-colors"
        >
          AI 生成
        </Link>
        <Link
          href="/admin/collections"
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors"
        >
          聚合页管理
        </Link>
        <Link
          href="/admin/tasks/unknown-tags"
          className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm rounded-lg transition-colors"
        >
          标签审核
        </Link>
      </div>

      {/* 待办事项 & 聚合页状态 & 任务进度 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <TodoList todos={stats.todos || []} />
        <AttentionCollections collections={stats.attentionCollections || []} />
        <ActiveJobs jobs={stats.activeJobs || []} />
      </div>

      {/* 聚合页和任务统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Layers}
          label="聚合页总数"
          value={stats.collections?.total || 0}
          subValue={`已达标 ${stats.collections?.ready || 0}`}
          color="bg-indigo-500"
        />
        <StatCard
          icon={AlertCircle}
          label="内容不足"
          value={stats.collections?.lowCoverage || 0}
          subValue="需要补充内容"
          color="bg-red-500"
        />
        <StatCard
          icon={Play}
          label="生成任务"
          value={(stats.jobs?.running || 0) + (stats.jobs?.pending || 0)}
          subValue={`运行中 ${stats.jobs?.running || 0}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Tag}
          label="待审标签"
          value={stats.tags?.pendingReview || 0}
          subValue="未知标签待处理"
          color="bg-amber-500"
        />
      </div>

      {/* 食谱统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={ChefHat}
          label="食谱总数"
          value={stats.recipes.total}
          subValue={`本周新增 ${stats.recipes.recentWeek}`}
          color="bg-brownWarm"
        />
        <StatCard
          icon={Globe}
          label="已发布"
          value={stats.recipes.published}
          subValue={`草稿 ${stats.recipes.draft}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="已审核"
          value={stats.recipes.approved}
          subValue={`待审核 ${stats.recipes.pending}`}
          color="bg-green-500"
        />
        <StatCard
          icon={Sparkles}
          label="AI 生成"
          value={stats.recipes.aiGenerated}
          subValue={`占比 ${((stats.recipes.aiGenerated / stats.recipes.total) * 100).toFixed(0)}%`}
          color="bg-purple-500"
        />
      </div>

      {/* 翻译统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Languages}
          label="翻译总数"
          value={stats.translations.total}
          subValue={`本周新增 ${stats.translations.recentWeek}`}
          color="bg-indigo-500"
        />
        <StatCard
          icon={CheckCircle}
          label="已审核翻译"
          value={stats.translations.approved}
          color="bg-teal-500"
        />
        <StatCard
          icon={Clock}
          label="待审核翻译"
          value={stats.translations.pending}
          color="bg-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="翻译覆盖率"
          value={`${stats.recipes.total > 0 ? ((stats.translations.total / stats.recipes.total) * 100).toFixed(0) : 0}%`}
          subValue={`${stats.translations.total} / ${stats.recipes.total}`}
          color="bg-cyan-500"
        />
      </div>

      {/* 翻译语言覆盖 */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-medium text-textDark">翻译语言覆盖</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(stats.translations.coverage).map(([locale, data]) => (
            <div key={locale}>
              <ProgressBar
                label={locale.toUpperCase()}
                value={data.total}
                max={stats.recipes.total}
                color="bg-indigo-500"
              />
              <ProgressBar
                label={`${locale.toUpperCase()} 已审核`}
                value={data.approved}
                max={data.total}
                color="bg-green-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 趋势图 */}
      {stats.trend && stats.trend.length > 0 && (
        <div className="mb-8">
          <TrendChart data={stats.trend} />
        </div>
      )}

      {/* 分布统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionChart
          title="按菜系分布"
          icon={UtensilsCrossed}
          data={stats.distribution?.byCuisine || []}
          color="text-orange-500"
        />
        <DistributionChart
          title="按地区分布"
          icon={MapPin}
          data={stats.distribution?.byLocation || []}
          color="text-blue-500"
        />
      </div>
    </div>
  );
}
