"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, UtensilsCrossed, Loader2, X, Sun, Flame, Heart, Users, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface Location {
  id: string;
  name: string;
  originalName?: string;
  slug: string;
}

interface Cuisine {
  id: string;
  name: string;
  originalName?: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface FilterBarProps {
  basePath?: string;
  sticky?: boolean;
  className?: string;
  showCuisine?: boolean;
  showLocation?: boolean;
  showTags?: boolean;
}

export function FilterBar({
  basePath = "/recipe",
  sticky = true,
  className = "",
  showCuisine = true,
  showLocation = true,
  showTags = true,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const [locations, setLocations] = useState<Location[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [scenes, setScenes] = useState<Tag[]>([]);
  const [methods, setMethods] = useState<Tag[]>([]);
  const [tastes, setTastes] = useState<Tag[]>([]);
  const [crowds, setCrowds] = useState<Tag[]>([]);
  const [occasions, setOccasions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<string>(
    searchParams.get("location") || ""
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string>(
    searchParams.get("cuisine") || ""
  );
  const [selectedScene, setSelectedScene] = useState<string>(
    searchParams.get("scene") || ""
  );
  const [selectedMethod, setSelectedMethod] = useState<string>(
    searchParams.get("method") || ""
  );
  const [selectedTaste, setSelectedTaste] = useState<string>(
    searchParams.get("taste") || ""
  );
  const [selectedCrowd, setSelectedCrowd] = useState<string>(
    searchParams.get("crowd") || ""
  );
  const [selectedOccasion, setSelectedOccasion] = useState<string>(
    searchParams.get("occasion") || ""
  );

  // 加载配置数据
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
          fetch("/api/admin/config/tags/scenes"),
          fetch("/api/admin/config/tags/cooking-methods"),
          fetch("/api/admin/config/tags/tastes"),
          fetch("/api/admin/config/tags/crowds"),
          fetch("/api/admin/config/tags/occasions"),
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

        if (locationsData.success) {
          setLocations(locationsData.data);
        }
        if (cuisinesData.success) {
          setCuisines(cuisinesData.data);
        }
        if (scenesData.success) {
          setScenes(scenesData.data.filter((t: Tag & { isActive?: boolean }) => t.isActive !== false));
        }
        if (methodsData.success) {
          setMethods(methodsData.data.filter((t: Tag & { isActive?: boolean }) => t.isActive !== false));
        }
        if (tastesData.success) {
          setTastes(tastesData.data.filter((t: Tag & { isActive?: boolean }) => t.isActive !== false));
        }
        if (crowdsData.success) {
          setCrowds(crowdsData.data.filter((t: Tag & { isActive?: boolean }) => t.isActive !== false));
        }
        if (occasionsData.success) {
          setOccasions(occasionsData.data.filter((t: Tag & { isActive?: boolean }) => t.isActive !== false));
        }
      } catch (error) {
        console.error("加载配置失败:", error);
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
  }, [locale]);

  // 应用筛选
  const applyFilters = (updates: {
    location?: string;
    cuisine?: string;
    scene?: string;
    method?: string;
    taste?: string;
    crowd?: string;
    occasion?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const filterMap: Record<string, string | undefined> = {
      location: updates.location ?? selectedLocation,
      cuisine: updates.cuisine ?? selectedCuisine,
      scene: updates.scene ?? selectedScene,
      method: updates.method ?? selectedMethod,
      taste: updates.taste ?? selectedTaste,
      crowd: updates.crowd ?? selectedCrowd,
      occasion: updates.occasion ?? selectedOccasion,
    };

    Object.entries(filterMap).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // 重置到第一页
    params.set("page", "1");

    router.push(`${basePath}?${params.toString()}`);
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedLocation("");
    setSelectedCuisine("");
    setSelectedScene("");
    setSelectedMethod("");
    setSelectedTaste("");
    setSelectedCrowd("");
    setSelectedOccasion("");
    router.push(basePath);
  };

  const hasActiveFilters =
    selectedLocation ||
    selectedCuisine ||
    selectedScene ||
    selectedMethod ||
    selectedTaste ||
    selectedCrowd ||
    selectedOccasion;

  const hasTagFilters =
    selectedScene ||
    selectedMethod ||
    selectedTaste ||
    selectedCrowd ||
    selectedOccasion;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-textGray animate-spin" />
      </div>
    );
  }

  const wrapperClass = [
    "bg-white border-b border-lightGray shadow-sm",
    sticky ? "sticky top-0 z-10" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!showLocation && !showCuisine && !showTags) {
    return null;
  }

  // 渲染单个标签筛选行
  const renderTagRow = (
    icon: React.ReactNode,
    label: string,
    tags: Tag[],
    selectedValue: string,
    setSelectedValue: (value: string) => void,
    filterKey: "scene" | "method" | "taste" | "crowd" | "occasion"
  ) => {
    if (tags.length === 0) return null;
    return (
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-center gap-2 text-textGray font-medium shrink-0">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedValue("");
              applyFilters({ [filterKey]: "" });
            }}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
              selectedValue === ""
                ? "bg-brownWarm text-white shadow-md"
                : "bg-gray-100 text-textGray hover:bg-gray-200"
            }`}
          >
            {locale === "en" ? "All" : "全部"}
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                const newVal = selectedValue === tag.slug ? "" : tag.slug;
                setSelectedValue(newVal);
                applyFilters({ [filterKey]: newVal });
              }}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                selectedValue === tag.slug
                  ? "bg-brownWarm text-white shadow-md"
                  : "bg-gray-100 text-textGray hover:bg-gray-200"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={wrapperClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">

        {/* 地点筛选 - 横铺 */}
        {showLocation && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2 text-textGray font-medium shrink-0">
              <MapPin className="w-4 h-4" />
              <span>{locale === "en" ? "Region:" : "地点:"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedLocation("");
                  applyFilters({ location: "" });
                }}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                  selectedLocation === ""
                    ? "bg-brownWarm text-white shadow-md"
                    : "bg-gray-100 text-textGray hover:bg-gray-200"
                }`}
              >
                {locale === "en" ? "All" : "全部"}
              </button>
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    const value = loc.slug || loc.originalName || loc.name;
                    const newVal = selectedLocation === value ? "" : value;
                    setSelectedLocation(newVal);
                    applyFilters({ location: newVal });
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                    selectedLocation === (loc.slug || loc.originalName || loc.name)
                      ? "bg-brownWarm text-white shadow-md"
                      : "bg-gray-100 text-textGray hover:bg-gray-200"
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 菜系筛选 - 横铺 */}
        {showCuisine && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2 text-textGray font-medium shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
              <span>{locale === "en" ? "Cuisine:" : "菜系:"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCuisine("");
                  applyFilters({ cuisine: "" });
                }}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                  selectedCuisine === ""
                    ? "bg-brownWarm text-white shadow-md"
                    : "bg-gray-100 text-textGray hover:bg-gray-200"
                }`}
              >
                {locale === "en" ? "All" : "全部"}
              </button>
              {cuisines.map((cui) => (
                <button
                  key={cui.id}
                  onClick={() => {
                    const value = cui.slug || cui.originalName || cui.name;
                    const newVal = selectedCuisine === value ? "" : value;
                    setSelectedCuisine(newVal);
                    applyFilters({ cuisine: newVal });
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                    selectedCuisine === (cui.slug || cui.originalName || cui.name)
                      ? "bg-brownWarm text-white shadow-md"
                      : "bg-gray-100 text-textGray hover:bg-gray-200"
                  }`}
                >
                  {cui.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 标签筛选 - 可展开 */}
        {showTags && (scenes.length > 0 || methods.length > 0 || tastes.length > 0) && (
          <>
            {/* 展开/收起按钮 */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm text-textGray hover:text-brownWarm transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {locale === "en" ? "Less filters" : "收起更多筛选"}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {locale === "en" ? "More filters" : "更多筛选"}
                    {hasTagFilters && (
                      <span className="ml-1 px-1.5 py-0.5 bg-brownWarm text-white text-xs rounded-full">
                        {[selectedScene, selectedMethod, selectedTaste, selectedCrowd, selectedOccasion].filter(Boolean).length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* 展开的标签筛选 */}
            {expanded && (
              <div className="space-y-3 pt-2">
                {renderTagRow(
                  <Sun className="w-4 h-4" />,
                  locale === "en" ? "Scene:" : "场景:",
                  scenes,
                  selectedScene,
                  setSelectedScene,
                  "scene"
                )}
                {renderTagRow(
                  <Flame className="w-4 h-4" />,
                  locale === "en" ? "Method:" : "烹饪方法:",
                  methods,
                  selectedMethod,
                  setSelectedMethod,
                  "method"
                )}
                {renderTagRow(
                  <Heart className="w-4 h-4" />,
                  locale === "en" ? "Taste:" : "口味:",
                  tastes,
                  selectedTaste,
                  setSelectedTaste,
                  "taste"
                )}
                {renderTagRow(
                  <Users className="w-4 h-4" />,
                  locale === "en" ? "For:" : "适宜人群:",
                  crowds,
                  selectedCrowd,
                  setSelectedCrowd,
                  "crowd"
                )}
                {renderTagRow(
                  <Calendar className="w-4 h-4" />,
                  locale === "en" ? "Occasion:" : "场合:",
                  occasions,
                  selectedOccasion,
                  setSelectedOccasion,
                  "occasion"
                )}
              </div>
            )}
          </>
        )}

        {/* 底部状态栏 (清除按钮等) */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-2 border-t border-gray-100">
             <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-lightGray hover:bg-red-50 hover:text-red-600 text-textGray text-sm transition-colors"
            >
              <X className="w-3 h-3" />
              {locale === "en" ? "Clear filters" : "清除所有筛选"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
