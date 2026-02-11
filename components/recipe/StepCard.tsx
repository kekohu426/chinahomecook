/**
 * StepCard 组件
 *
 * 制作步骤卡片：步骤编号、标题、操作描述、视觉提示、失败点、计时器
 * 支持复制和下载步骤内容
 *
 * 🚨 设计约束：100%还原设计稿，PRD Schema v1.1.0
 * 参考：docs/UI_DESIGN.md - 制作步骤卡片
 */

"use client";

import { useState } from "react";
import type { RecipeStep } from "@/types/recipe";
import { cn } from "@/lib/utils";
import { copyStepContent, downloadStepImage } from "@/lib/recipe-utils";
import { StepImage } from "@/components/ui/SafeImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTranslations } from "@/lib/i18n/translations";

interface StepCardProps {
  step: RecipeStep;
  stepNumber: number; // 显示的步骤编号（从1开始）
  imageUrl?: string; // 步骤配图 URL
}

export function StepCard({ step, stepNumber, imageUrl }: StepCardProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const { t } = useTranslations();
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(step.timerSec);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 步骤卡片的唯一 ID
  const cardId = `step-card-${stepNumber}`;

  // 启动计时器
  const startTimer = () => {
    const timerSec = step.timerSec ?? 0;
    if (timerSec <= 0) return;

    setTimerActive(true);
    setTimeLeft(timerSec);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if ((prev ?? 0) <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          // 计时器结束提示（可添加音效）
          if (typeof window !== "undefined" && "Notification" in window) {
            try {
              new Notification(t("recipeDetail.timerFinished"), {
                body: `${step.title} ${t("status.success")}`,
              });
            } catch (e) {
              // Notification API may not be available
            }
          }
          return 0;
        }
        return (prev ?? 0) - 1;
      });
    }, 1000);
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 复制步骤卡片图片
  const handleCopy = async () => {
    setCopying(true);
    const success = await copyStepContent(cardId, stepNumber, step.title);
    if (!success) {
      alert(t("status.copyFailed"));
    }
    setTimeout(() => setCopying(false), 2000);
  };

  // 下载步骤图片
  const handleDownload = async () => {
    setDownloading(true);
    const success = await downloadStepImage(cardId, stepNumber, step.title);
    if (!success) {
      alert(t("status.downloadFailed"));
    }
    setDownloading(false);
  };

  return (
    <div id={cardId} className="bg-white rounded-[18px] shadow-card border border-cream p-6 mb-6">
      {/* 步骤编号 + 标题 + 操作按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="bg-brownWarm text-white text-xs font-semibold px-3 py-1 rounded-button tracking-wider shadow-sm">
            STEP {stepNumber.toString().padStart(2, "0")}
          </span>
          <h3 className="text-title-md font-serif font-medium text-textDark">
            {step.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            disabled={copying}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-brownDark border border-brownWarm/30 rounded-button hover:bg-brownWarm/5 transition-colors disabled:opacity-50"
          >
            <span>{copying ? "✓" : "📋"}</span>
            <span>
              {copying ? t("status.copied") : t("recipeDetail.copy")}
            </span>
          </button>
          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-brownDark border border-brownWarm/30 rounded-button hover:bg-brownWarm/5 transition-colors disabled:opacity-50"
          >
            <span>{downloading ? "⏳" : "📥"}</span>
            <span>
              {downloading
                ? t("status.loading")
                : t("common.save")}
            </span>
          </button>
          {/* 计时标签 */}
          {(step.timerSec ?? 0) > 0 && (
            <span className="text-xs font-semibold text-orangeAccent bg-orangeAccent/10 px-3 py-1 rounded-full ml-1">
              {t("recipe.timer")} {Math.floor((step.timerSec ?? 0) / 60)}{" "}
              {t("recipe.minutes")}
            </span>
          )}
        </div>
      </div>

      {/* 步骤配图 - 使用 SafeImage 支持加载失败回退 */}
      <div className="relative w-full overflow-hidden rounded-image mb-5">
        <div className="aspect-[4/3] bg-lightGray">
          <StepImage src={imageUrl} alt={step.title} />
        </div>
      </div>

      {/* 步骤操作描述 */}
      <p className="text-base text-textDark leading-relaxed mb-4">
        {step.action}
      </p>

      {/* 视觉状态检查 */}
      {step.visualCue && (
        <div className="bg-orangeAccent/8 border border-orangeAccent/30 px-4 py-3 mb-4 rounded-md shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">✍️</span>
            <div>
              <span className="text-sm font-semibold text-brownDark">
                {t("recipe.checkLabel")}
              </span>
              <span className="text-sm text-textDark ml-1">{step.visualCue}</span>
            </div>
          </div>
        </div>
      )}

      {/* 失败点提示 */}
      {step.failPoint && (
        <div className="bg-cream border border-red-200 px-4 py-3 mb-4 rounded-md">
          <div className="flex items-start gap-2 text-red-700">
            <span className="text-lg">⚠️</span>
            <div className="text-sm leading-relaxed">
              <span className="font-semibold">
                {t("recipe.pitfallLabel")}
              </span>
              <span className="text-textDark ml-1">{step.failPoint}</span>
            </div>
          </div>
        </div>
      )}

      {/* 语音朗读文本（隐藏字段，用于 COOK NOW 模式）*/}
      {/* speechText 在全屏模式中使用，这里不显示 */}

      {/* 计时器 */}
      {(step.timerSec ?? 0) > 0 && (
        <button
          onClick={startTimer}
          disabled={timerActive}
          className={cn(
            "w-full py-3 px-4 rounded-button font-medium transition-all",
            timerActive
              ? "bg-orangeAccent text-white border-2 border-orangeAccent"
              : "bg-white text-brownDark border-2 border-brownWarm hover:bg-brownWarm/5"
          )}
        >
          <span className="mr-2">{timerActive ? "⏰" : "⏱️"}</span>
          {timerActive ? (
            <>
              {t("recipe.timerRunning")} - {formatTime(timeLeft ?? 0)}
            </>
          ) : (
            <>
              {t("recipe.startTimer")} (
              {Math.floor((step.timerSec ?? 0) / 60)}
              {t("recipe.min")})
            </>
          )}
        </button>
      )}
    </div>
  );
}
