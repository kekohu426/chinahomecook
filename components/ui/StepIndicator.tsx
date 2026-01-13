/**
 * 版本3 统一步骤指示器组件
 *
 * 用于有流程的页面（AI定制、注册、支付等）
 * 采用圆圈数字样式
 */

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  /** 步骤标题 */
  title: string;
  /** 步骤描述（可选） */
  description?: string;
}

export interface StepIndicatorProps {
  /** 步骤列表 */
  steps: Step[];
  /** 当前步骤（从0开始） */
  currentStep: number;
  /** 方向 */
  orientation?: "horizontal" | "vertical";
  /** 大小 */
  size?: "sm" | "md" | "lg";
  /** 额外类名 */
  className?: string;
}

const SIZES = {
  sm: {
    circle: "w-8 h-8 text-sm",
    text: "text-sm",
    line: "h-0.5",
    verticalLine: "w-0.5 h-8",
  },
  md: {
    circle: "w-10 h-10 text-base",
    text: "text-base",
    line: "h-1",
    verticalLine: "w-1 h-12",
  },
  lg: {
    circle: "w-12 h-12 text-lg",
    text: "text-lg",
    line: "h-1",
    verticalLine: "w-1 h-16",
  },
};

export function StepIndicator({
  steps,
  currentStep,
  orientation = "horizontal",
  size = "md",
  className,
}: StepIndicatorProps) {
  const sizeConfig = SIZES[size];

  if (orientation === "vertical") {
    return (
      <div className={cn("flex flex-col", className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex">
              {/* 左侧：圆圈和连接线 */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center font-medium transition-all",
                    sizeConfig.circle,
                    isCompleted
                      ? "bg-brownWarm text-white"
                      : isCurrent
                      ? "bg-brownWarm text-white ring-4 ring-brownWarm/20"
                      : "bg-cream text-textGray border-2 border-cream"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      sizeConfig.verticalLine,
                      isCompleted ? "bg-brownWarm" : "bg-cream"
                    )}
                  />
                )}
              </div>

              {/* 右侧：文字 */}
              <div className="pb-8">
                <p
                  className={cn(
                    "font-medium",
                    sizeConfig.text,
                    isCurrent ? "text-textDark" : isCompleted ? "text-brownWarm" : "text-textGray"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-sm text-textGray mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 水平布局
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex items-center">
            {/* 步骤圆圈 */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "rounded-full flex items-center justify-center font-medium transition-all",
                  sizeConfig.circle,
                  isCompleted
                    ? "bg-brownWarm text-white"
                    : isCurrent
                    ? "bg-brownWarm text-white ring-4 ring-brownWarm/20"
                    : "bg-cream text-textGray border-2 border-cream"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <p
                className={cn(
                  "mt-2 font-medium text-center whitespace-nowrap",
                  sizeConfig.text,
                  isCurrent ? "text-textDark" : isCompleted ? "text-brownWarm" : "text-textGray"
                )}
              >
                {step.title}
              </p>
            </div>

            {/* 连接线 */}
            {!isLast && (
              <div
                className={cn(
                  "flex-1 mx-4 min-w-[40px]",
                  sizeConfig.line,
                  isCompleted ? "bg-brownWarm" : "bg-cream"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
