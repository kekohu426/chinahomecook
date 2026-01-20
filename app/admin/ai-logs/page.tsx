/**
 * AI 生成日志 - 会话列表页
 *
 * 路由: /admin/ai-logs
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";

interface Session {
  sessionId: string;
  stepCount: number;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalCost: number;
  hasError: boolean;
  recipeId?: string;
  jobId?: string;
  steps: Array<{ stepName: string; status: string }>;
}

export default function AILogsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadSessions();
  }, [page]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/ai-generation-logs/sessions?page=${page}&pageSize=${pageSize}`
      );
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
        setTotal(data.meta.total);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
          AI 生成日志
        </h1>
        <p className="text-textGray">查看 AI 生成过程的完整链路与性能数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">总会话数</div>
          <div className="text-2xl font-bold text-textDark">{total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">成功率</div>
          <div className="text-2xl font-bold text-green-600">
            {sessions.length > 0
              ? `${((sessions.filter((s) => !s.hasError).length / sessions.length) * 100).toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">平均耗时</div>
          <div className="text-2xl font-bold text-textDark">
            {sessions.length > 0
              ? formatDuration(
                  sessions.reduce((sum, s) => sum + s.totalDuration, 0) / sessions.length
                )
              : "N/A"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">总成本</div>
          <div className="text-2xl font-bold text-textDark">
            {formatCost(sessions.reduce((sum, s) => sum + s.totalCost, 0))}
          </div>
        </div>
      </div>

      {/* 会话列表 */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6 border-b border-cream">
          <h2 className="text-lg font-medium text-textDark">生成会话</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brownWarm" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-textGray">暂无数据</div>
        ) : (
          <div className="divide-y divide-cream">
            {sessions.map((session) => (
              <Link
                key={session.sessionId}
                href={`/admin/ai-logs/${session.sessionId}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {session.hasError ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <span className="font-mono text-sm text-textGray">
                        {session.sessionId}
                      </span>
                      {session.recipeId && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Recipe: {session.recipeId.substring(0, 8)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-textGray">
                      <span>{session.stepCount} 步骤</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(session.totalDuration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCost(session.totalCost)}
                      </span>
                      <span>{new Date(session.startTime).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {session.steps.slice(0, 5).map((step, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            step.status === "success"
                              ? "bg-green-100 text-green-700"
                              : step.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {step.stepName}
                        </span>
                      ))}
                      {session.steps.length > 5 && (
                        <span className="text-xs text-textGray">
                          +{session.steps.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-brownWarm hover:text-brownDark">
                    查看详情 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div className="p-6 border-t border-cream flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm text-textGray hover:text-textDark disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-textGray">
              第 {page} 页，共 {Math.ceil(total / pageSize)} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 text-sm text-textGray hover:text-textDark disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
