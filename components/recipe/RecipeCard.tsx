/**
 * RecipeCard 组件
 *
 * 首页瀑布流食谱卡片
 */

"use client";

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface RecipeCardProps {
  id: string;
  slug?: string | null;
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
  const displayTitle = title || (locale === "en" && titleEn ? titleEn : titleZh);
  const difficulty = summary?.difficulty || (locale === "en" ? "easy" : "简单");
  const difficultyLabel =
    locale === "en"
      ? difficulty === "easy"
        ? "Easy"
        : difficulty === "medium"
        ? "Medium"
        : difficulty === "hard"
        ? "Hard"
        : difficulty
      : difficulty;
  // 优先使用 slug，否则使用 id
  const recipeUrl = slug ? `/recipe/${slug}` : `/recipe/${id}`;

  return (
    <LocalizedLink
      href={recipeUrl}
      className="group mb-8 block break-inside-avoid"
    >
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
            {summary?.oneLine || summary?.healingTone || titleEn}
          </p>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-xs text-textGray mb-4">
            <span>
              ⏱️ {summary?.timeTotalMin || 45}{" "}
              {locale === "en" ? "min" : "分钟"}
            </span>
            <span>🔥 {difficultyLabel}</span>
            <span>
              👥 {summary?.servings || 3} {locale === "en" ? "servings" : "人份"}
            </span>
          </div>

          {/* 地点和菜系标签 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {location && (
              <span className="px-2 py-1 bg-lightGray text-textDark text-xs rounded-full">
                📍 {location}
              </span>
            )}
            {cuisine && (
              <span className="px-2 py-1 bg-cream text-textDark text-xs rounded-full">
                🍜 {cuisine}
              </span>
            )}
            {aiGenerated && (
              <span className="px-2 py-1 bg-orangeAccent/20 text-brownDark text-xs rounded-full">
                ✨ AI
              </span>
            )}
          </div>
        </div>
      </div>
    </LocalizedLink>
  );
}
