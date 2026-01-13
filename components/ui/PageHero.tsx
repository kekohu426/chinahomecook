/**
 * 统一内页 Hero 组件（版本3设计语言）
 *
 * 所有内页都采用这种统一结构：
 * - 顶部全宽渐变横幅（温暖棕色渐变）
 * - 面包屑导航
 * - 图标 + H1大标题（48px）
 * - 英文副标题（18px 半透明白）
 * - 一句话说明（16px 半透明白）
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { ChevronRight, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeroProps {
  /** H1 大标题（中文） */
  title: string;
  /** 英文副标题 */
  titleEn?: string;
  /** 一句话说明 */
  description?: string;
  /** 标题图标 */
  icon?: LucideIcon;
  /** 面包屑导航项 */
  breadcrumbs?: BreadcrumbItem[];
  /** 语言 */
  locale?: string;
  /** 额外的内容（如步骤指示器、按钮等） */
  children?: React.ReactNode;
}

export function PageHero({
  title,
  titleEn,
  description,
  icon: Icon,
  breadcrumbs = [],
  locale = "zh",
  children,
}: PageHeroProps) {
  return (
    <div className="bg-gradient-to-br from-brownWarm via-orangeAccent/60 to-cream text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
          <LocalizedLink href="/" className="hover:text-white transition-colors">
            <Home className="w-4 h-4" />
          </LocalizedLink>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              {item.href ? (
                <LocalizedLink
                  href={item.href}
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </LocalizedLink>
              ) : (
                <span className="text-white">{item.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* 标题区 */}
        <div className="flex items-center gap-4 mb-4">
          {Icon && <Icon className="w-12 h-12" />}
          <h1 className="text-4xl md:text-5xl font-serif font-medium">
            {title}
          </h1>
        </div>

        {/* 英文副标题 */}
        {titleEn && (
          <p className="text-white/90 text-lg">
            {titleEn}
          </p>
        )}

        {/* 一句话说明 */}
        {description && (
          <p className="text-white/70 text-sm mt-2">
            {description}
          </p>
        )}

        {/* 额外内容（如步骤指示器） */}
        {children}
      </div>
    </div>
  );
}

/**
 * 步骤指示器组件（用于 Hero 下方）
 */
export interface StepItem {
  key: string;
  label: string;
}

export interface HeroStepIndicatorProps {
  steps: StepItem[];
  currentStep: string;
  completedSteps?: string[];
}

export function HeroStepIndicator({
  steps,
  currentStep,
  completedSteps = [],
}: HeroStepIndicatorProps) {
  const isCompleted = (key: string) => completedSteps.includes(key);
  const isCurrent = (key: string) => currentStep === key;

  return (
    <div className="flex items-center justify-center gap-4 py-8 bg-white border-b border-cream">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isCurrent(step.key)
                ? "bg-brownWarm text-white"
                : isCompleted(step.key)
                ? "bg-sage-500 text-white"
                : "bg-sage-200 text-sage-500"
            }`}
          >
            {isCompleted(step.key) ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <span
            className={`ml-2 text-sm ${
              isCurrent(step.key) ? "text-brownWarm font-medium" : "text-sage-500"
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className="w-12 h-px bg-sage-200 mx-4" />
          )}
        </div>
      ))}
    </div>
  );
}
