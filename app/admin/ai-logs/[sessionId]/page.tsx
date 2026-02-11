/**
 * AI 生成日志 - 会话详情页
 *
 * 路由: /admin/ai-logs/[sessionId]
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Clock, DollarSign, AlertCircle, CheckCircle, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { use } from "react";
import { JsonView, allExpanded, collapseAllNested, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

interface LogStep {
  id: string;
  stepName: string;
  modelName: string;
  provider: string | null;
  status: string;
  timestamp: string;
  durationMs: number | null;
  cost: number | null;
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
}

interface SessionDetail {
  sessionId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalCost: number;
  totalTokens: number;
  hasError: boolean;
  recipeId?: string;
  jobId?: string;
  stepCount: number;
  steps: LogStep[];
}

const STEP_LABELS: Record<string, string> = {
  import_start: "批量导入-开始",
  import_validation: "批量导入-校验",
  import_create: "批量导入-入库",
};

const getStepLabel = (stepName: string) => STEP_LABELS[stepName] || stepName;

const formatStepTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getBusinessName = (step: LogStep) => {
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

// 复制按钮组件
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-textGray hover:text-textDark hover:bg-gray-100 rounded transition-colors"
      title="复制到剪贴板"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">已复制</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}

// 可折叠文本块组件
function CollapsibleText({
  title,
  content,
  maxHeight = 200,
  className = ""
}: {
  title: string;
  content: string;
  maxHeight?: number;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsExpand = content.length > 500;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-textDark">{title}</div>
        <CopyButton text={content} />
      </div>
      <div className="relative">
        <pre
          className={`text-xs bg-white p-3 rounded border border-cream overflow-x-auto whitespace-pre-wrap break-words ${
            !isExpanded && needsExpand ? `max-h-[${maxHeight}px] overflow-hidden` : ""
          }`}
          style={!isExpanded && needsExpand ? { maxHeight: `${maxHeight}px` } : {}}
        >
          {content}
        </pre>
        {needsExpand && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-brownWarm hover:underline"
            >
              展开全部 ({content.length} 字符)
            </button>
          </div>
        )}
        {isExpanded && needsExpand && (
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-2 text-xs text-brownWarm hover:underline"
          >
            收起
          </button>
        )}
      </div>
    </div>
  );
}

// JSON 查看器组件
function JsonViewer({
  title,
  data,
  defaultExpanded = false
}: {
  title: string;
  data: any;
  defaultExpanded?: boolean;
}) {
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree");

  if (!data) return null;

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-textDark">{title}</div>
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-cream">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-2 py-1 text-xs ${viewMode === "tree" ? "bg-brownWarm text-white" : "bg-white text-textGray hover:bg-gray-50"}`}
            >
              树形
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-2 py-1 text-xs ${viewMode === "raw" ? "bg-brownWarm text-white" : "bg-white text-textGray hover:bg-gray-50"}`}
            >
              原始
            </button>
          </div>
          <CopyButton text={jsonString} />
        </div>
      </div>
      <div className="bg-white rounded border border-cream overflow-hidden">
        {viewMode === "tree" ? (
          <div className="p-3 max-h-80 overflow-auto text-xs">
            <JsonView
              data={data}
              shouldExpandNode={defaultExpanded ? allExpanded : collapseAllNested}
              style={{
                ...defaultStyles,
                container: "font-mono",
                basicChildStyle: "pl-4",
                label: "text-purple-700 font-medium",
                nullValue: "text-gray-400",
                undefinedValue: "text-gray-400",
                numberValue: "text-blue-600",
                stringValue: "text-green-700",
                booleanValue: "text-orange-600",
                punctuation: "text-gray-500",
                collapseIcon: "text-gray-400 cursor-pointer hover:text-gray-600",
                expandIcon: "text-gray-400 cursor-pointer hover:text-gray-600",
              }}
            />
          </div>
        ) : (
          <pre className="text-xs p-3 max-h-80 overflow-auto whitespace-pre-wrap break-words">
            {jsonString}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/ai-generation-logs/sessions/${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
        // 默认展开第一个步骤
        if (data.data.steps.length > 0) {
          setExpandedSteps(new Set([data.data.steps[0].id]));
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (session) {
      setExpandedSteps(new Set(session.steps.map(s => s.id)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brownWarm" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-textGray">会话不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ai-logs"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-textGray" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-medium text-textDark">
            会话详情
          </h1>
          <p className="text-sm text-textGray font-mono">{session.sessionId}</p>
        </div>
      </div>

      {/* 汇总信息 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">状态</div>
          <div className="flex items-center gap-2">
            {session.hasError ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-lg font-bold text-red-600">失败</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-lg font-bold text-green-600">成功</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">步骤数</div>
          <div className="text-2xl font-bold text-textDark">{session.stepCount}</div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">总耗时</div>
          <div className="text-2xl font-bold text-textDark">
            {formatDuration(session.totalDuration)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">总成本</div>
          <div className="text-2xl font-bold text-textDark">
            ${session.totalCost.toFixed(4)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="text-sm text-textGray mb-1">Token 用量</div>
          <div className="text-2xl font-bold text-textDark">
            {session.totalTokens.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 关联信息 */}
      {(session.recipeId || session.jobId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-4 text-sm">
            {session.recipeId && (
              <Link
                href={`/admin/recipes/${session.recipeId}/edit`}
                className="text-blue-700 hover:underline"
              >
                📋 关联食谱: {session.recipeId}
              </Link>
            )}
            {session.jobId && (
              <Link
                href={`/admin/jobs/${session.jobId}`}
                className="text-blue-700 hover:underline"
              >
                ⚙️ 关联任务: {session.jobId}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 步骤链路 */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6 border-b border-cream flex items-center justify-between">
          <h2 className="text-lg font-medium text-textDark">步骤链路</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-xs text-textGray hover:text-textDark hover:bg-gray-100 rounded transition-colors"
            >
              全部展开
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-xs text-textGray hover:text-textDark hover:bg-gray-100 rounded transition-colors"
            >
              全部折叠
            </button>
          </div>
        </div>

        <div className="p-6 space-y-2">
          {session.steps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.id);
            const isLast = index === session.steps.length - 1;
            const businessName = getBusinessName(step);

            return (
              <div key={step.id} className="relative">
                {/* 连接线 */}
                {!isLast && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div
                  onClick={() => toggleStep(step.id)}
                  className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg transition-colors ${
                    isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                >
                  {/* 步骤序号 */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      step.status === "success"
                        ? "bg-green-100 text-green-700"
                        : step.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* 步骤信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-medium text-textDark">
                        {getStepLabel(step.stepName)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        {step.modelName}
                      </span>
                      {step.provider && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {step.provider}
                        </span>
                      )}
                      {step.retryIndex !== null && step.retryIndex > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          重试 #{step.retryIndex}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-textGray flex-wrap">
                      {businessName && <span>业务：{businessName}</span>}
                      {step.durationMs !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(step.durationMs)}
                        </span>
                      )}
                      {step.cost !== null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${step.cost.toFixed(4)}
                        </span>
                      )}
                      {step.tokenUsage && (
                        <span>
                          {step.tokenUsage.total || (step.tokenUsage.input || 0) + (step.tokenUsage.output || 0)} tokens
                        </span>
                      )}
                      <span>{formatStepTime(step.timestamp)}</span>
                    </div>

                    {step.errorMessage && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{step.errorMessage}</p>
                      </div>
                    )}

                    {step.warning && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">{step.warning}</p>
                      </div>
                    )}
                  </div>

                  {/* 展开/折叠图标 */}
                  <div className="flex-shrink-0 text-textGray">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {/* 展开的详情 */}
                {isExpanded && (
                  <div className="ml-12 mt-2 mb-4 space-y-4 p-4 bg-white border border-cream rounded-lg">
                    {/* Prompt */}
                    {(step.prompt || step.promptUrl) && (
                      <CollapsibleText
                        title="Prompt"
                        content={step.prompt || `[External: ${step.promptUrl}]`}
                        maxHeight={200}
                      />
                    )}
                    {!step.prompt && !step.promptUrl && (
                      <div className="text-sm text-textGray">提示词：无</div>
                    )}

                    {/* Parameters */}
                    {step.parameters && (
                      <JsonViewer title="参数" data={step.parameters} defaultExpanded />
                    )}

                    {/* Result */}
                    {step.resultText && (
                      <CollapsibleText
                        title="结果 (文本)"
                        content={step.resultText}
                        maxHeight={300}
                      />
                    )}

                    {step.result && !step.resultText && (
                      <JsonViewer title="结果" data={step.result} />
                    )}

                    {!step.resultText &&
                      !step.result &&
                      (!step.resultImages || step.resultImages.length === 0) && (
                        <div className="text-sm text-textGray">结果：无</div>
                      )}

                    {/* Token Usage */}
                    {step.tokenUsage && (
                      <JsonViewer title="Token 使用详情" data={step.tokenUsage} defaultExpanded />
                    )}

                    {/* Images */}
                    {step.resultImages && step.resultImages.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-textDark mb-2">
                          生成图片 ({step.resultImages.length})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {step.resultImages.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                            >
                              <img
                                src={url}
                                alt={`Generated ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Stack */}
                    {step.errorStack && (
                      <div>
                        <div className="text-sm font-medium text-red-700 mb-2">错误堆栈</div>
                        <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-x-auto max-h-40 overflow-y-auto text-red-800 whitespace-pre-wrap">
                          {step.errorStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
