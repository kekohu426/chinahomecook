/**
 * RecipeHeader 组件
 *
 * 食谱详情页头部：大图 + 标题 + 治愈文案 + 信息卡片
 *
 * 🚨 设计约束：100%还原设计稿，PRD Schema v1.1.0
 * 参考：docs/UI_DESIGN.md - 头部大图区
 */

"use client";

import type { Recipe } from "@/types/recipe";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";
import { CoverImage } from "@/components/ui/SafeImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish } from "@/lib/i18n/english";

interface RecipeHeaderProps {
  recipe: Recipe;
  coverImage?: string | null;
}

export function RecipeHeader({ recipe, coverImage }: RecipeHeaderProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const { titleZh, titleEn, summary } = recipe;
  const heroImage = coverImage && coverImage.trim().length > 0 ? coverImage : null;
  const caloriesLabel = (summary as any)?.calories;
  const difficultyLabel = isEn
    ? summary.difficulty === "easy"
      ? t("recipe.easy", locale)
      : summary.difficulty === "medium"
      ? t("recipe.medium", locale)
      : summary.difficulty === "hard"
      ? t("recipe.hard", locale)
      : summary.difficulty
    : DIFFICULTY_TO_LABEL[summary.difficulty];
  const displayTitle = isEn
    ? ensureEnglish(titleEn || titleZh, "Untitled Recipe")
    : titleZh;
  const badgeTitle = isEn ? null : titleEn;
  const displayOneLine = isEn
    ? ensureEnglish(summary.oneLine, t("common.englishComingSoon", locale))
    : summary.oneLine;
  const displayHealingTone = isEn
    ? ensureEnglish(summary.healingTone, "")
    : summary.healingTone;
  const caloriesText = caloriesLabel
    ? `${caloriesLabel}${typeof caloriesLabel === "number" ? " kcal" : ""}`
    : "~450 kcal";

  return (
    <div className="w-full bg-cream">
      {/* 头部大图区 */}
      <div className="relative w-full h-[520px] overflow-hidden">
        {/* 背景图片 - 使用 SafeImage 支持加载失败回退 */}
        <div className="absolute inset-0">
          {heroImage ? (
            <CoverImage src={heroImage} alt={titleZh} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brownWarm/30 via-orangeAccent/20 to-cream/60" />
          )}
        </div>

        {/* 底部深色渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

        {/* 文字内容叠加 */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <div className="max-w-7xl mx-auto">
            {/* 英文标签 */}
            {badgeTitle && badgeTitle !== displayTitle && (
              <div className="inline-flex items-center px-3 py-1 bg-brownWarm/90 text-cream text-xs font-semibold tracking-[0.18em] uppercase rounded-full mb-4 shadow-card">
                {badgeTitle}
              </div>
            )}

            {/* 大标题 */}
            <h1 className="editorial-hero-title text-white mb-4 drop-shadow-lg">
              {displayTitle}
            </h1>

            {/* 一句话描述 */}
            <div className="flex items-start gap-3 max-w-2xl mb-3">
              <div className="w-1.5 h-14 bg-orangeAccent rounded-full flex-shrink-0 mt-1" />
              <p className="editorial-hero-subtitle italic">
                {displayOneLine}
              </p>
            </div>

            {/* 治愈文案 */}
            {displayHealingTone ? (
              <p className="editorial-hero-body italic max-w-2xl ml-4">
                {displayHealingTone}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 信息卡片 */}
      <div className="max-w-7xl mx-auto px-12 -mt-8">
        <div className="grid grid-cols-3 gap-6">
          {/* 难度卡片 */}
          <div className="bg-white rounded-[18px] shadow-card border border-cream p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-2xl mx-auto mb-3">
              🔥
            </div>
            <div className="text-textGray text-sm mb-1">
              {t("recipe.difficultyLabel", locale)}
            </div>
            <div className="text-textDark text-lg font-semibold">
              {difficultyLabel}
            </div>
          </div>

          {/* 总耗时卡片 */}
          <div className="bg-white rounded-[18px] shadow-card border border-cream p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-2xl mx-auto mb-3">
              ⏱️
            </div>
            <div className="text-textGray text-sm mb-1">
              {t("recipe.totalTime", locale)}
            </div>
            <div className="text-textDark text-lg font-semibold">
              {summary.timeTotalMin}
              {t("recipe.min", locale)}
            </div>
            <div className="text-textGray text-xs mt-1">
              {t("recipe.activeTime", locale)} {summary.timeActiveMin}
              {t("recipe.min", locale)}
            </div>
          </div>

          {/* 份量卡片 */}
          <div className="bg-white rounded-[18px] shadow-card border border-cream p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-2xl mx-auto mb-3">
              🍽️
            </div>
            <div className="text-textGray text-sm mb-1">
              {t("recipe.calories", locale)}
            </div>
            <div className="text-textDark text-lg font-semibold">
              {caloriesText}
            </div>
            <div className="text-textGray text-xs mt-1">
              {t("recipe.estimated", locale)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
