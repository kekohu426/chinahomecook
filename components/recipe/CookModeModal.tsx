/**
 * CookModeModal 组件
 *
 * 完全复刻设计稿的烹饪模式弹窗：
 * - 居中白色卡片弹窗
 * - 背景模糊
 * - 步骤图片、标题、描述、计时器、状态检查、失败点
 * - 底部导航：上一步、步骤指示点、下一步/完成烹饪
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { RecipeStep } from "@/types/recipe";
import { cn } from "@/lib/utils";
import { StepImage } from "@/components/ui/SafeImage";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CookModeModalProps {
  open: boolean;
  onClose: () => void;
  steps: RecipeStep[];
  recipeTitle: string;
  stepImages?: Record<string, string | undefined>;
}

export function CookModeModal({
  open,
  onClose,
  steps,
  recipeTitle,
  stepImages,
}: CookModeModalProps) {
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 计时器状态
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentStep = steps[currentIndex];
  const totalSteps = steps.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalSteps - 1;
  const isLastStep = currentIndex === totalSteps - 1;

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
      setCurrentIndex(0);
      setTimerState("idle");
      setTimeLeft(0);
      clearTimer();
    }
  }, [open, clearTimer]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

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
    utterance.lang = locale === "en" ? "en-US" : "zh-CN";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const requestClose = useCallback(() => {
    const shouldConfirm = timerState === "running" || currentIndex > 0;
    if (shouldConfirm) {
      const message =
        locale === "en"
          ? "Exit cook mode? Your progress will be lost."
          : "退出烹饪模式将丢失进度，确定退出？";
      if (!confirm(message)) return;
    }
    onClose();
  }, [timerState, currentIndex, locale, onClose]);

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
        case " ":
          e.preventDefault();
          if (timerState === "running") {
            pauseTimer();
          } else if (timerState === "paused" || timerState === "idle") {
            startTimer();
          }
          break;
        case "Escape":
          e.preventDefault();
          requestClose();
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
  }, [open, goToPrev, goToNext, timerState, onClose]);

  // 锁定背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 + 模糊 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={requestClose}
      />

      {/* 弹窗卡片 - 宽屏显示 */}
      <div
        className="relative w-full max-w-[900px] mx-4 bg-[#FFFBF7] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cook-mode-title"
      >
        {/* 顶部栏 */}
        <div className="sticky top-0 z-10 bg-[#FFFBF7] px-8 py-4 flex items-center justify-between border-b border-stone-100">
          <h3 id="cook-mode-title" className="text-lg font-medium text-stone-800">
            {recipeTitle}
          </h3>
          <div className="flex items-center gap-6">
            <span className="text-sm text-stone-500">
              {locale === "en"
                ? `Step ${currentIndex + 1}/${totalSteps}`
                : `步骤 ${currentIndex + 1}/${totalSteps}`}
            </span>
            <button
              ref={closeButtonRef}
              onClick={requestClose}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <X className="w-4 h-4" />
              {locale === "en" ? "Exit" : "退出"}
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-8">
          {/* 步骤图片 - 宽屏比例 */}
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-stone-100 mb-6">
            <StepImage src={currentImage} alt={currentStep.title} />
          </div>

          {/* 步骤标题（橙色菱形 + 标题） */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[#E86F2C] text-xl">◆</span>
            <h4 className="text-xl font-medium text-stone-800">{currentStep.title}</h4>
          </div>

          {/* 步骤描述 */}
          <p className="text-base text-stone-600 leading-relaxed mb-5">
            {currentStep.action}
          </p>

          {/* 计时器（如果有） */}
          {(currentStep.timerSec ?? 0) > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-5">
              {/* 计时器显示 */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className={cn(
                    "text-5xl font-light tracking-wider",
                    timerState === "running" ? "text-[#E86F2C]" : "text-stone-800"
                  )}
                >
                  {timerState === "idle"
                    ? formatTime(currentStep.timerSec ?? 0)
                    : formatTime(timeLeft)}
                </span>
                <span className="text-stone-400 text-2xl">⏱</span>
              </div>

              {/* 计时器按钮 */}
              <div className="flex items-center justify-center gap-3">
                {/* 开始按钮 */}
                <button
                  onClick={startTimer}
                  disabled={timerState === "running"}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors",
                    timerState === "running"
                      ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                      : "bg-[#E86F2C] hover:bg-[#D55F1C] text-white"
                  )}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {locale === "en" ? "Start" : "开始"}
                </button>

                {/* 暂停按钮 */}
                <button
                  onClick={pauseTimer}
                  disabled={timerState !== "running"}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors",
                    timerState === "running"
                      ? "bg-stone-100 hover:bg-stone-200 text-stone-700"
                      : "bg-stone-50 text-stone-300 cursor-not-allowed"
                  )}
                >
                  <Pause className="w-4 h-4" />
                  {locale === "en" ? "Pause" : "暂停"}
                </button>

                {/* 重置按钮 */}
                <button
                  onClick={resetTimer}
                  className="flex items-center gap-2 px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {locale === "en" ? "Reset" : "重置"}
                </button>
              </div>
            </div>
          )}

          {/* 完成标准 */}
          {currentStep.visualCue && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-green-700 font-medium">
                  {locale === "en" ? "Done when:" : "完成标准："}
                </span>
                <span className="text-green-800">{currentStep.visualCue}</span>
              </div>
            </div>
          )}

          {/* 失败点 */}
          {currentStep.failPoint && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-amber-700 font-medium">
                  {locale === "en" ? "Pitfall:" : "失败点："}
                </span>
                <span className="text-amber-800">{currentStep.failPoint}</span>
              </div>
            </div>
          )}

          {/* 朗读按钮 */}
          <button
            onClick={speakStep}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors mb-6"
          >
            <Volume2 className="w-4 h-4" />
            <span>
              {locale === "en"
                ? "Read step (press R)"
                : "朗读步骤（按R键）"}
            </span>
          </button>

          {/* 底部导航 */}
          <div className="flex items-center justify-between">
            {/* 上一步 */}
            <button
              onClick={goToPrev}
              disabled={!hasPrev}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors",
                hasPrev
                  ? "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                  : "bg-stone-50 text-stone-300 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {locale === "en" ? "Previous" : "上一步"}
            </button>

            {/* 步骤指示器 */}
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    idx === currentIndex
                      ? "bg-[#E86F2C]"
                      : idx < currentIndex
                      ? "bg-[#E86F2C]/50"
                      : "bg-stone-200"
                  )}
                  aria-label={
                    locale === "en"
                      ? `Jump to step ${idx + 1}`
                      : `跳转到步骤 ${idx + 1}`
                  }
                />
              ))}
            </div>

            {/* 下一步 / 完成烹饪 */}
            {isLastStep ? (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                {locale === "en" ? "Finish cooking" : "完成烹饪"}
              </button>
            ) : (
              <button
                onClick={goToNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E86F2C] hover:bg-[#D55F1C] text-white rounded-full text-sm font-medium transition-colors"
              >
                {locale === "en" ? "Next" : "下一步"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
