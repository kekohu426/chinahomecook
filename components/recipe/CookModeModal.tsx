/**
 * CookModeModal 缁勪欢
 *
 * 瀹屽叏澶嶅埢璁捐绋跨殑鐑归オ妯″紡寮圭獥锛? * - 灞呬腑鐧借壊鍗＄墖寮圭獥
 * - 鑳屾櫙妯＄硦
 * - 姝ラ鍥剧墖銆佹爣棰樸€佹弿杩般€佽鏃跺櫒銆佺姸鎬佹鏌ャ€佸け璐ョ偣
 * - 搴曢儴瀵艰埅锛氫笂涓€姝ャ€佹楠ゆ寚绀虹偣銆佷笅涓€姝?瀹屾垚鐑归オ
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
import { t } from "@/lib/i18n/translations";
import { getSpeechLocale } from "@/lib/i18n/format";

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

  // Timer state.
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentStep = steps[currentIndex];
  const totalSteps = steps.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalSteps - 1;
  const isLastStep = currentIndex === totalSteps - 1;

  // 鑾峰彇褰撳墠姝ラ鍥剧墖
  const currentImage = currentStep ? stepImages?.[currentStep.id] : undefined;

  // Clear timer.
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset state when closing modal.
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

  // 鍒囨崲姝ラ鏃堕噸缃鏃跺櫒
  useEffect(() => {
    setTimerState("idle");
    setTimeLeft(0);
    clearTimer();
  }, [currentIndex, clearTimer]);

  // 璁℃椂鍣ㄩ€昏緫
  useEffect(() => {
    if (timerState === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setTimerState("idle");
            // 璁℃椂缁撴潫鎻愮ず
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

  // Start timer.
  const startTimer = () => {
    const timerSec = currentStep?.timerSec ?? 0;
    if (!currentStep || timerSec <= 0) return;
    if (timerState === "idle") {
      setTimeLeft(timerSec);
    }
    setTimerState("running");
  };

  // 鏆傚仠璁℃椂
  const pauseTimer = () => {
    clearTimer();
    setTimerState("paused");
  };

  // 閲嶇疆璁℃椂
  const resetTimer = () => {
    clearTimer();
    setTimerState("idle");
    setTimeLeft(0);
  };

  // Format duration.
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 璇煶鏈楄
  const speakStep = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = currentStep?.speechText || currentStep?.action || "";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLocale(locale);
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const requestClose = useCallback(() => {
    const shouldConfirm = timerState === "running" || currentIndex > 0;
    if (shouldConfirm) {
      const message = t("recipe.exitConfirm", locale);
      if (!confirm(message)) return;
    }
    onClose();
  }, [timerState, currentIndex, locale, onClose]);

  // 瀵艰埅鍑芥暟
  const goToPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((prev) => prev - 1);
  }, [hasPrev]);

  const goToNext = useCallback(() => {
    if (hasNext) setCurrentIndex((prev) => prev + 1);
  }, [hasNext]);

  // Keyboard shortcuts.
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

  // 閿佸畾鑳屾櫙婊氬姩
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
      {/* 鑳屾櫙閬僵 + 妯＄硦 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={requestClose}
      />

      {/* 寮圭獥鍗＄墖 - 瀹藉睆鏄剧ず */}
      <div
        className="relative w-full max-w-[900px] mx-4 bg-cream rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cook-mode-title"
      >
        {/* 椤堕儴鏍?*/}
        <div className="sticky top-0 z-10 bg-cream px-8 py-4 flex items-center justify-between border-b border-lightGray">
          <h3 id="cook-mode-title" className="text-lg font-medium text-textDark">
            {recipeTitle}
          </h3>
          <div className="flex items-center gap-6">
            <span className="text-sm text-textGray">
              {`${t("recipe.stepOf", locale)} ${currentIndex + 1}/${totalSteps}`}
            </span>
            <button
              ref={closeButtonRef}
              onClick={requestClose}
              className="flex items-center gap-1 text-sm text-textGray hover:text-textDark transition-colors"
            >
              <X className="w-4 h-4" />
              {t("recipe.exit", locale)}
            </button>
          </div>
        </div>

        {/* 鍐呭鍖哄煙 */}
        <div className="p-8">
          {/* 姝ラ鍥剧墖 - 瀹藉睆姣斾緥 */}
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-lightGray mb-6">
            <StepImage src={currentImage} alt={currentStep.title} />
          </div>

          {/* 姝ラ鏍囬锛堟鑹茶彵褰?+ 鏍囬锛?*/}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-orangeAccent text-xl">◆</span>
            <h4 className="text-xl font-medium text-textDark">{currentStep.title}</h4>
          </div>

          {/* 姝ラ鎻忚堪 */}
          <p className="text-base text-textGray leading-relaxed mb-5">
            {currentStep.action}
          </p>

          {/* 璁℃椂鍣紙濡傛灉鏈夛級 */}
          {(currentStep.timerSec ?? 0) > 0 && (
            <div className="bg-white border border-lightGray rounded-2xl p-5 mb-5">
              {/* 璁℃椂鍣ㄦ樉绀?*/}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className={cn(
                    "text-5xl font-light tracking-wider",
                    timerState === "running" ? "text-orangeAccent" : "text-textDark"
                  )}
                >
                  {timerState === "idle"
                    ? formatTime(currentStep.timerSec ?? 0)
                    : formatTime(timeLeft)}
                </span>
                <span className="text-textGray/70 text-2xl">⏱</span>
              </div>

              {/* 璁℃椂鍣ㄦ寜閽?*/}
              <div className="flex items-center justify-center gap-3">
                {/* 寮€濮嬫寜閽?*/}
                <button
                  onClick={startTimer}
                  disabled={timerState === "running"}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors",
                    timerState === "running"
                      ? "bg-lightGray text-textGray/70 cursor-not-allowed"
                      : "bg-brownWarm hover:bg-brownDark text-white"
                  )}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t("recipe.start", locale)}
                </button>

                {/* 鏆傚仠鎸夐挳 */}
                <button
                  onClick={pauseTimer}
                  disabled={timerState !== "running"}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors",
                    timerState === "running"
                      ? "bg-lightGray hover:bg-lightGray text-textDark"
                      : "bg-cream/70 text-textGray/50 cursor-not-allowed"
                  )}
                >
                  <Pause className="w-4 h-4" />
                  {t("recipe.pause", locale)}
                </button>

                {/* 閲嶇疆鎸夐挳 */}
                <button
                  onClick={resetTimer}
                  className="flex items-center gap-2 px-5 py-2 bg-lightGray hover:bg-lightGray text-textDark rounded-full text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("recipe.reset", locale)}
                </button>
              </div>
            </div>
          )}

          {/* 瀹屾垚鏍囧噯 */}
          {currentStep.visualCue && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-green-700 font-medium">
                  {t("recipe.doneWhenLabel", locale)}
                </span>
                <span className="text-green-800">{currentStep.visualCue}</span>
              </div>
            </div>
          )}

          {/* 澶辫触鐐?*/}
          {currentStep.failPoint && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-amber-700 font-medium">
                  {t("recipe.pitfallLabel", locale)}
                </span>
                <span className="text-amber-800">{currentStep.failPoint}</span>
              </div>
            </div>
          )}

          {/* 鏈楄鎸夐挳 */}
          <button
            onClick={speakStep}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-lightGray rounded-xl text-textGray hover:bg-cream/70 transition-colors mb-6"
          >
            <Volume2 className="w-4 h-4" />
            <span>
              {t("recipe.readStepKey", locale)}
            </span>
          </button>

          {/* 搴曢儴瀵艰埅 */}
          <div className="flex items-center justify-between">
            {/* 涓婁竴姝?*/}
            <button
              onClick={goToPrev}
              disabled={!hasPrev}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors",
                hasPrev
                  ? "bg-white border border-lightGray text-textDark hover:bg-cream/70"
                  : "bg-cream/70 text-textGray/50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {t("recipe.previous", locale)}
            </button>

            {/* 姝ラ鎸囩ず鍣?*/}
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    idx === currentIndex
                      ? "bg-brownWarm"
                      : idx < currentIndex
                      ? "bg-brownWarm/50"
                      : "bg-lightGray"
                  )}
                  aria-label={t("recipe.jumpToStep", locale).replace("{step}", String(idx + 1))}
                />
              ))}
            </div>

            {/* 涓嬩竴姝?/ 瀹屾垚鐑归オ */}
            {isLastStep ? (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                {t("recipe.finishCooking", locale)}
              </button>
            ) : (
              <button
                onClick={goToNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-brownWarm hover:bg-brownDark text-white rounded-full text-sm font-medium transition-colors"
              >
                {t("recipe.next", locale)}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
