/**
 * AI 生成中心组件
 *
 * 功能：
 * 1. AI 推荐菜名（调用真实 AI 模型）
 * 2. 选择要生成的菜名
 * 3. 创建异步生成任务
 * 4. 轮询任务进度
 * 5. 展示生成结果
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AIGenerateTabProps {
  collectionId: string;
  collectionName: string;
  cuisineName?: string;
  onRecipesGenerated?: () => void;
}

interface Recommendation {
  name: string;
  reason: string;
  confidence: number;
  selected?: boolean;
}

interface CollectionInfo {
  name: string;
  type: string;
  currentCount: number;
  targetCount: number;
  gap: number;
}

interface GenerateResult {
  name: string;
  recipeId: string | null;
  status: "success" | "duplicate" | "failed";
  error?: string;
}

interface JobStatus {
  id: string;
  status: "pending" | "running" | "completed" | "partial" | "failed" | "cancelled";
  totalCount: number;
  successCount: number;
  failedCount: number;
  results: GenerateResult[];
  startedAt: string | null;
  completedAt: string | null;
}

export default function AIGenerateTab({
  collectionId,
  collectionName,
  cuisineName,
  onRecipesGenerated,
}: AIGenerateTabProps) {
  // 推荐状态
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendSource, setRecommendSource] = useState<"ai" | "fallback" | null>(null);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [reviewMode, setReviewMode] = useState<"manual" | "auto">("manual");

  // 自定义菜名
  const [customDishes, setCustomDishes] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 轮询定时器
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // 获取 AI 推荐
  const fetchRecommendations = useCallback(async () => {
    setRecommendLoading(true);
    setRecommendError(null);

    try {
      const response = await fetch(`/api/admin/collections/${collectionId}/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 15 }),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(
          data.data.recommendations.map((r: Recommendation) => ({
            ...r,
            selected: false,
          }))
        );
        setCollectionInfo(data.data.collectionInfo);
        setRecommendSource(data.data.source);
      } else {
        setRecommendError(data.error?.message || "获取推荐失败");
      }
    } catch (error) {
      setRecommendError("网络错误，请重试");
    } finally {
      setRecommendLoading(false);
    }
  }, [collectionId]);

  // 初始加载
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // 切换选择
  const toggleSelection = (index: number) => {
    setRecommendations((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const allSelected = recommendations.every((r) => r.selected);
    setRecommendations((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  // 获取选中的菜名
  const getSelectedDishes = (): string[] => {
    const selected = recommendations.filter((r) => r.selected).map((r) => r.name);

    // 添加自定义菜名
    if (customDishes.trim()) {
      const custom = customDishes
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return [...selected, ...custom];
    }

    return selected;
  };

  // 开始生成
  const startGenerate = async () => {
    const dishes = getSelectedDishes();
    if (dishes.length === 0) {
      alert("请选择或输入要生成的菜名");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch(`/api/admin/collections/${collectionId}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishNames: dishes,
          reviewMode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 开始轮询任务状态
        startPolling(data.data.jobId);
      } else {
        alert(data.error?.message || "创建任务失败");
        setGenerating(false);
      }
    } catch (error) {
      alert("网络错误，请重试");
      setGenerating(false);
    }
  };

  // 开始轮询任务状态
  const startPolling = (jobId: string) => {
    // 清理之前的轮询
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // 立即获取一次
    fetchJobStatus(jobId);

    // 每 3 秒轮询一次
    pollIntervalRef.current = setInterval(() => {
      fetchJobStatus(jobId);
    }, 3000);
  };

  // 获取任务状态
  const fetchJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      const data = await response.json();

      if (data.success) {
        const job = data.data as JobStatus;
        setCurrentJob(job);

        // 如果任务完成，停止轮询
        if (["completed", "partial", "failed", "cancelled"].includes(job.status)) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setGenerating(false);

          // 通知父组件刷新
          if (job.successCount > 0 && onRecipesGenerated) {
            onRecipesGenerated();
          }
        }
      }
    } catch (error) {
      console.error("获取任务状态失败:", error);
    }
  };

  // 清除任务结果
  const clearJobResult = () => {
    setCurrentJob(null);
    // 清除已选择的菜名
    setRecommendations((prev) => prev.map((r) => ({ ...r, selected: false })));
    setCustomDishes("");
  };

  const selectedCount = recommendations.filter((r) => r.selected).length;
  const customCount = customDishes
    .split(/[,，\n]/)
    .filter((s) => s.trim().length > 0).length;
  const totalSelected = selectedCount + customCount;

  return (
    <div className="space-y-6">
      {/* 合集信息 */}
      {collectionInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">{collectionInfo.name}</h3>
              <p className="text-sm text-blue-700 mt-1">
                当前 {collectionInfo.currentCount} 个食谱，目标 {collectionInfo.targetCount} 个
                {collectionInfo.gap > 0 && (
                  <span className="text-blue-900 font-medium">，还需 {collectionInfo.gap} 个</span>
                )}
              </p>
            </div>
            {recommendSource && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  recommendSource === "ai"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {recommendSource === "ai" ? "AI 推荐" : "备选推荐"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 推荐列表 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-textDark flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            推荐菜名
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-xs text-brownWarm hover:underline"
            >
              {recommendations.every((r) => r.selected) ? "取消全选" : "全选"}
            </button>
            <button
              onClick={fetchRecommendations}
              disabled={recommendLoading}
              className="inline-flex items-center gap-1 text-xs text-textGray hover:text-textDark"
            >
              <RefreshCw className={`h-3 w-3 ${recommendLoading ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>
        </div>

        {recommendError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-700">{recommendError}</p>
          </div>
        )}

        {recommendLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-brownWarm animate-spin" />
            <span className="ml-2 text-textGray">正在获取 AI 推荐...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {recommendations.map((rec, index) => (
              <button
                key={index}
                onClick={() => toggleSelection(index)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  rec.selected
                    ? "bg-brownWarm/10 border-brownWarm"
                    : "bg-white border-cream hover:border-brownWarm/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-medium text-textDark">{rec.name}</span>
                  <span className="text-xs text-textGray">
                    {Math.round(rec.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-textGray mt-1 line-clamp-1">{rec.reason}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 自定义菜名 */}
      <div>
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="flex items-center gap-2 text-sm text-textGray hover:text-textDark"
        >
          {showCustomInput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          自定义菜名
        </button>
        {showCustomInput && (
          <div className="mt-2">
            <textarea
              value={customDishes}
              onChange={(e) => setCustomDishes(e.target.value)}
              placeholder="输入菜名，用逗号或换行分隔..."
              rows={3}
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-brownWarm text-sm"
            />
            <p className="text-xs text-textGray mt-1">
              已输入 {customCount} 个菜名
            </p>
          </div>
        )}
      </div>

      {/* 生成设置 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-textDark mb-3">生成设置</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="reviewMode"
              value="manual"
              checked={reviewMode === "manual"}
              onChange={() => setReviewMode("manual")}
              className="text-brownWarm"
            />
            <span className="text-sm text-textDark">生成为待审核</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="reviewMode"
              value="auto"
              checked={reviewMode === "auto"}
              onChange={() => setReviewMode("auto")}
              className="text-brownWarm"
            />
            <span className="text-sm text-textDark">直接发布</span>
          </label>
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-textGray">
          已选择 {totalSelected} 个菜名
        </span>
        <button
          onClick={startGenerate}
          disabled={generating || totalSelected === 0}
          className="inline-flex items-center gap-2 px-6 py-2 bg-brownWarm hover:bg-brownDark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              开始生成
            </>
          )}
        </button>
      </div>

      {/* 任务进度 */}
      {currentJob && (
        <div className="bg-white border border-cream rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-textDark flex items-center gap-2">
              {currentJob.status === "running" && (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              {currentJob.status === "completed" && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {currentJob.status === "partial" && (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              {currentJob.status === "failed" && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {currentJob.status === "pending" && (
                <Clock className="h-4 w-4 text-gray-500" />
              )}
              生成任务
            </h3>
            {["completed", "partial", "failed"].includes(currentJob.status) && (
              <button
                onClick={clearJobResult}
                className="text-xs text-textGray hover:text-textDark"
              >
                清除
              </button>
            )}
          </div>

          {/* 进度条 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-textGray mb-1">
              <span>
                {currentJob.successCount + currentJob.failedCount} / {currentJob.totalCount}
              </span>
              <span>
                成功 {currentJob.successCount}，失败 {currentJob.failedCount}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${((currentJob.successCount + currentJob.failedCount) / currentJob.totalCount) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 结果列表 */}
          {currentJob.results && currentJob.results.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {currentJob.results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between text-sm px-2 py-1 rounded ${
                    result.status === "success"
                      ? "bg-green-50"
                      : result.status === "duplicate"
                      ? "bg-gray-50"
                      : "bg-red-50"
                  }`}
                >
                  <span className="text-textDark">{result.name}</span>
                  <span
                    className={`text-xs ${
                      result.status === "success"
                        ? "text-green-600"
                        : result.status === "duplicate"
                        ? "text-gray-500"
                        : "text-red-600"
                    }`}
                  >
                    {result.status === "success"
                      ? "成功"
                      : result.status === "duplicate"
                      ? "已存在"
                      : result.error || "失败"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
