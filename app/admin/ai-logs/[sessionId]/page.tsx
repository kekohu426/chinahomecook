/**
 * AI 生成日志 - 会话详情页
 *
 * 路由: /admin/ai-logs/[sessionId]
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Clock, DollarSign, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { use } from "react";

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                href={`/admin/recipes/${session.recipeId}`}
                className="text-blue-700 hover:underline"
              >
                关联食谱: {session.recipeId}
              </Link>
            )}
            {session.jobId && (
              <Link
                href={`/admin/jobs/${session.jobId}`}
                className="text-blue-700 hover:underline"
              >
                关联任务: {session.jobId}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 步骤链路 */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6 border-b border-cream">
          <h2 className="text-lg font-medium text-textDark">步骤链路</h2>
        </div>

        <div className="p-6 space-y-4">
          {session.steps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.id);
            const isLast = index === session.steps.length - 1;

            return (
              <div key={step.id}>
                <div
                  onClick={() => toggleStep(step.id)}
                  className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                >
                  {/* 步骤序号 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.status === "success"
                          ? "bg-green-100 text-green-700"
                          : step.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* 步骤信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-textDark">{step.stepName}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                        {step.modelName}
                      </span>
                      {step.provider && (
                        <span className="text-xs text-textGray">{step.provider}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-textGray">
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
                          {step.tokenUsage.total || step.tokenUsage.input + step.tokenUsage.output} tokens
                        </span>
                      )}
                      <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {step.errorMessage && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{step.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 展开的详情 */}
                {isExpanded && (
                  <div className="ml-16 mt-2 space-y-4 p-4 bg-gray-50 rounded-lg">
                    {/* Prompt */}
                    {(step.prompt || step.promptUrl) && (
                      <div>
                        <div className="text-sm font-medium text-textDark mb-2">Prompt</div>
                        <pre className="text-xs bg-white p-3 rounded border border-cream overflow-x-auto max-h-60 overflow-y-auto">
                          {step.prompt || `[External: ${step.promptUrl}]`}
                        </pre>
                      </div>
                    )}

                    {/* Parameters */}
                    {step.parameters && (
                      <div>
                        <div className="text-sm font-medium text-textDark mb-2">参数</div>
                        <pre className="text-xs bg-white p-3 rounded border border-cream overflow-x-auto">
                          {JSON.stringify(step.parameters, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Result */}
                    {(step.result || step.resultText) && (
                      <div>
                        <div className="text-sm font-medium text-textDark mb-2">结果</div>
                        <pre className="text-xs bg-white p-3 rounded border border-cream overflow-x-auto max-h-60 overflow-y-auto">
                          {step.resultText || JSON.stringify(step.result, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Images */}
                    {step.resultImages && step.resultImages.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-textDark mb-2">生成图片</div>
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
                        <div className="text-sm font-medium text-textDark mb-2">错误堆栈</div>
                        <pre className="text-xs bg-white p-3 rounded border border-red-200 overflow-x-auto max-h-40 overflow-y-auto text-red-800">
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
