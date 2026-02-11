/**
 * RecipeCard 组件
 *
 * 首页瀑布流食谱卡片
 */

"use client";

import Link from "next/link";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish, toEnglishLabel } from "@/lib/i18n/english";
import { CUISINE_LABELS_EN, LOCATION_LABELS_EN } from "@/lib/i18n/labels";

interface RecipeCardProps {
  id: string;
  slug?: string | null;
  href?: string | null;
  disableLocalization?: boolean;
  className?: string;
  titleZh: string;
  titleEn?: string | null;
  title?: string;
  summary?: {
    oneLine?: string;
    healingTone?: string;
    timeTotalMin?: number;
    difficulty?: string;
    servings?: number;
  } | null;
  location?: string | null;
  cuisine?: string | null;
  aiGenerated?: boolean | null;
  coverImage?: string | null;
  aspectClass?: string;
}

export function RecipeCard({
  id,
  slug,
  href,
  disableLocalization,
  className,
  titleZh,
  titleEn,
  title,
  summary,
  location,
  cuisine,
  aiGenerated,
  coverImage,
  aspectClass,
}: RecipeCardProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const displayTitle = isEn
    ? ensureEnglish(title ?? titleEn ?? titleZh, "Untitled Recipe")
    : title ?? titleZh;

  // 使用翻译系统获取难度标签
  const getDifficultyLabel = (value?: string) => {
    if (!value) return t("recipe.easy", locale);
    if (value === "easy" || value === "简单") return t("recipe.easy", locale);
    if (value === "medium" || value === "中等") return t("recipe.medium", locale);
    if (value === "hard" || value === "困难") return t("recipe.hard", locale);
    return value;
  };
  const difficultyLabel = getDifficultyLabel(summary?.difficulty);

  // 翻译地点和菜系
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
  // 优先使用 slug，否则使用 id
  const recipeUrl = href || (slug ? `/recipe/${slug}` : `/recipe/${id}`);
  const linkClassName = cn("group mb-8 block break-inside-avoid", className);

  const content = (
      <div className="bg-white rounded-md shadow-card overflow-hidden hover:shadow-lg transition-shadow">
        {/* 食谱图片 */}
        <div className={cn("relative w-full overflow-hidden", aspectClass)}>
          {coverImage ? (
            <Image
              src={coverImage}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              priority={false}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brownWarm/20 to-orangeAccent/20 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
        </div>

        {/* 食谱信息 */}
        <div className="p-6">
          <h3 className="text-xl font-serif font-medium text-textDark mb-2 group-hover:text-brownWarm transition-colors">
            {displayTitle}
          </h3>
          {/* 一句话描述 */}
          <p className="text-sm text-textGray mb-4">
    {(() => {
      const tagline = isEn
        ? ensureEnglish(
            summary?.oneLine || summary?.healingTone || titleEn,
            ""
          )
        : summary?.oneLine || summary?.healingTone || titleEn;
      return tagline || null;
    })()}
          </p>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-xs text-textGray mb-4">
            <span>
              ⏱️ {summary?.timeTotalMin || 45} {t("recipe.min", locale)}
            </span>
            <span>🔥 {difficultyLabel}</span>
            <span>
              👥 {summary?.servings || 3} {t("recipe.servingsUnit", locale)}
            </span>
          </div>

          {/* 地点和菜系标签 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {displayLocation && (
              <span className="px-2 py-1 bg-lightGray text-textDark text-xs rounded-full">
                📍 {displayLocation}
              </span>
            )}
            {displayCuisine && (
              <span className="px-2 py-1 bg-cream text-textDark text-xs rounded-full">
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
  );

  if (disableLocalization) {
    return (
      <Link href={recipeUrl} className={linkClassName}>
        {content}
      </Link>
    );
  }

  return (
    <LocalizedLink href={recipeUrl} className={linkClassName}>
      {content}
    </LocalizedLink>
  );
}
