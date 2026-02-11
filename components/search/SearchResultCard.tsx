/**
 * SearchResultCard 组件
 *
 * 搜索结果卡片（用于搜索页）
 */

"use client";

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { ChefHat } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ensureEnglish, toEnglishLabel } from "@/lib/i18n/english";
import { CUISINE_LABELS_EN, LOCATION_LABELS_EN } from "@/lib/i18n/labels";
import { t } from "@/lib/i18n/translations";

interface SearchResultCardProps {
  id: string;
  titleZh: string;
  titleEn?: string | null;
  summary?: { oneLine?: string } | null;
  location?: string | null;
  cuisine?: string | null;
  aiGenerated?: boolean | null;
  coverImage?: string | null;
}

export function SearchResultCard({
  id,
  titleZh,
  titleEn,
  summary,
  location,
  cuisine,
  aiGenerated,
  coverImage,
}: SearchResultCardProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const displayTitle = isEn
    ? ensureEnglish(titleEn || titleZh, "Untitled Recipe")
    : titleZh;
  const displayLocation = location
    ? isEn
      ? toEnglishLabel(location, LOCATION_LABELS_EN, "")
      : location
    : null;
  const displayCuisine = cuisine
    ? isEn
      ? toEnglishLabel(cuisine, CUISINE_LABELS_EN, "")
      : cuisine
    : null;
  return (
    <LocalizedLink href={`/recipe/${id}`} className="group block">
      <div className="bg-white rounded-2xl border-2 border-lightGray hover:border-brownWarm/40 transition-all overflow-hidden hover:shadow-lg">
        {/* 封面图占位 */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-cream to-orangeAccent/20 flex items-center justify-center overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={displayTitle}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ChefHat className="w-16 h-16 text-textGray" />
          )}
        </div>

        {/* 内容 */}
        <div className="p-5">
          {/* 标题 */}
          <h3 className="text-xl font-medium text-textDark mb-2 group-hover:text-brownWarm transition-colors">
            {displayTitle}
          </h3>

          {/* 一句话描述 */}
          {summary?.oneLine && (
            <p className="text-sm text-textGray mb-3">
              {isEn ? ensureEnglish(summary.oneLine, "") : summary.oneLine}
            </p>
          )}

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {displayLocation && (
              <span className="px-2 py-1 bg-cream text-textDark text-xs rounded-full">
                📍 {displayLocation}
              </span>
            )}
            {displayCuisine && (
              <span className="px-2 py-1 bg-lightGray text-textDark text-xs rounded-full">
                🍜 {displayCuisine}
              </span>
            )}
            {aiGenerated && (
              <span className="px-2 py-1 bg-orangeAccent/20 text-brownDark text-xs rounded-full">
                ✨ {t("recipe.aiGenerated", locale)}
              </span>
            )}
          </div>
        </div>
      </div>
    </LocalizedLink>
  );
}
