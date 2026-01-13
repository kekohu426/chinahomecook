/**
 * StepCardNew 组件
 *
 * 完全复刻设计稿的步骤卡片样式：
 * - 左侧：步骤图片
 * - 右侧：步骤编号、标题、操作描述、状态检查、失败点、计时标签
 */

"use client";

import type { RecipeStep } from "@/types/recipe";
import { StepImage } from "@/components/ui/SafeImage";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface StepCardNewProps {
  step: RecipeStep;
  stepNumber: number;
  imageUrl?: string;
}

export function StepCardNew({ step, stepNumber, imageUrl }: StepCardNewProps) {
  const locale = useLocale();
  // 格式化计时显示
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return locale === "en" ? `${mins} min` : `${mins}分钟`;
  };
  const splitRegex = /\n+/;
  const linePunct = locale === "en" ? "." : "。";
  const formatLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    const hasPunct = /[。.!?]$/.test(trimmed);
    return hasPunct ? trimmed : `${trimmed}${linePunct}`;
  };
  const statusLabel = locale === "en" ? "Check:" : "状态检查：";
  const failLabel = locale === "en" ? "Pitfall:" : "失败点：";

  return (
    <div className="flex gap-4 bg-white rounded-2xl shadow-sm border border-stone-100 p-4 hover:shadow-md transition-shadow">
      {/* 左侧：步骤图片 */}
      <div className="w-[140px] h-[105px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
        <StepImage src={imageUrl} alt={step.title} />
      </div>

      {/* 右侧：步骤内容 */}
      <div className="flex-1 min-w-0">
        {/* 步骤编号 + 标题 + 计时标签 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-[#E86F2C] font-bold text-sm tracking-wider">
              STEP {stepNumber.toString().padStart(2, "0")}
            </span>
            <h4 className="text-base font-medium text-stone-800">{step.title}</h4>
          </div>
          {/* 计时标签 */}
          {(step.timerSec ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {formatTimer(step.timerSec ?? 0)}
            </div>
          )}
        </div>

        {/* 操作描述 */}
        <div className="text-sm text-stone-600 leading-relaxed mb-3">
          {(step.action.includes("\n")
            ? step.action.split(splitRegex)
            : [step.action]
          )
            .filter(Boolean)
            .map((line, idx) => (
              <p key={idx} className="mb-1">
                {formatLine(line)}
              </p>
            ))}
        </div>

        {/* 状态检查 */}
        {step.visualCue && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="text-green-700 font-medium">{statusLabel}</span>
              <span className="text-green-800">{step.visualCue}</span>
            </div>
          </div>
        )}

        {/* 失败点 */}
        {step.failPoint && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="text-amber-700 font-medium">{failLabel}</span>
              <span className="text-amber-800">{step.failPoint}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
