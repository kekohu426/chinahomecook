/**
 * CookModeView 组件
 *
 * 全屏"COOK NOW"模式：步骤大图、语音朗读、计时器与导航
 *
 * 🚨 设计约束：100%还原设计稿
 * 参考：docs/UI_DESIGN.md - 全屏模式
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RecipeStep } from "@/types/recipe";
import { cn } from "@/lib/utils";

interface CookModeViewProps {
  steps: RecipeStep[];
  recipeTitle: string;
  triggerClassName?: string;
}

export function CookModeView({
  steps,
  recipeTitle,
  triggerClassName,
}: CookModeViewProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[currentIndex];

  const totalSteps = steps.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalSteps - 1;

  const readableStepNumber = useMemo(
    () => (currentIndex + 1).toString().padStart(2, "0"),
    [currentIndex]
  );

  useEffect(() => {
    if (!open) {
      setTimerActive(false);
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  useEffect(() => {
    setTimerActive(false);
    setTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentIndex]);

  const closeView = () => setOpen(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (!currentStep || currentStep.timerSec <= 0) return;

    setTimerActive(true);
    setTimeLeft(currentStep.timerSec);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const speakStep = () => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      currentStep?.speechText || currentStep?.action || recipeTitle
    );
    utterance.lang = "zh-CN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "bg-brownDark text-white px-8 py-3 rounded-button font-medium hover:bg-brownDark/90 transition-colors flex items-center gap-2",
          triggerClassName
        )}
      >
        <span>▶️</span>
        <span>COOK NOW</span>
      </button>

      {open && currentStep && (
        <div className="fixed inset-0 z-50 bg-fullscreenBg text-fullscreenText">
          <div className="absolute top-6 left-6">
            <button
              type="button"
              onClick={closeView}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center"
              aria-label="退出全屏"
            >
              ✕
            </button>
          </div>

          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-3xl">
              {/* 步骤图片占位 */}
              <div className="w-full h-72 md:h-96 bg-white/10 rounded-image overflow-hidden mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-orangeAccent/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="text-3xl mb-2">📸</div>
                    <p className="text-sm text-white/70">步骤配图（待生成）</p>
                  </div>
                </div>
                {currentStep.photoBrief && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/50 backdrop-blur-sm rounded-sm px-3 py-2">
                    <span className="text-xs font-medium text-white">配图提示：</span>
                    <span className="text-xs text-white/80 ml-1">
                      {currentStep.photoBrief}
                    </span>
                  </div>
                )}
              </div>

              {/* 标题 */}
              <div className="text-center mb-6">
                <div className="text-sm text-white/60 tracking-widest mb-2">
                  STEP {readableStepNumber}
                </div>
                <h2 className="text-[32px] md:text-[36px] font-serif font-medium mb-4">
                  {currentStep.title}
                </h2>
                <p className="text-base md:text-lg text-white/80 leading-relaxed">
                  {currentStep.action}
                </p>
              </div>

              {/* 状态检查 */}
              {currentStep.visualCue && (
                <div className="bg-white/10 border border-white/20 rounded-md px-5 py-4 mb-6">
                  <p className="text-sm text-white/90">
                    状态检查：{currentStep.visualCue}
                  </p>
                </div>
              )}

              {/* 计时器 */}
              {currentStep.timerSec > 0 && (
                <button
                  type="button"
                  onClick={startTimer}
                  disabled={timerActive}
                  className={cn(
                    "w-full py-3 px-4 rounded-button font-medium transition-all",
                    timerActive
                      ? "bg-orangeAccent text-brownDark border-2 border-orangeAccent"
                      : "bg-white/10 text-white border-2 border-white/30 hover:bg-white/20"
                  )}
                >
                  <span className="mr-2">{timerActive ? "⏰" : "⏱️"}</span>
                  {timerActive
                    ? `计时运行中 - ${formatTime(timeLeft)}`
                    : `开启计时器 (${Math.floor(currentStep.timerSec / 60)}分钟)`}
                </button>
              )}

              {/* 语音朗读 */}
              <button
                type="button"
                onClick={speakStep}
                className="mt-4 w-full py-3 px-4 rounded-button border-2 border-white/30 text-white/90 hover:bg-white/10 transition-colors"
              >
                🔊 朗读当前步骤
              </button>
            </div>
          </div>

          {/* 导航 */}
          <div className="absolute inset-x-0 bottom-10 flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => hasPrev && setCurrentIndex((prev) => prev - 1)}
              disabled={!hasPrev}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                hasPrev
                  ? "bg-brownWarm/90 text-white hover:bg-brownWarm"
                  : "bg-white/10 text-white/40"
              )}
              aria-label="上一步"
            >
              ◀️
            </button>

            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "inline-block rounded-full transition-all",
                    idx === currentIndex
                      ? "w-3 h-3 bg-white"
                      : "w-2 h-2 bg-white/40"
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => hasNext && setCurrentIndex((prev) => prev + 1)}
              disabled={!hasNext}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                hasNext
                  ? "bg-brownWarm/90 text-white hover:bg-brownWarm"
                  : "bg-white/10 text-white/40"
              )}
              aria-label="下一步"
            >
              ▶️
            </button>
          </div>
        </div>
      )}
    </>
  );
}
