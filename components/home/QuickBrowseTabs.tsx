"use client";

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/home/SectionHeading";

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
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<TabKey>("cuisine");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "cuisine", label: t("filter.cuisine") },
    { key: "region", label: t("filter.region") },
    { key: "ingredient", label: t("recipe.ingredients") },
    { key: "scene", label: t("filter.scene") },
  ];

  const panels: Record<TabKey, BrowseItem[]> = {
    region: regions,
    cuisine: cuisines,
    ingredient: ingredients,
    scene: scenes,
  };

  const activeItems = panels[activeTab] || [];

  return (
    <section className="editorial-section editorial-section--white">
      <div className="editorial-container">
        <div className="mb-10">
          <SectionHeading
            title={title || t("home.quickBrowseTitle")}
            subtitle={subtitle || t("home.quickBrowseSubtitle")}
          />
        </div>

        <div className="editorial-tabs mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`editorial-tab ${
                activeTab === tab.key
                  ? "editorial-tab--active"
                  : "editorial-tab--inactive"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="editorial-grid-4">
          {activeItems.slice(0, 8).map((item) => (
            <LocalizedLink
              key={item.id}
              href={item.href}
              className="group editorial-card"
            >
              <div className="editorial-image">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={`${item.name} ${t("nav.recipes")}`}
                    fill
                    className="editorial-image-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
                    <ImageIcon className="w-10 h-10 text-brownWarm/40" />
                  </div>
                )}
              </div>
              <div className="editorial-card-body">
                <h3 className="text-lg font-medium text-textDark group-hover:text-brownWarm transition-colors">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-sm text-textGray mt-2 line-clamp-2">
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
