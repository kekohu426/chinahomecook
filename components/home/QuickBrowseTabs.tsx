"use client";

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

type BrowseItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  href: string;
};

interface QuickBrowseTabsProps {
  title?: string;
  subtitle?: string;
  regions: BrowseItem[];
  cuisines: BrowseItem[];
  ingredients: BrowseItem[];
  scenes: BrowseItem[];
}

type TabKey = "region" | "cuisine" | "ingredient" | "scene";

export function QuickBrowseTabs({
  title,
  subtitle,
  regions,
  cuisines,
  ingredients,
  scenes,
}: QuickBrowseTabsProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [activeTab, setActiveTab] = useState<TabKey>("cuisine");

  const tabs: { key: TabKey; label: string }[] =
    locale === "en"
      ? [
          { key: "cuisine", label: "By Cuisine" },
          { key: "region", label: "By Region" },
          { key: "ingredient", label: "By Ingredient" },
          { key: "scene", label: "By Scene" },
        ]
      : [
          { key: "cuisine", label: "按菜系" },
          { key: "region", label: "按地域" },
          { key: "ingredient", label: "按食材" },
          { key: "scene", label: "按场景" },
        ];

  const panels: Record<TabKey, BrowseItem[]> = {
    region: regions,
    cuisine: cuisines,
    ingredient: ingredients,
    scene: scenes,
  };

  const activeItems = panels[activeTab] || [];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {title ||
              (locale === "en"
                ? "Browse by Cuisine / Region / Ingredient / Scene"
                : "按菜系 / 地域 / 食材 / 场景找菜谱")}
          </h2>
          <p className="text-textGray mt-2 max-w-2xl mx-auto">
            {subtitle ||
              (locale === "en"
                ? "From Sichuan to Cantonese, from quick meals to low-calorie diets, find what you want to cook today."
                : "从川菜到粤菜，从快手菜到减脂餐，按你的需求快速找到今天想做的菜。")}
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-brownWarm text-white"
                  : "bg-cream text-textGray hover:text-textDark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4列网格，1:1图片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {activeItems.slice(0, 8).map((item) => (
            <LocalizedLink
              key={item.id}
              href={item.href}
              className="group bg-white rounded-xl border border-cream overflow-hidden shadow-card hover:shadow-lg transition-shadow"
            >
              {/* 1:1 图片区 */}
              <div className="relative aspect-square overflow-hidden bg-lightGray">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={isEn ? `${item.name} recipes` : `${item.name} 食谱`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
                    <span className="text-4xl">🍲</span>
                  </div>
                )}
              </div>
              {/* 信息区 */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-textDark group-hover:text-brownWarm transition-colors">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-sm text-textGray mt-1 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
            </LocalizedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
