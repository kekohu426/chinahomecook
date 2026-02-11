"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  UtensilsCrossed,
  Loader2,
  X,
  Sun,
  Flame,
  Heart,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/translations";
import { translateTagName } from "@/lib/i18n/tag-english";

interface FilterItem {
  id: string;
  name: string;
  originalName?: string;
  slug: string;
  icon?: string;
  count?: number;
}

interface RecipeSquareFiltersProps {
  basePath?: string;
  className?: string;
  showSearch?: boolean;
  defaultExpanded?: boolean;
}

export function RecipeSquareFilters({
  basePath = "/recipe",
  className = "",
  showSearch = true,
  defaultExpanded = false,
}: RecipeSquareFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { t } = useTranslations();
  const isEn = locale === "en";

  // 鏁版嵁鐘舵€?
  const [locations, setLocations] = useState<FilterItem[]>([]);
  const [cuisines, setCuisines] = useState<FilterItem[]>([]);
  const [scenes, setScenes] = useState<FilterItem[]>([]);
  const [methods, setMethods] = useState<FilterItem[]>([]);
  const [tastes, setTastes] = useState<FilterItem[]>([]);
  const [crowds, setCrowds] = useState<FilterItem[]>([]);
  const [occasions, setOccasions] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI鐘舵€?
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isSearching, setIsSearching] = useState(false);

  // 绛涢€夌姸鎬?
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") || "");
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get("cuisine") || "");
  const [selectedScene, setSelectedScene] = useState(searchParams.get("scene") || "");
  const [selectedMethod, setSelectedMethod] = useState(searchParams.get("method") || "");
  const [selectedTaste, setSelectedTaste] = useState(searchParams.get("taste") || "");
  const [selectedCrowd, setSelectedCrowd] = useState(searchParams.get("crowd") || "");
  const [selectedOccasion, setSelectedOccasion] = useState(searchParams.get("occasion") || "");

  // 鍔犺浇閰嶇疆鏁版嵁
  useEffect(() => {
    async function loadConfigs() {
      try {
        const qs = `?active=true&locale=${locale}`;
        const [
          locationsRes,
          cuisinesRes,
          scenesRes,
          methodsRes,
          tastesRes,
          crowdsRes,
          occasionsRes,
        ] = await Promise.all([
          fetch(`/api/config/locations${qs}`),
          fetch(`/api/config/cuisines${qs}`),
          fetch(`/api/admin/config/tags/scenes?locale=${locale}`),
          fetch(`/api/admin/config/tags/cooking-methods?locale=${locale}`),
          fetch(`/api/admin/config/tags/tastes?locale=${locale}`),
          fetch(`/api/admin/config/tags/crowds?locale=${locale}`),
          fetch(`/api/admin/config/tags/occasions?locale=${locale}`),
        ]);

        const [
          locationsData,
          cuisinesData,
          scenesData,
          methodsData,
          tastesData,
          crowdsData,
          occasionsData,
        ] = await Promise.all([
          locationsRes.json(),
          cuisinesRes.json(),
          scenesRes.json(),
          methodsRes.json(),
          tastesRes.json(),
          crowdsRes.json(),
          occasionsRes.json(),
        ]);

        if (locationsData.success) setLocations(locationsData.data);
        if (cuisinesData.success) setCuisines(cuisinesData.data);
        if (scenesData.success) setScenes(scenesData.data.filter((t: FilterItem & { isActive?: boolean }) => t.isActive !== false));
        if (methodsData.success) setMethods(methodsData.data.filter((t: FilterItem & { isActive?: boolean }) => t.isActive !== false));
        if (tastesData.success) setTastes(tastesData.data.filter((t: FilterItem & { isActive?: boolean }) => t.isActive !== false));
        if (crowdsData.success) setCrowds(crowdsData.data.filter((t: FilterItem & { isActive?: boolean }) => t.isActive !== false));
        if (occasionsData.success) setOccasions(occasionsData.data.filter((t: FilterItem & { isActive?: boolean }) => t.isActive !== false));
      } catch (error) {
        console.error("鍔犺浇閰嶇疆澶辫触:", error);
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
  }, [locale]);

  // 搴旂敤绛涢€?
  const applyFilters = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    const filterMap: Record<string, string | undefined> = {
      location: updates.location ?? selectedLocation,
      cuisine: updates.cuisine ?? selectedCuisine,
      scene: updates.scene ?? selectedScene,
      method: updates.method ?? selectedMethod,
      taste: updates.taste ?? selectedTaste,
      crowd: updates.crowd ?? selectedCrowd,
      occasion: updates.occasion ?? selectedOccasion,
      q: updates.q ?? searchQuery,
    };

    Object.entries(filterMap).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }, [searchParams, selectedLocation, selectedCuisine, selectedScene, selectedMethod, selectedTaste, selectedCrowd, selectedOccasion, searchQuery, basePath, router]);

  // 鎼滅储澶勭悊
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    applyFilters({ q: searchQuery.trim() });
  };

  // 娓呴櫎鎵€鏈夌瓫閫?
  const clearFilters = () => {
    setSelectedLocation("");
    setSelectedCuisine("");
    setSelectedScene("");
    setSelectedMethod("");
    setSelectedTaste("");
    setSelectedCrowd("");
    setSelectedOccasion("");
    setSearchQuery("");
    router.push(basePath);
  };

  const hasActiveFilters =
    selectedLocation ||
    selectedCuisine ||
    selectedScene ||
    selectedMethod ||
    selectedTaste ||
    selectedCrowd ||
    selectedOccasion ||
    searchQuery;

  const activeFilterCount = [
    selectedLocation,
    selectedCuisine,
    selectedScene,
    selectedMethod,
    selectedTaste,
    selectedCrowd,
    selectedOccasion,
  ].filter(Boolean).length;

  // 娓叉煋绛涢€夋爣绛剧粍
  const renderFilterGroup = (
    icon: React.ReactNode,
    label: string,
    items: FilterItem[],
    selectedValue: string,
    setSelectedValue: (value: string) => void,
    filterKey: string,
    tagType?: "scene" | "method" | "taste" | "crowd" | "occasion"
  ) => {
    if (items.length === 0) return null;
    const formatName = (item: FilterItem) => {
      if (!isEn) return item.name;
      return translateTagName({
        name: item.name,
        originalName: item.originalName,
        slug: item.slug,
        type: tagType,
        locale,
      });
    };

    return (
      <div className="flex items-start gap-3 py-3 border-b border-lightGray last:border-0">
        <div className="flex items-center gap-2 text-textGray font-medium shrink-0 min-w-[100px] pt-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedValue("");
              applyFilters({ [filterKey]: "" });
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap",
              selectedValue === ""
                ? "bg-brownWarm text-white shadow-md"
                : "bg-lightGray text-textGray hover:bg-cream/70 hover:text-textDark"
            )}
          >
            {t("filter.all")}
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const newVal = selectedValue === item.slug ? "" : item.slug;
                setSelectedValue(newVal);
                applyFilters({ [filterKey]: newVal });
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap",
                selectedValue === item.slug
                  ? "bg-brownWarm text-white shadow-md"
                  : "bg-lightGray text-textGray hover:bg-cream/70 hover:text-textDark"
              )}
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {formatName(item)}
              {item.count !== undefined && (
                <span className="ml-1 text-xs opacity-60">({item.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brownWarm animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-2xl shadow-lg border border-lightGray", className)}>
      {/* 鎼滅储鏍?*/}
      {showSearch && (
        <div className="p-6 border-b border-lightGray">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-brownWarm" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("filter.searchPlaceholder")}
                className="w-full pl-12 pr-32 py-4 text-base rounded-full border-2 border-lightGray focus:border-brownWarm focus:outline-none focus:ring-4 focus:ring-brownWarm/10 transition-all bg-cream/70 text-textDark placeholder:text-textGray/70"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 px-6 py-2.5 bg-brownWarm hover:bg-brownDark text-white rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    {t("common.search")}
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-textGray">
              <Sparkles className="w-4 h-4 text-orangeAccent" />
              <span>{t("ai.notFound")}</span>
            </div>
          </form>
        </div>
      )}

      {/* 涓昏绛涢€夊尯 - 鍦扮偣鍜岃彍绯?*/}
      <div className="px-6 py-4">
        {renderFilterGroup(
          <MapPin className="w-4 h-4" />,
          t("filter.region"),
          locations,
          selectedLocation,
          setSelectedLocation,
          "location"
        )}
        {renderFilterGroup(
          <UtensilsCrossed className="w-4 h-4" />,
          t("filter.cuisine"),
          cuisines,
          selectedCuisine,
          setSelectedCuisine,
          "cuisine"
        )}
      </div>

      {/* 灞曞紑/鏀惰捣鏇村绛涢€?*/}
      {(scenes.length > 0 || methods.length > 0 || tastes.length > 0 || crowds.length > 0 || occasions.length > 0) && (
        <>
          <div className="px-6 py-3 border-t border-lightGray">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium text-textGray hover:text-brownWarm transition-colors w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>{expanded ? t("filter.lessFilters") : t("filter.moreFilters")}</span>
                {!expanded && activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-brownWarm text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 灞曞紑鐨勬洿澶氱瓫閫?*/}
          {expanded && (
            <div className="px-6 py-4 bg-cream/60 border-t border-lightGray">
              {renderFilterGroup(
                <Sun className="w-4 h-4" />,
                t("filter.scene"),
                scenes,
                selectedScene,
                setSelectedScene,
                "scene",
                "scene"
              )}
              {renderFilterGroup(
                <Flame className="w-4 h-4" />,
                t("filter.method"),
                methods,
                selectedMethod,
                setSelectedMethod,
                "method",
                "method"
              )}
              {renderFilterGroup(
                <Heart className="w-4 h-4" />,
                t("filter.taste"),
                tastes,
                selectedTaste,
                setSelectedTaste,
                "taste",
                "taste"
              )}
              {renderFilterGroup(
                <Users className="w-4 h-4" />,
                t("filter.crowd"),
                crowds,
                selectedCrowd,
                setSelectedCrowd,
                "crowd",
                "crowd"
              )}
              {renderFilterGroup(
                <Calendar className="w-4 h-4" />,
                t("filter.occasion"),
                occasions,
                selectedOccasion,
                setSelectedOccasion,
                "occasion",
                "occasion"
              )}
            </div>
          )}
        </>
      )}

      {/* 娓呴櫎绛涢€夋寜閽?*/}
      {hasActiveFilters && (
        <div className="px-6 py-4 border-t border-lightGray flex justify-end">
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            {t("filter.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
