"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { containsCjk, ensureEnglish } from "@/lib/i18n/english";
import { getErrorMessage } from "@/lib/utils";

const TIMELINE_PHASES = [
  { phase: 1, label: { zh: "食谱研发", en: "Recipe Development" } },
  { phase: 3, label: { zh: "拍摄准备", en: "Photo Preparation" } },
  { phase: 4, label: { zh: "拍摄中", en: "Photo Shoot" } },
  { phase: 5, label: { zh: "质量审核", en: "Quality Review" } },
  { phase: 6, label: { zh: "最终呈现", en: "Final Presentation" } },
];

const PHASE_MIN_PROGRESS: Record<number, number> = {
  0: 1,
  1: 8,
  2: 24,
  3: 38,
  4: 52,
  5: 90,
  6: 100,
};

const TERMINAL_STATUSES = new Set(["completed", "failed"]);

interface TaskData {
  id: string;
  status: string;
  currentPhase: number;
  totalPhases: number;
  phaseProgress: number;
  overallProgress: number;
  totalImages: number;
  imagesDone: number;
  recipeName: string;
  recipeId: string | null;
  recipe: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
  } | null;
  message: {
    icon: string;
    title: string;
    detail: string;
    estimatedRemaining: string;
  };
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export default function CustomRecipeProgressPage() {
  const params = useParams();
  const rawTaskId = params.taskId;
  const rawLocale = params.locale;
  const taskId = Array.isArray(rawTaskId) ? rawTaskId[0] : rawTaskId;
  const locale = (Array.isArray(rawLocale) ? rawLocale[0] : rawLocale) || "zh-CN";
  const isZh = locale.startsWith("zh");

  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [phaseStartedAt, setPhaseStartedAt] = useState(Date.now());
  const [phaseElapsedSeconds, setPhaseElapsedSeconds] = useState(0);
  const currentPhase = task?.currentPhase;
  const taskStatus = task?.status;
  const overallProgress = task?.overallProgress ?? 0;

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    try {
      const res = await fetch(`/api/custom-recipes/tasks/${taskId}`, {
        headers: {
          "Accept-Language": isZh ? "zh-CN" : "en",
        },
      });
      const data = await res.json();

      if (data.success) {
        setTask(data.data);
        setError(null);
      } else {
        setError(getErrorMessage(data.error, isZh ? "获取任务状态失败" : "Failed to fetch task"));
      }
    } catch {
      setError(isZh ? "网络错误，请刷新页面" : "Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [isZh, taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    if (!taskId) return;
    if (taskStatus && TERMINAL_STATUSES.has(taskStatus)) return;
    const interval = setInterval(fetchTask, 1200);
    return () => clearInterval(interval);
  }, [fetchTask, taskId, taskStatus]);

  useEffect(() => {
    if (currentPhase == null) return;
    setPhaseStartedAt(Date.now());
    setPhaseElapsedSeconds(0);
  }, [currentPhase, taskStatus]);

  useEffect(() => {
    if (currentPhase == null || !taskStatus || TERMINAL_STATUSES.has(taskStatus)) return;

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - phaseStartedAt) / 1000));
      setPhaseElapsedSeconds(elapsed);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentPhase, phaseStartedAt, taskStatus]);

  useEffect(() => {
    if (currentPhase == null || !taskStatus) return;
    const serverProgress = Math.max(
      overallProgress,
      PHASE_MIN_PROGRESS[currentPhase] ?? 0
    );

    if (taskStatus === "completed") {
      setDisplayProgress(100);
      return;
    }

    setDisplayProgress((prev) => {
      const nextFloor = taskStatus === "failed" ? prev : Math.max(prev, serverProgress);
      return Math.min(99, nextFloor);
    });
  }, [currentPhase, overallProgress, taskStatus]);

  useEffect(() => {
    if (currentPhase == null || !taskStatus || TERMINAL_STATUSES.has(taskStatus)) return;

    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        const serverProgress = Math.max(
          overallProgress,
          PHASE_MIN_PROGRESS[currentPhase] ?? 0
        );
        const cap = Math.min(99, serverProgress + 6);
        if (prev >= cap) return prev;
        const eased = prev + Math.max(0.4, (cap - prev) * 0.12);
        return Number(Math.min(cap, eased).toFixed(1));
      });
    }, 180);

    return () => clearInterval(interval);
  }, [currentPhase, overallProgress, taskStatus]);

  const handleRetry = async () => {
    if (!taskId) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/custom-recipes/tasks/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      const data = await res.json();
      if (data.success) {
        setDisplayProgress(0);
        fetchTask();
      } else {
        setError(getErrorMessage(data.error, isZh ? "重试失败" : "Retry failed"));
      }
    } catch {
      setError(isZh ? "重试失败，请稍后再试" : "Retry failed. Please try again later.");
    } finally {
      setRetrying(false);
    }
  };

  const getDuration = () => {
    if (!task?.startedAt) return "";
    const start = new Date(task.startedAt).getTime();
    const end = task.completedAt ? new Date(task.completedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return isZh ? `${minutes} 分 ${remainingSeconds} 秒` : `${minutes}m ${remainingSeconds}s`;
    }
    return isZh ? `${seconds} 秒` : `${seconds}s`;
  };

  const progressPercent = Math.max(0, Math.min(100, Math.round(displayProgress)));

  const phaseElapsedText = useMemo(() => {
    if (phaseElapsedSeconds <= 0) return "";
    if (phaseElapsedSeconds < 60) {
      return isZh ? `当前阶段已进行 ${phaseElapsedSeconds} 秒` : `Current phase ${phaseElapsedSeconds}s`;
    }
    const minutes = Math.floor(phaseElapsedSeconds / 60);
    const seconds = phaseElapsedSeconds % 60;
    return isZh
      ? `当前阶段已进行 ${minutes} 分 ${seconds} 秒`
      : `Current phase ${minutes}m ${seconds}s`;
  }, [isZh, phaseElapsedSeconds]);

  if (!taskId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <p className="text-textGray">{isZh ? "无效任务 ID" : "Invalid task id"}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brownWarm border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-textGray">{isZh ? "加载中..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-medium text-textDark mb-2">{isZh ? "出错了" : "Error"}</h1>
          <p className="text-textGray mb-6">{error}</p>
          <Link
            href={`/${locale}/custom-recipes`}
            className="inline-block px-6 py-3 bg-brownWarm text-white rounded-full hover:bg-brownDark transition-colors"
          >
            {isZh ? "返回定制页面" : "Back to Custom Recipes"}
          </Link>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";
  const displayRecipeName = isZh
    ? task.recipeName
    : ensureEnglish(task.recipeName, "your recipe");
  const fallbackTaskError = isZh ? "制作过程中遇到问题" : "An error occurred";
  const displayTaskError = task.errorMessage
    ? isZh
      ? task.errorMessage
      : containsCjk(task.errorMessage)
        ? fallbackTaskError
        : task.errorMessage
    : fallbackTaskError;

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/${locale}/custom-recipes`}
          className="inline-flex items-center text-textGray hover:text-brownWarm transition-colors mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isZh ? "返回" : "Back"}
        </Link>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{task.message.icon}</div>
            <h1 className="text-2xl font-medium text-textDark mb-2">
              {isCompleted
                ? isZh
                  ? "制作完成！"
                  : "Completed!"
                : isFailed
                  ? isZh
                    ? "制作遇到问题"
                    : "Issue Encountered"
                  : isZh
                    ? `正在为您制作《${displayRecipeName}》`
                    : `Creating "${displayRecipeName}" for you`}
            </h1>
          </div>

          {isCompleted && task.recipe?.coverImage && (
            <div className="mb-8">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-lightGray">
                <Image src={task.recipe.coverImage} alt={displayRecipeName} fill className="object-cover" unoptimized />
              </div>
            </div>
          )}

          {isFailed && (
            <div className="mb-8 p-4 bg-red-50 rounded-xl">
              <p className="text-red-600 text-center">{displayTaskError}</p>
            </div>
          )}

          {!isCompleted && !isFailed && (
            <>
              <div className="mb-6">
                <div className="flex justify-between text-sm text-textGray mb-2">
                  <span>{task.message.title}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-3 bg-lightGray rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brownWarm transition-all duration-300 rounded-full relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="text-textGray">{task.message.detail}</p>
                <p className="text-sm text-textGray/70 mt-2">
                  {isZh ? "预计剩余：" : "Estimated: "}
                  {task.message.estimatedRemaining}
                </p>
                {phaseElapsedText ? (
                  <p className="text-xs text-textGray/70 mt-1">{phaseElapsedText}</p>
                ) : null}
              </div>
            </>
          )}

          <div className="border-t border-lightGray pt-6 mb-8">
            <h3 className="text-sm font-medium text-textGray mb-4">{isZh ? "制作流程" : "Process"}</h3>
            <div className="space-y-3">
              {TIMELINE_PHASES.map((phase) => {
                const isActive = task.currentPhase === phase.phase;
                const isDone = task.currentPhase > phase.phase;

                return (
                  <div key={phase.phase} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-brownWarm text-white animate-pulse"
                            : "bg-lightGray text-textGray"
                      }`}
                    >
                      {isDone ? "✓" : isActive ? "●" : "○"}
                    </div>
                    <div className="flex-1">
                      <span
                        className={`text-sm ${
                          isDone
                            ? "text-green-600"
                            : isActive
                              ? "text-brownWarm font-medium"
                              : "text-textGray"
                        }`}
                      >
                        {isZh ? phase.label.zh : phase.label.en}
                      </span>
                      {isActive && task.status === "images_generating" && task.totalImages > 0 && (
                        <span className="text-xs text-textGray ml-2">
                          ({task.imagesDone}/{task.totalImages})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isCompleted && task.recipe && (
              <>
                <Link
                  href={`/${locale}/recipe/${task.recipe.slug || task.recipe.id}`}
                  className="px-8 py-3 bg-brownWarm text-white rounded-full hover:bg-brownDark transition-colors text-center"
                >
                  {isZh ? "查看食谱" : "View Recipe"}
                </Link>
                <Link
                  href={`/${locale}/custom-recipes`}
                  className="px-8 py-3 border border-brownWarm text-brownWarm rounded-full hover:bg-brownWarm/10 transition-colors text-center"
                >
                  {isZh ? "继续定制" : "Create Another"}
                </Link>
              </>
            )}

            {isFailed && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-8 py-3 bg-brownWarm text-white rounded-full hover:bg-brownDark transition-colors disabled:opacity-50"
              >
                {retrying ? (isZh ? "重试中..." : "Retrying...") : isZh ? "重新制作" : "Try Again"}
              </button>
            )}
          </div>

          {(isCompleted || isFailed) && task.startedAt && (
            <div className="mt-6 pt-6 border-t border-lightGray text-center text-sm text-textGray">
              <p>
                {isZh ? "制作用时：" : "Duration: "}
                {getDuration()}
              </p>
              {isCompleted && task.totalImages > 0 && (
                <p className="mt-1">
                  {isZh
                    ? `共生成 ${task.totalImages} 张图片`
                    : `${task.totalImages} images generated`}
                </p>
              )}
            </div>
          )}
        </div>

        {!isCompleted && !isFailed && (
          <div className="mt-6 text-center text-sm text-textGray">
            <p>
              {isZh
                ? "我们的团队正在持续完善细节，完成后会自动跳转到食谱详情。"
                : "The team is refining every detail. You will be redirected after completion."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
