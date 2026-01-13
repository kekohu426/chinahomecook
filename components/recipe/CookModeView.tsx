/**
 * CookModeView 组件
 *
 * 全屏"COOK NOW"模式：沉浸式烹饪助手
 *
 * 设计特点：
 * - 桌面端：左右分栏布局（左图右文）
 * - 移动端：优化的垂直布局
 * - 暖色调背景，治愈系风格
 * - 手势滑动切换步骤
 * - 计时器支持暂停/重置
 * - 键盘快捷键支持
 */

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { RecipeStep } from "@/types/recipe";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { StepImage } from "@/components/ui/SafeImage";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CookModeViewProps {
  steps: RecipeStep[];
  recipeTitle: string;
  triggerClassName?: string;
  stepImages?: Record<string, string | undefined>;
}

export function CookModeView({
  steps,
  recipeTitle,
  triggerClassName,
  stepImages,
}: CookModeViewProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 计时器状态
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 手势滑动
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentIndex];
  const totalSteps = steps.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalSteps - 1;

  // 获取当前步骤图片
  const currentImage = currentStep ? stepImages?.[currentStep.id] : undefined;

  // 清理计时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 关闭模态框时重置状态
  useEffect(() => {
    if (!open) {
      setTimerState("idle");
      setTimeLeft(0);
      clearTimer();
    }
  }, [open, clearTimer]);

  // 切换步骤时重置计时器
  useEffect(() => {
    setTimerState("idle");
    setTimeLeft(0);
    clearTimer();
  }, [currentIndex, clearTimer]);

  // 计时器逻辑
  useEffect(() => {
    if (timerState === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setTimerState("idle");
            // 计时结束提示
            if (typeof window !== "undefined") {
              try {
                new Audio("/sounds/timer-done.mp3").play().catch(() => {});
              } catch {}
              if ("vibrate" in navigator) {
                navigator.vibrate([200, 100, 200]);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [timerState, clearTimer]);

  // 开始计时
  const startTimer = () => {
    const timerSec = currentStep?.timerSec ?? 0;
    if (!currentStep || timerSec <= 0) return;
    if (timerState === "idle") {
      setTimeLeft(timerSec);
    }
    setTimerState("running");
  };

  // 暂停计时
  const pauseTimer = () => {
    clearTimer();
    setTimerState("paused");
  };

  // 重置计时
  const resetTimer = () => {
    clearTimer();
    setTimerState("idle");
    setTimeLeft(0);
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 语音朗读
  const speakStep = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = currentStep?.speechText || currentStep?.action || "";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEn ? "en-US" : "zh-CN";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 导航函数
  const goToPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((prev) => prev - 1);
  }, [hasPrev]);

  const goToNext = useCallback(() => {
    if (hasNext) setCurrentIndex((prev) => prev + 1);
  }, [hasNext]);

  // 键盘快捷键
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case " ": // 空格键控制计时器
          e.preventDefault();
          if (timerState === "running") {
            pauseTimer();
          } else if (timerState === "paused" || timerState === "idle") {
            startTimer();
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
        case "r":
        case "R":
          e.preventDefault();
          speakStep();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrev, goToNext, timerState]);

  // 手势滑动处理
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // 最小滑动距离

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 向左滑 -> 下一步
        goToNext();
      } else {
        // 向右滑 -> 上一步
        goToPrev();
      }
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "bg-gradient-to-r from-amber-700 to-amber-800 text-white px-8 py-3 rounded-full font-medium",
          "hover:from-amber-600 hover:to-amber-700 transition-all duration-300",
          "flex items-center gap-3 shadow-lg hover:shadow-xl",
          "transform hover:scale-[1.02]",
          triggerClassName
        )}
      >
        <Play className="w-5 h-5 fill-current" />
        <span className="tracking-wide">
          {isEn ? "Start Cooking" : "开始烹饪"}
        </span>
      </button>

      {/* 全屏模态框 */}
      {open && currentStep && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 顶部导航栏 */}
          <header className="absolute top-0 inset-x-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              {/* 左侧：菜名 + 进度 */}
              <div className="flex items-center gap-4">
                <h1 className="text-white/90 font-medium text-lg hidden sm:block">
                  {recipeTitle}
                </h1>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                  <span className="text-amber-400 font-bold text-lg">
                    {currentIndex + 1}
                  </span>
                  <span className="text-white/50">/</span>
                  <span className="text-white/70">{totalSteps}</span>
                </div>
              </div>

              {/* 右侧：退出按钮 */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {isEn ? "Exit" : "退出"}
                </span>
              </button>
            </div>
          </header>

          {/* 主内容区 - 左右分栏 */}
          <main className="h-full pt-16 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="h-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10">

              {/* 左侧：步骤图片 - 使用 SafeImage 支持加载失败回退 */}
              <div className="lg:w-1/2 flex-shrink-0">
                <div className="relative h-[280px] sm:h-[360px] lg:h-full rounded-2xl overflow-hidden bg-stone-800/50 shadow-2xl">
                  <StepImage src={currentImage} alt={currentStep.title} />

                  {/* 步骤编号角标 */}
                  <div className="absolute top-4 left-4 bg-amber-600 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg z-10">
                    STEP {(currentIndex + 1).toString().padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* 右侧：步骤内容 */}
              <div className="lg:w-1/2 flex flex-col justify-center">
                {/* 步骤标题 */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-6 leading-tight">
                  {currentStep.title}
                </h2>

                {/* 步骤描述 */}
                <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8">
                  {currentStep.action}
                </p>

                {/* 状态检查 */}
                {currentStep.visualCue && (
                  <div className="flex items-start gap-3 bg-amber-900/30 border border-amber-700/30 rounded-xl px-5 py-4 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-200 font-medium text-sm mb-1">
                        {isEn ? "Done when" : "完成标志"}
                      </p>
                      <p className="text-white/80">{currentStep.visualCue}</p>
                    </div>
                  </div>
                )}

                {/* 计时器区域 */}
                {(currentStep.timerSec ?? 0) > 0 && (
                  <div className="bg-stone-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    {/* 计时器显示 */}
                    <div className="text-center mb-4">
                      <div className={cn(
                        "text-6xl sm:text-7xl font-mono font-bold tracking-wider",
                        timerState === "running" ? "text-amber-400" : "text-white/70"
                      )}>
                        {timerState === "idle"
                          ? formatTime(currentStep.timerSec ?? 0)
                          : formatTime(timeLeft)
                        }
                      </div>
                      <p className="text-white/50 text-sm mt-2">
                        {timerState === "idle" &&
                          (isEn ? "Click to start timer" : "点击开始计时")}
                        {timerState === "running" &&
                          (isEn ? "Timer running..." : "计时进行中...")}
                        {timerState === "paused" &&
                          (isEn ? "Paused" : "已暂停")}
                      </p>
                    </div>

                    {/* 计时器控制按钮 */}
                    <div className="flex items-center justify-center gap-4">
                      {timerState === "running" ? (
                        <button
                          onClick={pauseTimer}
                          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-medium transition-colors"
                        >
                          <Pause className="w-5 h-5" />
                          {isEn ? "Pause" : "暂停"}
                        </button>
                      ) : (
                        <button
                          onClick={startTimer}
                          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-medium transition-colors"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          {timerState === "paused"
                            ? isEn
                              ? "Resume"
                              : "继续"
                            : isEn
                            ? "Start"
                            : "开始"}
                        </button>
                      )}

                      {(timerState === "running" || timerState === "paused") && (
                        <button
                          onClick={resetTimer}
                          className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-full transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" />
                          {isEn ? "Reset" : "重置"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 语音朗读按钮 */}
                <button
                  onClick={speakStep}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{isEn ? "Read step" : "朗读步骤"}</span>
                  <span className="text-white/40 text-sm">
                    {isEn ? "(press R)" : "(按 R 键)"}
                  </span>
                </button>
              </div>
            </div>
          </main>

          {/* 底部导航 */}
          <footer className="absolute bottom-0 inset-x-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              <div className="flex items-center justify-between">
                {/* 上一步 */}
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={!hasPrev}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all",
                    hasPrev
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {isEn ? "Previous" : "上一步"}
                  </span>
                </button>

                {/* 进度指示器 */}
                <div className="flex items-center gap-2">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "transition-all duration-300 rounded-full",
                        idx === currentIndex
                          ? "w-8 h-3 bg-amber-500"
                          : idx < currentIndex
                          ? "w-3 h-3 bg-amber-700 hover:bg-amber-600"
                          : "w-3 h-3 bg-white/20 hover:bg-white/30"
                      )}
                      aria-label={
                        isEn
                          ? `Jump to step ${idx + 1}`
                          : `跳转到步骤 ${idx + 1}`
                      }
                    />
                  ))}
                </div>

                {/* 下一步 */}
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={!hasNext}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all",
                    hasNext
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  )}
                >
                  <span className="hidden sm:inline">
                    {isEn ? "Next" : "下一步"}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 快捷键提示 */}
              <div className="hidden lg:flex items-center justify-center gap-6 mt-4 text-white/30 text-sm">
                <span>
                  {isEn ? "← → Switch steps" : "← → 切换步骤"}
                </span>
                <span>
                  {isEn ? "Space Pause/Resume timer" : "空格 暂停/继续计时"}
                </span>
                <span>{isEn ? "R Read" : "R 朗读"}</span>
                <span>{isEn ? "ESC Exit" : "ESC 退出"}</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
