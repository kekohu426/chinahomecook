/**
 * 生成任务列表页面
 *
 * 路由: /admin/jobs
 * 功能: 显示和管理所有生成任务
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Job {
  id: string;
  sourceType: string;
  collectionId: string | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface JobsData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: Record<string, number>;
  items: Job[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "待执行", color: "bg-gray-100 text-gray-700", icon: <Clock className="h-4 w-4" /> },
  running: { label: "执行中", color: "bg-blue-100 text-blue-700", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  completed: { label: "已完成", color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-4 w-4" /> },
  partial: { label: "部分成功", color: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-4 w-4" /> },
  failed: { label: "失败", color: "bg-red-100 text-red-700", icon: <XCircle className="h-4 w-4" /> },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500", icon: <Square className="h-4 w-4" /> },
};

export default function JobsPage() {
  const [data, setData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/jobs?${params}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("加载任务列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // 自动刷新（当有运行中的任务时）
  useEffect(() => {
    const hasRunning = data?.items.some((j) => j.status === "running");

    if (hasRunning && !refreshInterval) {
      const interval = setInterval(loadJobs, 3000);
      setRefreshInterval(interval);
    } else if (!hasRunning && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [data, refreshInterval, loadJobs]);

  const handleStart = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/start`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        loadJobs();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("启动任务失败:", error);
      alert("启动失败");
    }
  };

  const handleCancel = async (jobId: string) => {
    if (!confirm("确定要取消这个任务吗？")) return;

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/cancel`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        loadJobs();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("取消任务失败:", error);
      alert("取消失败");
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/retry`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        loadJobs();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("重试任务失败:", error);
      alert("重试失败");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("确定要删除这个任务吗？此操作不可恢复。")) return;

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        loadJobs();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("删除任务失败:", error);
      alert("删除失败");
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-textGray">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-medium text-textDark">生成任务</h1>
          <p className="text-sm text-textGray mt-1">管理 AI 食谱生成任务</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadJobs()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="h-5 w-5 text-textGray" />
          </button>
          <Link
            href="/admin/generate"
            className="flex items-center gap-2 px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownWarm/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>新建任务</span>
          </Link>
        </div>
      </div>

      {/* 状态统计 */}
      {data?.stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
              className={`p-3 rounded-lg text-center transition-colors ${
                statusFilter === status
                  ? "ring-2 ring-brownWarm"
                  : "hover:bg-gray-50"
              } ${config.color}`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {config.icon}
                <span className="text-lg font-medium">{data.stats[status] || 0}</span>
              </div>
              <div className="text-xs">{config.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* 任务列表 */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-textGray">任务ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textGray">来源</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-textGray">进度</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-textGray">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-textGray">创建时间</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-textGray">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream">
            {data?.items.map((job) => {
              const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const progress = job.totalCount > 0
                ? Math.round(((job.successCount + job.failedCount) / job.totalCount) * 100)
                : 0;

              return (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-sm font-mono text-brownWarm hover:underline"
                    >
                      {job.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-textDark">
                      {job.sourceType === "collection" ? "聚合页" : "手动"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brownWarm transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-textGray">
                        {job.successCount}/{job.totalCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-textGray">{formatTime(job.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {job.status === "pending" && (
                        <button
                          onClick={() => handleStart(job.id)}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title="启动"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {job.status === "running" && (
                        <button
                          onClick={() => handleCancel(job.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title="取消"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      )}
                      {(job.status === "failed" || job.status === "partial") && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          className="p-1.5 hover:bg-amber-50 rounded text-amber-600"
                          title="重试失败项"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      {job.status !== "running" && (
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!data?.items || data.items.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-textGray">
                  暂无任务
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-cream">
            <div className="text-sm text-textGray">
              共 {data.total} 条，第 {data.page}/{data.totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
