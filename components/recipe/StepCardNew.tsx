/**
 * StepCardNew 缁勪欢
 *
 * 瀹屽叏澶嶅埢璁捐绋跨殑姝ラ鍗＄墖鏍峰紡锛? * - 宸︿晶锛氭楠ゅ浘鐗? * - 鍙充晶锛氭楠ょ紪鍙枫€佹爣棰樸€佹搷浣滄弿杩般€佺姸鎬佹鏌ャ€佸け璐ョ偣銆佽鏃舵爣绛? */

"use client";

import type { RecipeStep } from "@/types/recipe";
import { StepImage } from "@/components/ui/SafeImage";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslations } from "@/lib/i18n/translations";

interface StepCardNewProps {
  step: RecipeStep;
  stepNumber: number;
  imageUrl?: string;
}

export function StepCardNew({ step, stepNumber, imageUrl }: StepCardNewProps) {
  const { t, locale } = useTranslations();
  // Format timer label.
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return t("recipe.timeMinutes", locale).replace("{count}", mins.toString());
  };
  const splitRegex = /\n+/;
  const linePunct = t("common.sentencePunct", locale);
  const formatLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    const hasPunct = /[銆?!?]$/.test(trimmed);
    return hasPunct ? trimmed : `${trimmed}${linePunct}`;
  };
  const statusLabel = t("recipe.checkLabel", locale);
  const failLabel = t("recipe.pitfallLabel", locale);

  return (
    <div className="flex gap-4 bg-white rounded-2xl shadow-sm border border-lightGray p-4 hover:shadow-md transition-shadow">
      {/* 宸︿晶锛氭楠ゅ浘鐗?*/}
      <div className="w-[140px] h-[105px] flex-shrink-0 rounded-xl overflow-hidden bg-lightGray">
        <StepImage src={imageUrl} alt={step.title} />
      </div>

      {/* 鍙充晶锛氭楠ゅ唴瀹?*/}
      <div className="flex-1 min-w-0">
        {/* 姝ラ缂栧彿 + 鏍囬 + 璁℃椂鏍囩 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-orangeAccent font-bold text-sm tracking-wider">
              STEP {stepNumber.toString().padStart(2, "0")}
            </span>
            <h4 className="text-base font-medium text-textDark">{step.title}</h4>
          </div>
          {/* 璁℃椂鏍囩 */}
          {(step.timerSec ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-textGray bg-lightGray px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {formatTimer(step.timerSec ?? 0)}
            </div>
          )}
        </div>

        {/* 鎿嶄綔鎻忚堪 */}
        <div className="text-sm text-textGray leading-relaxed mb-3">
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

        {/* 鐘舵€佹鏌?*/}
        {step.visualCue && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="text-green-700 font-medium">{statusLabel}</span>
              <span className="text-green-800">{step.visualCue}</span>
            </div>
          </div>
        )}

        {/* 澶辫触鐐?*/}
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
