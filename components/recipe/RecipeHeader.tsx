/**
 * RecipeHeader 组件
 *
 * 食谱详情页头部：大图 + 标题 + 治愈文案 + 信息卡片
 *
 * 🚨 设计约束：100%还原设计稿，PRD Schema v1.1.0
 * 参考：docs/UI_DESIGN.md - 头部大图区
 */

import type { Recipe } from "@/types/recipe";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";

interface RecipeHeaderProps {
  recipe: Recipe;
  coverImage?: string | null;
}

export function RecipeHeader({ recipe, coverImage }: RecipeHeaderProps) {
  const { titleZh, titleEn, summary } = recipe;
  const heroImage = coverImage && coverImage.trim().length > 0 ? coverImage : null;

  return (
    <div className="w-full bg-cream">
      {/* 头部大图区 */}
      <div className="relative w-full h-[500px] overflow-hidden">
        {/* 背景图片 */}
        {heroImage ? (
          <img
            src={heroImage}
            alt={titleZh}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brownWarm/30 via-orangeAccent/20 to-cream/60" />
        )}

        {/* 底部深色渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* 文字内容叠加 */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <div className="max-w-7xl mx-auto">
            {/* 英文标签 */}
            {titleEn && (
              <p className="text-cream/90 text-sm font-sans tracking-wider uppercase mb-3">
                {titleEn}
              </p>
            )}

            {/* 大标题 */}
            <h1 className="text-white text-title-lg font-serif font-medium mb-4">
              {titleZh}
            </h1>

            {/* 一句话描述 */}
            <div className="flex items-start gap-3 max-w-2xl mb-3">
              <div className="w-1 h-12 bg-orangeAccent rounded-full flex-shrink-0 mt-1" />
              <p className="text-cream/95 text-lg leading-relaxed font-sans">
                {summary.oneLine}
              </p>
            </div>

            {/* 治愈文案 */}
            <p className="text-cream/80 text-base italic max-w-2xl ml-4">
              {summary.healingTone}
            </p>
          </div>
        </div>
      </div>

      {/* 信息卡片 */}
      <div className="max-w-7xl mx-auto px-12 -mt-8">
        <div className="grid grid-cols-3 gap-6">
          {/* 难度卡片 */}
          <div className="bg-white rounded-md shadow-card p-6 text-center">
            <div className="text-4xl mb-3">🔥</div>
            <div className="text-textGray text-sm mb-2">难度系数</div>
            <div className="text-textDark text-lg font-medium">
              {DIFFICULTY_TO_LABEL[summary.difficulty]}
            </div>
          </div>

          {/* 总耗时卡片 */}
          <div className="bg-white rounded-md shadow-card p-6 text-center">
            <div className="text-4xl mb-3">⏱️</div>
            <div className="text-textGray text-sm mb-2">总耗时</div>
            <div className="text-textDark text-lg font-medium">
              {summary.timeTotalMin}分钟
            </div>
            <div className="text-textGray text-xs mt-1">
              操作时间 {summary.timeActiveMin}分钟
            </div>
          </div>

          {/* 份量卡片 */}
          <div className="bg-white rounded-md shadow-card p-6 text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <div className="text-textGray text-sm mb-2">份量</div>
            <div className="text-textDark text-lg font-medium">
              {summary.servings}人份
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
