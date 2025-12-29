/**
 * StepCard 组件
 *
 * 制作步骤卡片：步骤编号、标题、操作描述、视觉提示、失败点、计时器
 *
 * 🚨 设计约束：100%还原设计稿，PRD Schema v1.1.0
 * 参考：docs/UI_DESIGN.md - 制作步骤卡片
 */

"use client";

import { useState } from "react";
import type { RecipeStep } from "@/types/recipe";
import { cn } from "@/lib/utils";

interface StepCardProps {
  step: RecipeStep;
  stepNumber: number; // 显示的步骤编号（从1开始）
  imageUrl?: string; // 步骤配图 URL
}

export function StepCard({ step, stepNumber, imageUrl }: StepCardProps) {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(step.timerSec);

  // 启动计时器
  const startTimer = () => {
    if (step.timerSec === 0) return;

    setTimerActive(true);
    setTimeLeft(step.timerSec);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          // 计时器结束提示（可添加音效）
          if (typeof window !== "undefined" && "Notification" in window) {
            try {
              new Notification("计时器结束", {
                body: `${step.title} 完成！`,
              });
            } catch (e) {
              // Notification API may not be available
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-md shadow-card p-6 mb-6">
      {/* 步骤编号标签 */}
      <div className="inline-block bg-brownWarm text-white text-xs font-medium px-3 py-1 rounded-button mb-4">
        STEP {stepNumber.toString().padStart(2, "0")}
      </div>

      {/* 步骤配图 */}
      <div className="relative w-full h-56 rounded-image overflow-hidden mb-5 bg-lightGray">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={step.title}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream/70 to-orangeAccent/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-2xl mb-2">📸</div>
                <p className="text-sm text-textGray">步骤配图（待生成）</p>
              </div>
            </div>
          </>
        )}
        {step.photoBrief && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/80 backdrop-blur-sm rounded-sm px-3 py-2">
            <span className="text-xs font-medium text-textDark">配图提示：</span>
            <span className="text-xs text-textGray ml-1">{step.photoBrief}</span>
          </div>
        )}
      </div>

      {/* 步骤标题 */}
      <h3 className="text-title-md font-serif font-medium text-textDark mb-4">
        {step.title}
      </h3>

      {/* 步骤操作描述 */}
      <p className="text-base text-textDark leading-relaxed mb-4">
        {step.action}
      </p>

      {/* 视觉状态检查 */}
      {step.visualCue && (
        <div className="bg-orangeAccent/10 border-l-4 border-orangeAccent px-4 py-3 mb-4 rounded-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">👀</span>
            <div>
              <span className="text-sm font-medium text-brownDark">视觉检查：</span>
              <span className="text-sm text-textDark ml-1">{step.visualCue}</span>
            </div>
          </div>
        </div>
      )}

      {/* 失败点提示 */}
      {step.failPoint && (
        <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 mb-4 rounded-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="text-sm font-medium text-red-700">失败点：</span>
              <span className="text-sm text-textDark ml-1">{step.failPoint}</span>
            </div>
          </div>
        </div>
      )}

      {/* 语音朗读文本（隐藏字段，用于 COOK NOW 模式）*/}
      {/* speechText 在全屏模式中使用，这里不显示 */}

      {/* 计时器 */}
      {step.timerSec > 0 && (
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
            <>计时运行中 - {formatTime(timeLeft)}</>
          ) : (
            <>开启计时器 ({Math.floor(step.timerSec / 60)}分钟)</>
          )}
        </button>
      )}
    </div>
  );
}
