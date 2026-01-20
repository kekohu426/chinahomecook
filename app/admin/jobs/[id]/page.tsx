/**
 * 生成任务详情页面
 *
 * 路由: /admin/jobs/[id]
 * 功能: 显示任务详情和生成结果
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface GenerateResult {
  recipeName: string;
  status: "success" | "failed";
  recipeId?: string;
  error?: string;
  warning?: string;
}

interface JobDetail {
  id: string;
  sourceType: string;
  collectionId: string | null;
  collectionName: string | null;
  lockedTags: Record<string, string>;
  suggestedTags: Record<string, string[]> | null;
  recipeNames: string[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  results: GenerateResult[] | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "待执行", color: "bg-gray-100 text-gray-700", icon: <Clock className="h-5 w-5" /> },
  running: { label: "执行中", color: "bg-blue-100 text-blue-700", icon: <Loader2 className="h-5 w-5 animate-spin" /> },
  completed: { label: "已完成", color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-5 w-5" /> },
  partial: { label: "部分成功", color: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-5 w-5" /> },
  failed: { label: "失败", color: "bg-red-100 text-red-700", icon: <XCircle className="h-5 w-5" /> },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500", icon: <Square className="h-5 w-5" /> },
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const loadJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/jobs/${id}`);
      const result = await response.json();
      if (result.success) {
        setJob(result.data);
      }
    } catch (error) {
      console.error("加载任务详情失败:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // 自动刷新（当任务运行中时）
  useEffect(() => {
    if (job?.status === "running" && !refreshInterval) {
      const interval = setInterval(loadJob, 2000);
      setRefreshInterval(interval);
    } else if (job?.status !== "running" && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [job?.status, refreshInterval, loadJob]);

  const handleStart = async () => {
    try {
      const response = await fetch(`/api/admin/jobs/${id}/start`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        loadJob();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("启动任务失败:", error);
      alert("启动失败");
    }
  };

  const handleCancel = async () => {
    if (!confirm("确定要取消这个任务吗？")) return;

    try {
      const response = await fetch(`/api/admin/jobs/${id}/cancel`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        loadJob();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("取消任务失败:", error);
      alert("取消失败");
    }
  };

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/admin/jobs/${id}/retry`, { method: "POST" });
      const result = await response.json();
      if (result.success) {
        alert(`已创建重试任务: ${result.data.newJobId}`);
        loadJob();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("重试任务失败:", error);
      alert("重试失败");
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "-";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    if (duration < 60) return `${duration} 秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)} 分 ${duration % 60} 秒`;
    return `${Math.floor(duration / 3600)} 小时 ${Math.floor((duration % 3600) / 60)} 分`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-textGray">加载中...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-textGray">任务不存在</p>
        <Link href="/admin/jobs" className="text-brownWarm hover:underline mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const progress = job.totalCount > 0
    ? Math.round(((job.successCount + job.failedCount) / job.totalCount) * 100)
    : 0;
  const completedCount = job.successCount + job.failedCount;
  const remainingCount = Math.max(0, job.totalCount - completedCount);
  const sourceLabel = job.sourceType === "collection" ? "聚合页自动生成" : "手动创建";
  const taskHint = job.status === "pending"
    ? "任务尚未开始，点击右上角“启动任务”开始执行。"
    : job.status === "running"
      ? "任务执行中，系统会按顺序生成并写入食谱。"
      : job.status === "completed"
        ? "任务已完成，可在下方查看生成结果。"
        : job.status === "partial"
          ? "任务部分成功，可查看失败原因后重试。"
          : job.status === "failed"
            ? "任务失败，请检查失败原因后重试。"
            : "任务已取消。";

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/jobs"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-textGray" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-medium text-textDark">
              任务详情
            </h1>
            <p className="text-sm text-textGray font-mono">{job.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadJob}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="h-5 w-5 text-textGray" />
          </button>
          {job.status === "pending" && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="h-4 w-4" />
              <span>启动任务</span>
            </button>
          )}
          {job.status === "running" && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="h-4 w-4" />
              <span>取消任务</span>
            </button>
          )}
          {(job.status === "failed" || job.status === "partial") && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>重试失败项</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：任务信息和结果 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 进度卡片 */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-textDark">执行进度</h2>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-textGray mb-4">
              {sourceLabel} · 目标生成 {job.totalCount} 道 · {taskHint}
            </p>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-textGray">完成进度</span>
                <span className="text-sm font-medium text-textDark">{progress}%</span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(job.successCount / job.totalCount) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(job.failedCount / job.totalCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-textGray mb-4">
              <span>已完成 {completedCount}/{job.totalCount}</span>
              <span>剩余 {remainingCount}</span>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-medium text-textDark">{job.totalCount}</div>
                <div className="text-xs text-textGray">总数</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-medium text-green-600">{job.successCount}</div>
                <div className="text-xs text-green-600">成功</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-medium text-red-600">{job.failedCount}</div>
                <div className="text-xs text-red-600">失败</div>
              </div>
            </div>
          </div>

          {/* 生成结果 */}
          {job.results && job.results.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-medium text-textDark mb-4">生成结果</h2>
              <div className="space-y-2">
                {job.results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.status === "success" ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm text-textDark">{result.recipeName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.status === "success" && result.recipeId && (
                        <Link
                          href={`/admin/recipes/${result.recipeId}/edit`}
                          className="text-xs text-brownWarm hover:underline flex items-center gap-1"
                        >
                          编辑
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {result.status === "success" && result.warning && (
                        <span className="text-xs text-amber-700 max-w-xs truncate" title={result.warning}>
                          {result.warning}
                        </span>
                      )}
                      {result.status === "failed" && result.error && (
                        <span className="text-xs text-red-600 max-w-xs truncate" title={result.error}>
                          {result.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：任务配置 */}
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-textDark mb-4">任务信息</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-textGray mb-1">来源类型</dt>
                <dd className="text-sm text-textDark">
                  {job.sourceType === "collection" ? "聚合页" : "手动创建"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-textGray mb-1">任务目标</dt>
                <dd className="text-sm text-textDark">
                  生成 {job.totalCount} 道食谱
                </dd>
              </div>
              {job.collectionId && (
                <div>
                  <dt className="text-xs text-textGray mb-1">关联聚合页</dt>
                  <dd>
                    <Link
                      href={`/admin/collections/${job.collectionId}`}
                      className="text-sm text-brownWarm hover:underline"
                    >
                      {job.collectionName || job.collectionId}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-textGray mb-1">创建时间</dt>
                <dd className="text-sm text-textDark">{formatTime(job.createdAt)}</dd>
              </div>
              {job.startedAt && (
                <div>
                  <dt className="text-xs text-textGray mb-1">开始时间</dt>
                  <dd className="text-sm text-textDark">{formatTime(job.startedAt)}</dd>
                </div>
              )}
              {job.completedAt && (
                <div>
                  <dt className="text-xs text-textGray mb-1">完成时间</dt>
                  <dd className="text-sm text-textDark">{formatTime(job.completedAt)}</dd>
                </div>
              )}
              {job.startedAt && (
                <div>
                  <dt className="text-xs text-textGray mb-1">耗时</dt>
                  <dd className="text-sm text-textDark">
                    {formatDuration(job.startedAt, job.completedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 锁定标签 */}
          {job.lockedTags && Object.keys(job.lockedTags).length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-medium text-textDark mb-4">锁定标签</h2>
              <dl className="space-y-2">
                {Object.entries(job.lockedTags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <dt className="text-sm text-textGray">{key}</dt>
                    <dd className="text-sm text-textDark font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 指定菜名 */}
          {job.recipeNames && job.recipeNames.length > 0 && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-lg font-medium text-textDark mb-4">指定菜名</h2>
              <ul className="space-y-1">
                {job.recipeNames.map((name, index) => (
                  <li key={index} className="text-sm text-textDark">
                    {index + 1}. {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
