/**
 * 聚合页诊断页面
 *
 * 路由: /admin/collections/[id]/diagnose
 * 功能: 显示聚合页的内容漏斗、建议和分布统计
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface DiagnoseData {
  collection: {
    id: string;
    name: string;
    type: string;
    minRequired: number;
    targetCount: number;
  };
  funnel: {
    target: number;
    published: number;
    pending: number;
    draft: number;
    gap: number;
  };
  isMinReached: boolean;
  suggestions: Array<{
    type: string;
    message: string;
    action: {
      type: string;
      url?: string;
      count?: number;
    };
  }>;
  distribution: {
    byMethod: Array<{
      name: string;
      slug: string;
      count: number;
    }>;
    lowCoverage: Array<{
      name: string;
      slug: string;
      count: number;
      suggestion: string;
    }>;
  };
}

export default function CollectionDiagnosePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<DiagnoseData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDiagnose = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/collections/${id}/diagnose`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("加载诊断数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDiagnose();
  }, [loadDiagnose]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-textGray">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-textGray">诊断数据加载失败</p>
        <Link href="/admin/collections" className="text-brownWarm hover:underline mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const { collection, funnel, isMinReached, suggestions, distribution } = data;

  // 计算漏斗百分比
  const funnelPercentages = {
    published: funnel.target > 0 ? (funnel.published / funnel.target) * 100 : 0,
    pending: funnel.target > 0 ? (funnel.pending / funnel.target) * 100 : 0,
    draft: funnel.target > 0 ? (funnel.draft / funnel.target) * 100 : 0,
    gap: funnel.target > 0 ? (funnel.gap / funnel.target) * 100 : 0,
  };

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/collections/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-textGray" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-medium text-textDark">
            {collection.name} - 诊断
          </h1>
          <p className="text-sm text-textGray">分析内容缺口和优化建议</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：漏斗图 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 内容漏斗 */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-textDark mb-4">内容漏斗</h2>

            <div className="space-y-4">
              {/* 目标 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-textGray">目标数量</span>
                  </div>
                  <span className="text-sm font-medium text-textDark">
                    {funnel.target}
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gray-300"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* 已发布 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-textGray">已发布</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {funnel.published} ({funnelPercentages.published.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(funnelPercentages.published, 100)}%` }}
                  />
                </div>
              </div>

              {/* 待审核 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-textGray">待审核</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">
                    {funnel.pending} ({funnelPercentages.pending.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(funnelPercentages.pending, 100)}%` }}
                  />
                </div>
              </div>

              {/* 草稿 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-textGray">草稿</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {funnel.draft} ({funnelPercentages.draft.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gray-400 transition-all"
                    style={{ width: `${Math.min(funnelPercentages.draft, 100)}%` }}
                  />
                </div>
              </div>

              {/* 缺口 */}
              {funnel.gap > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-textGray">缺口</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      {funnel.gap} ({funnelPercentages.gap.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-red-100 transition-all border-2 border-dashed border-red-300"
                      style={{ width: `${Math.min(funnelPercentages.gap, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 达标状态 */}
            <div className="mt-6 pt-4 border-t border-cream">
              {isMinReached ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">已达到最小发布要求 ({collection.minRequired})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">
                    未达标：还需 {collection.minRequired - funnel.published} 篇才能发布
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 分布统计 */}
          {distribution && distribution.byMethod && distribution.byMethod.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-medium text-textDark mb-4">烹饪方式分布</h2>
              <div className="space-y-3">
                {distribution.byMethod.slice(0, 10).map((item) => {
                  const maxCount = Math.max(...distribution.byMethod.map((i) => i.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                  return (
                    <div key={item.slug}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-textDark">{item.name}</span>
                        <span className="text-sm text-textGray">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brownWarm transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 低覆盖提示 */}
              {distribution.lowCoverage && distribution.lowCoverage.length > 0 && (
                <div className="mt-6 pt-4 border-t border-cream">
                  <h3 className="text-sm font-medium text-textDark mb-3">低覆盖领域</h3>
                  <div className="space-y-2">
                    {distribution.lowCoverage.map((item) => (
                      <div
                        key={item.slug}
                        className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-amber-800">
                            {item.name}
                          </span>
                          <span className="text-sm text-amber-600 ml-2">
                            ({item.count} 篇)
                          </span>
                          <p className="text-xs text-amber-700 mt-1">{item.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：建议面板 */}
        <div className="space-y-6">
          {/* 快速操作 */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-textDark mb-4">快速操作</h2>
            <div className="space-y-3">
              <Link
                href={`/admin/collections/${id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="h-5 w-5 text-brownWarm" />
                <span className="text-sm text-textDark">编辑聚合页</span>
              </Link>

              <Link
                href={`/admin/generate?collectionId=${id}`}
                className="flex items-center gap-3 p-3 bg-brownWarm/10 hover:bg-brownWarm/20 rounded-lg transition-colors"
              >
                <Sparkles className="h-5 w-5 text-brownWarm" />
                <span className="text-sm text-brownWarm font-medium">AI 生成食谱</span>
              </Link>

              <Link
                href={`/admin/recipes?collection=${id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-textGray" />
                <span className="text-sm text-textDark">查看匹配食谱</span>
              </Link>
            </div>
          </div>

          {/* 建议列表 */}
          {suggestions && suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-medium text-textDark mb-4">优化建议</h2>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 rounded-lg"
                  >
                    <p className="text-sm text-blue-800 mb-3">{suggestion.message}</p>
                    {suggestion.action.type === "link" && suggestion.action.url && (
                      <Link
                        href={suggestion.action.url}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        前往处理
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    {suggestion.action.type === "generate" && (
                      <Link
                        href={`/admin/generate?collectionId=${id}&count=${suggestion.action.count || 10}`}
                        className="inline-flex items-center gap-1 text-xs text-brownWarm hover:underline"
                      >
                        生成 {suggestion.action.count || 10} 篇
                        <Sparkles className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 统计信息 */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-textDark mb-4">目标设置</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-textGray">最小发布数</dt>
                <dd className="text-sm font-medium text-textDark">
                  {collection.minRequired}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-textGray">目标数量</dt>
                <dd className="text-sm font-medium text-textDark">
                  {collection.targetCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-textGray">当前进度</dt>
                <dd className="text-sm font-medium text-brownWarm">
                  {((funnel.published / collection.targetCount) * 100).toFixed(0)}%
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
