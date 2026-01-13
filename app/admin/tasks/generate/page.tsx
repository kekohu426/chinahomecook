/**
 * 生成任务管理页面
 *
 * 路由: /admin/tasks/generate
 * 功能: 显示所有生成任务，支持查看详情、取消、重试
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
} from "lucide-react";

interface GenerateJob {
  id: string;
  sourceType: string;
  collectionId: string | null;
  collectionName: string | null;
  lockedTags: Record<string, string>;
  suggestedTags: Record<string, string[]>;
  recipeNames: string[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  progress: number;
  results?: Array<{
    name: string;
    status: string;
    recipeId?: string;
    error?: string;
  }>;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "等待中", color: "text-gray-500 bg-gray-100", icon: Clock },
  running: { label: "进行中", color: "text-blue-500 bg-blue-100", icon: Play },
  completed: { label: "已完成", color: "text-green-500 bg-green-100", icon: CheckCircle },
  failed: { label: "失败", color: "text-red-500 bg-red-100", icon: XCircle },
  cancelled: { label: "已取消", color: "text-gray-400 bg-gray-100", icon: Pause },
};

export default function GenerateTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<GenerateJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<GenerateJob | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const statusFilter = searchParams.get("status") || "";
  const selectedId = searchParams.get("id") || "";

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/tasks/generate?${params}`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
      }
    } catch (error) {
      console.error("加载任务列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadJobDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/generate/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedJob(data.data);
      }
    } catch (error) {
      console.error("加载任务详情失败:", error);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (selectedId) {
      loadJobDetail(selectedId);
    } else {
      setSelectedJob(null);
    }
  }, [selectedId, loadJobDetail]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/tasks/generate?${params.toString()}`);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("确定要取消此任务吗？")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/tasks/generate/${id}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        loadJobs();
        if (selectedJob?.id === id) {
          loadJobDetail(id);
        }
      } else {
        alert(data.error || "取消失败");
      }
    } catch (error) {
      console.error("取消任务失败:", error);
      alert("取消失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    if (!confirm("确定要重试失败的任务吗？")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/tasks/generate/${id}/retry`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        loadJobs();
        alert(data.message || "重试任务已创建");
      } else {
        alert(data.error || "重试失败");
      }
    } catch (error) {
      console.error("重试任务失败:", error);
      alert("重试失败");
    } finally {
      setActionLoading(false);
    }
  };

  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/admin/tasks/generate?${params.toString()}`);
  };

  return (
    <div className="flex gap-6">
      {/* 左侧列表 */}
      <div className={`flex-1 ${selectedJob ? "hidden lg:block" : ""}`}>
        {/* 页头 */}
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            生成任务
          </h1>
          <p className="text-textGray">查看和管理 AI 食谱生成任务</p>
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "", label: "全部" },
            { value: "running", label: "进行中" },
            { value: "pending", label: "等待中" },
            { value: "completed", label: "已完成" },
            { value: "failed", label: "失败" },
            { value: "cancelled", label: "已取消" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("status", option.value)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                statusFilter === option.value
                  ? "bg-brownWarm text-white"
                  : "bg-white text-textGray hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-textGray">加载中...</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-textGray">暂无生成任务</p>
            <Link
              href="/admin/generate"
              className="inline-block mt-4 px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors"
            >
              创建新任务
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={job.id}
                  className={`bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedJob?.id === job.id ? "ring-2 ring-brownWarm" : ""
                  }`}
                  onClick={() => updateFilter("id", job.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                      <span className="text-sm text-textGray">
                        {job.sourceType === "collection" ? "聚合页生成" : "手动生成"}
                      </span>
                    </div>
                    <span className="text-xs text-textGray">
                      {new Date(job.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>

                  {job.collectionName && (
                    <div className="text-sm text-textDark mb-2">
                      聚合页: {job.collectionName}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            job.status === "completed"
                              ? "bg-green-500"
                              : job.status === "failed"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-textGray">
                      {job.successCount}/{job.totalCount}
                      {job.failedCount > 0 && (
                        <span className="text-red-500 ml-1">
                          ({job.failedCount} 失败)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 右侧详情面板 */}
      {selectedJob && (
        <div className="w-full lg:w-96 bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-textDark">任务详情</h2>
            <button
              onClick={closeDetail}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-5 w-5 text-textGray" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 状态 */}
            <div>
              <div className="text-xs text-textGray mb-1">状态</div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                  STATUS_CONFIG[selectedJob.status]?.color || "bg-gray-100"
                }`}
              >
                {STATUS_CONFIG[selectedJob.status]?.label || selectedJob.status}
              </span>
            </div>

            {/* 来源 */}
            <div>
              <div className="text-xs text-textGray mb-1">来源</div>
              <div className="text-sm text-textDark">
                {selectedJob.sourceType === "collection"
                  ? `聚合页: ${selectedJob.collectionName || "未知"}`
                  : "手动创建"}
              </div>
            </div>

            {/* 锁定标签 */}
            {selectedJob.lockedTags && Object.keys(selectedJob.lockedTags).length > 0 && (
              <div>
                <div className="text-xs text-textGray mb-1">锁定标签</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(selectedJob.lockedTags).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-0.5 bg-brownWarm/10 text-brownWarm text-xs rounded"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 进度 */}
            <div>
              <div className="text-xs text-textGray mb-1">进度</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${selectedJob.progress}%` }}
                />
              </div>
              <div className="text-sm text-textDark">
                成功: {selectedJob.successCount} / 失败: {selectedJob.failedCount} / 总计: {selectedJob.totalCount}
              </div>
            </div>

            {/* 时间 */}
            <div>
              <div className="text-xs text-textGray mb-1">时间</div>
              <div className="text-sm text-textDark space-y-1">
                <div>创建: {new Date(selectedJob.createdAt).toLocaleString("zh-CN")}</div>
                {selectedJob.startedAt && (
                  <div>开始: {new Date(selectedJob.startedAt).toLocaleString("zh-CN")}</div>
                )}
                {selectedJob.completedAt && (
                  <div>完成: {new Date(selectedJob.completedAt).toLocaleString("zh-CN")}</div>
                )}
              </div>
            </div>

            {/* 结果列表 */}
            {selectedJob.results && selectedJob.results.length > 0 && (
              <div>
                <div className="text-xs text-textGray mb-2">结果详情</div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedJob.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        result.status === "success"
                          ? "bg-green-50"
                          : "bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-textDark">{result.name}</span>
                      </div>
                      {result.recipeId && (
                        <Link
                          href={`/admin/recipes/${result.recipeId}/edit`}
                          className="text-xs text-blue-600 hover:underline ml-6"
                        >
                          查看食谱
                        </Link>
                      )}
                      {result.error && (
                        <div className="text-xs text-red-600 ml-6 mt-1">
                          {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4 border-t border-cream">
              {(selectedJob.status === "pending" || selectedJob.status === "running") && (
                <button
                  onClick={() => handleCancel(selectedJob.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-100 text-textGray rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  取消任务
                </button>
              )}
              {(selectedJob.status === "failed" || selectedJob.status === "cancelled") && (
                <button
                  onClick={() => handleRetry(selectedJob.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4 inline mr-1" />
                  重试失败项
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
