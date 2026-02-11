/**
 * IngredientSidebar 组件
 *
 * 食材清单侧边栏：固定在左侧，支持份量切换
 *
 * 🚨 设计约束：100%还原设计稿，PRD Schema v1.1.0
 * 参考：docs/UI_DESIGN.md - 食材清单侧边栏
 */

"use client";

import { useState } from "react";
import type { Recipe } from "@/types/recipe";
import { cn } from "@/lib/utils";
import { useIngredientIcons } from "@/hooks/use-ingredient-icons";
import { matchIngredientIcon } from "@/lib/ingredient-icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { t } from "@/lib/i18n/translations";

interface IngredientSidebarProps {
  ingredients: Recipe["ingredients"];
  baseServings?: number; // 基准份量（从 summary.servings 传入）
}

export function IngredientSidebar({
  ingredients,
  baseServings = 3,
}: IngredientSidebarProps) {
  const locale = useLocale();
  // 可选份量（基准份量的倍数）
  const servingOptions = (() => {
    const candidates = [
      Math.max(2, Math.floor(baseServings / 1.5)),
      baseServings,
      baseServings * 2
    ];
    const unique = Array.from(new Set(candidates));
    const fallback = [
      baseServings + 1,
      baseServings - 1,
      baseServings + 2,
      2,
      1
    ];

    for (const value of fallback) {
      if (unique.length >= 3) break;
      if (value > 0 && !unique.includes(value)) {
        unique.push(value);
      }
    }

    return unique.sort((a, b) => a - b);
  })();

  const [servings, setServings] = useState(baseServings);

  // 获取食材图标库
  const { icons } = useIngredientIcons();

  // 计算食材数量（根据份量）
  const calculateAmount = (baseAmount: number): number => {
    const ratio = servings / baseServings;
    return Math.round(baseAmount * ratio * 10) / 10; // 保留一位小数
  };

  const isMainSection = (section: string) =>
    section.includes("主料") || section.toLowerCase().includes("main");

  return (
    <aside className="w-[300px] bg-white rounded-[18px] shadow-card p-6 sticky top-6 h-fit border border-cream">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-serif font-medium text-textDark">
          {t("recipe.ingredients", locale)}
        </h3>
        <span className="text-xs text-textGray bg-lightGray px-3 py-1 rounded-button">
          {t("recipe.ingredients", locale).toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-textGray mb-4">
        {t("recipe.modeEveryday", locale)}
      </p>

      {/* 份量切换（胶囊式按钮组）*/}
      <div className="flex gap-2 mb-6 bg-lightGray rounded-full p-1">
        {servingOptions.map((size) => (
          <button
            key={size}
            onClick={() => setServings(size)}
            className={cn(
              "flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all",
              servings === size
                ? "bg-brownDark text-white shadow-sm"
                : "text-textGray hover:text-textDark"
            )}
          >
            {size} {t("recipe.persons", locale)}
          </button>
        ))}
      </div>

      {/* 食材分组列表 */}
      {ingredients.map((section, sectionIndex) => (
        <div key={sectionIndex} className={sectionIndex > 0 ? "mt-6" : ""}>
          {(() => {
            const isMain = isMainSection(section.section);
            return (
          <h4 className="text-sm font-medium text-textDark mb-3">
            {section.section}{" "}
            <span className="text-xs text-textGray ml-2 uppercase">
              {isMain ? t("recipe.mainIngredients", locale) : t("recipe.extras", locale)}
            </span>
          </h4>
            );
          })()}
          <ul className="space-y-3">
            {section.items.map((item, itemIndex) => {
              const calculatedAmount = calculateAmount(item.amount);

              // 从图标库匹配（无则返回 null）
              const iconUrl = matchIngredientIcon(item.name, icons);

              return (
                <li key={itemIndex} className="flex items-center gap-3">
                  {/* 食材图标（仅使用图标库，无则显示空占位符）*/}
                  {iconUrl ? (
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-lightGray border border-cream">
                      <img
                        src={iconUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-sage-100 border border-sage-200" />
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-textDark">
                      {item.name}
                      {item.notes && (
                        <span className="text-textGray ml-1">({item.notes})</span>
                      )}
                    </span>
                  </div>

                  <span className="text-sm font-medium text-brownWarm">
                    {calculatedAmount}
                    {item.unit}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
