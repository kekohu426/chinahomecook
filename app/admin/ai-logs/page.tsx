/**
 * AI 生成日志 - 调用监控页面
 *
 * 路由: /admin/ai-logs
 * 功能: 清晰展示系统与 AI 的每次交互记录
 */

"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

interface Session {
  sessionId: string;
  taskName: string;
  stepCount: number;
  startTime: string;
  endTime: string;
  totalDuration: number;
  hasError: boolean;
  recipeId?: string;
  jobId?: string;
  contentType: "text" | "image" | "mixed";
  previewText?: string;
  previewImages?: string[];
  finalStepName?: string;
  steps: Array<{ stepName: string; status: string }>;
}

interface SessionDetail {
  sessionId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalTokens: number;
  hasError: boolean;
  recipeId?: string;
  jobId?: string;
  stepCount: number;
  steps: Array<{
    id: string;
    stepName: string;
    modelName: string;
    provider: string | null;
    status: string;
    timestamp: string;
    durationMs: number | null;
    prompt: string | null;
    promptUrl: string | null;
    parameters: any;
    metadata?: any;
    result: any;
    resultText: string | null;
    resultImages: string[];
    tokenUsage: any;
    errorMessage: string | null;
    errorStack: string | null;
    warning: string | null;
    retryIndex: number | null;
  }>;
}

// 步骤名称映射
const STEP_LABELS: Record<string, string> = {
  text_generation: "Text Generation",
  recipe_generate: "Recipe Generation",
  step_image_gen: "Step Image Generation",
  cover_image_gen: "Cover Image Generation",
  prompt_generation: "Prompt Generation",
  translation: "Translation",
  blog_generate: "Blog Generation",
  blog_generate_full: "Blog Full Generation",
  blog_cover_generation: "Blog Cover Generation",
  recommend_dishes: "Dish Recommendation",
  image_generation: "Image Generation",
  import_start: "批量导入-开始",
  import_validation: "批量导入-校验",
  import_create: "批量导入-入库",
};

// 复制按钮组件
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-gray-200 rounded transition-colors"
      title="复制"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-400" />
      )}
    </button>
  );
}

export default function AILogsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Record<string, SessionDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

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

  const toggleExpand = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }

    setExpandedSession(sessionId);

    if (!sessionDetails[sessionId]) {
      setLoadingDetail(sessionId);
      try {
        const response = await fetch(`/api/v1/ai-generation-logs/sessions/${sessionId}`);
        const data = await response.json();
        if (data.success) {
          setSessionDetails((prev) => ({ ...prev, [sessionId]: data.data }));
        }
      } catch (error) {
        console.error("Failed to load session detail:", error);
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTokens = (usage: any) => {
    if (!usage) return null;
    const input = usage.input || usage.promptTokens || 0;
    const output = usage.output || usage.completionTokens || 0;
    const total = usage.total || input + output;
    return { input, output, total };
  };

  const formatStepTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getBusinessName = (step: SessionDetail["steps"][number]) => {
    const metadata = step.metadata as Record<string, unknown> | null | undefined;
    const parameters = step.parameters as Record<string, unknown> | null | undefined;

    if (step.stepName.startsWith("import_")) {
      const recipeName = metadata?.recipeName as string | undefined;
      if (recipeName) return recipeName;
      const count = metadata?.count as number | string | undefined;
      if (typeof count === "number") return `批量导入（${count}个）`;
      if (typeof count === "string") {
        const parsed = parseInt(count, 10);
        if (!Number.isNaN(parsed)) return `批量导入（${parsed}个）`;
      }
      if (step.resultText) {
        const match = step.resultText.match(/count=(\d+)/);
        if (match) return `批量导入（${parseInt(match[1], 10)}个）`;
        return step.resultText;
      }
    }

    return (
      (metadata?.dishName as string | undefined) ||
      (metadata?.recipeName as string | undefined) ||
      (metadata?.title as string | undefined) ||
      (parameters?.dishName as string | undefined) ||
      (parameters?.recipeName as string | undefined) ||
      (parameters?.title as string | undefined) ||
      ""
    );
  };

  const getStepLabel = (stepName: string) => STEP_LABELS[stepName] || stepName;

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-medium text-textDark">AI 调用记录</h1>
        <p className="text-sm text-textGray mt-1">
          监控系统与 AI 的每次交互：时间、业务、提示词、耗时、Token、返回结果
        </p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-2xl font-semibold text-textDark">{total}</div>
          <div className="text-sm text-textGray">总调用次数</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-2xl font-semibold text-green-600">
            {sessions.length > 0
              ? `${((sessions.filter((s) => !s.hasError).length / sessions.length) * 100).toFixed(0)}%`
              : "-"}
          </div>
          <div className="text-sm text-textGray">成功率</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-2xl font-semibold text-textDark">
            {sessions.length > 0
              ? formatDuration(
                  sessions.reduce((sum, s) => sum + s.totalDuration, 0) / sessions.length
                )
              : "-"}
          </div>
          <div className="text-sm text-textGray">平均耗时</div>
        </div>
      </div>

      {/* 调用列表 */}
      <div className="bg-white rounded-lg border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-textGray">暂无记录</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => {
              const isExpanded = expandedSession === session.sessionId;
              const detail = sessionDetails[session.sessionId];
              const isLoadingThis = loadingDetail === session.sessionId;

              return (
                <div key={session.sessionId}>
                  {/* 会话行 - 可点击展开 */}
                  <div
                    onClick={() => toggleExpand(session.sessionId)}
                    className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      {/* 左侧：状态 + 业务名称 + 时间 */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* 状态指示 */}
                        {session.hasError ? (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}

                        {/* 业务名称 */}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-textDark truncate">
                            {session.taskName}
                          </div>
                          <div className="text-xs text-textGray mt-0.5">
                            {formatDateTime(session.startTime)}
                          </div>
                        </div>
                      </div>

                      {/* 右侧：统计信息 */}
                      <div className="flex items-center gap-6 text-sm text-textGray">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-4 w-4" />
                          <span>{session.stepCount} 次调用</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(session.totalDuration)}</span>
                        </div>
                        <div className="w-5">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 展开的详情 */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {isLoadingThis ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : detail ? (
                        <div className="p-5 space-y-4">
                          {detail.steps.map((step, index) => {
                            const tokens = formatTokens(step.tokenUsage);

                            return (
                              <div
                                key={step.id}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                              >
                                {/* 步骤头部 */}
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {/* 序号 */}
                                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center">
                                        {index + 1}
                                      </span>
                                      {/* 步骤类型 */}
                                      <span className="font-medium text-textDark">
                                        {getStepLabel(step.stepName)}
                                      </span>
                                      {/* 模型 */}
                                      <span className="text-sm text-textGray">
                                        {step.modelName}
                                        {step.provider && ` (${step.provider})`}
                                      </span>
                                    </div>
                                    {/* 状态和统计 */}
                                    <div className="flex items-center gap-4 text-sm">
                                      {step.durationMs !== null && (
                                        <span className="text-textGray">
                                          {formatDuration(step.durationMs)}
                                        </span>
                                      )}
                                      {tokens && (
                                        <span className="text-textGray">
                                          {tokens.total.toLocaleString()} tokens
                                        </span>
                                      )}
                                      {step.status === "success" ? (
                                        <span className="text-green-600 text-xs font-medium">
                                          成功
                                        </span>
                                      ) : step.status === "failed" ? (
                                        <span className="text-red-600 text-xs font-medium">
                                          失败
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-textGray">
                                    <span>时间：{formatStepTime(step.timestamp)}</span>
                                    {getBusinessName(step) && (
                                      <span>业务：{getBusinessName(step)}</span>
                                    )}
                                  </div>

                                  {/* Token 详情 */}
                                  {tokens && (
                                    <div className="mt-2 text-xs text-textGray">
                                      输入 {tokens.input.toLocaleString()} + 输出{" "}
                                      {tokens.output.toLocaleString()} = {tokens.total.toLocaleString()} tokens
                                    </div>
                                  )}
                                </div>

                                {/* 步骤内容 */}
                                <div className="p-4 space-y-4">
                                  {/* 提示词 */}
                                  {step.prompt && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-textDark">
                                          <MessageSquare className="h-4 w-4 text-blue-500" />
                                          提示词
                                        </div>
                                        <CopyButton text={step.prompt} />
                                      </div>
                                      <div className="bg-blue-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                                          {step.prompt}
                                        </pre>
                                      </div>
                                    </div>
                                  )}

                                  {step.promptUrl && !step.prompt && (
                                    <div className="text-sm text-textGray">
                                      提示词外部链接：{step.promptUrl}
                                    </div>
                                  )}

                                  {!step.prompt && !step.promptUrl && (
                                    <div className="text-sm text-textGray">提示词：无</div>
                                  )}

                                  {/* 错误信息 */}
                                  {step.errorMessage && (
                                    <div>
                                      <div className="text-sm font-medium text-red-600 mb-2">
                                        错误信息
                                      </div>
                                      <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                                        {step.errorMessage}
                                      </div>
                                    </div>
                                  )}

                                  {/* 返回结果 - 文本 */}
                                  {step.resultText && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-textDark">
                                          <ArrowRight className="h-4 w-4 text-green-500" />
                                          返回结果
                                        </div>
                                        <CopyButton text={step.resultText} />
                                      </div>
                                      <div className="bg-green-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                                          {step.resultText}
                                        </pre>
                                      </div>
                                    </div>
                                  )}

                                  {!step.resultText &&
                                    !step.result &&
                                    (!step.resultImages || step.resultImages.length === 0) && (
                                      <div className="text-sm text-textGray">结果：无</div>
                                    )}

                                  {/* 返回结果 - 图片 */}
                                  {step.resultImages && step.resultImages.length > 0 && (
                                    <div>
                                      <div className="text-sm font-medium text-textDark mb-2">
                                        生成图片 ({step.resultImages.length} 张)
                                      </div>
                                      <div className="flex gap-3 flex-wrap">
                                        {step.resultImages.map((url, i) => (
                                          <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-24 h-24 rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                                          >
                                            <img
                                              src={url}
                                              alt={`生成图片 ${i + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-textGray text-sm">
                          加载失败
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-textGray hover:text-textDark disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-textGray">
              {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-3 py-1.5 text-sm text-textGray hover:text-textDark disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
