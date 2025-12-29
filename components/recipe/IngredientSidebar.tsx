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
import { ICON_KEY_TO_EMOJI, ICON_KEY_TO_BG_COLOR } from "@/types/recipe";
import { cn } from "@/lib/utils";

interface IngredientSidebarProps {
  ingredients: Recipe["ingredients"];
  baseServings?: number; // 基准份量（从 summary.servings 传入）
}

export function IngredientSidebar({
  ingredients,
  baseServings = 3
}: IngredientSidebarProps) {
  // 可选份量（基准份量的倍数）
  const servingOptions = [
    Math.max(2, Math.floor(baseServings / 1.5)),
    baseServings,
    baseServings * 2
  ];

  const [servings, setServings] = useState(baseServings);

  // 计算食材数量（根据份量）
  const calculateAmount = (baseAmount: number): number => {
    const ratio = servings / baseServings;
    return Math.round(baseAmount * ratio * 10) / 10; // 保留一位小数
  };

  return (
    <aside className="w-[300px] bg-white rounded-md shadow-card p-6 sticky top-6 h-fit">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif font-medium text-textDark">食材清单</h3>
        <span className="text-xs text-textGray bg-lightGray px-3 py-1 rounded-button">
          INGREDIENTS
        </span>
      </div>

      {/* 份量切换（胶囊式按钮组）*/}
      <div className="flex gap-2 mb-6 bg-lightGray rounded-button p-1">
        {servingOptions.map((size) => (
          <button
            key={size}
            onClick={() => setServings(size)}
            className={cn(
              "flex-1 py-2 px-3 rounded-sm text-sm font-medium transition-all",
              servings === size
                ? "bg-brownDark text-white shadow-sm"
                : "text-textGray hover:text-textDark"
            )}
          >
            {size}人
          </button>
        ))}
      </div>

      {/* 食材分组列表 */}
      {ingredients.map((section, sectionIndex) => (
        <div key={sectionIndex} className={sectionIndex > 0 ? "mt-6" : ""}>
          <h4 className="text-sm font-medium text-textDark mb-3">
            {section.section}{" "}
            <span className="text-xs text-textGray ml-2 uppercase">
              {section.section === "主料" ? "MAIN" : "SPICES"}
            </span>
          </h4>
          <ul className="space-y-3">
            {section.items.map((item, itemIndex) => {
              const calculatedAmount = calculateAmount(item.amount);
              const emoji = ICON_KEY_TO_EMOJI[item.iconKey];
              const bgColor = ICON_KEY_TO_BG_COLOR[item.iconKey];

              return (
                <li key={itemIndex} className="flex items-center gap-3">
                  {/* 食材图标（彩色圆形背景 + emoji）*/}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg",
                      bgColor
                    )}
                  >
                    {emoji}
                  </div>

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
