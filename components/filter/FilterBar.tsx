"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, UtensilsCrossed, Loader2, X } from "lucide-react";

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface Cuisine {
  id: string;
  name: string;
  slug: string;
}

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [locations, setLocations] = useState<Location[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState<string>(
    searchParams.get("location") || ""
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string>(
    searchParams.get("cuisine") || ""
  );

  // 加载配置数据
  useEffect(() => {
    async function loadConfigs() {
      try {
        const [locationsRes, cuisinesRes] = await Promise.all([
          fetch("/api/config/locations?active=true"),
          fetch("/api/config/cuisines?active=true"),
        ]);

        const [locationsData, cuisinesData] = await Promise.all([
          locationsRes.json(),
          cuisinesRes.json(),
        ]);

        if (locationsData.success) {
          setLocations(locationsData.data);
        }

        if (cuisinesData.success) {
          setCuisines(cuisinesData.data);
        }
      } catch (error) {
        console.error("加载配置失败:", error);
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
  }, []);

  // 应用筛选
  const applyFilters = (location: string, cuisine: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (location) {
      params.set("location", location);
    } else {
      params.delete("location");
    }

    if (cuisine) {
      params.set("cuisine", cuisine);
    } else {
      params.delete("cuisine");
    }

    // 重置到第一页
    params.set("page", "1");

    router.push(`/?${params.toString()}`);
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedLocation("");
    setSelectedCuisine("");
    router.push("/");
  };

  const hasActiveFilters = selectedLocation || selectedCuisine;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-textGray animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-lightGray sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 地点筛选 */}
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-textGray" />
            <select
              value={selectedLocation}
              onChange={(e) => {
                const newLocation = e.target.value;
                setSelectedLocation(newLocation);
                applyFilters(newLocation, selectedCuisine);
              }}
              className="px-4 py-2 pr-8 rounded-full border border-lightGray focus:border-brownWarm focus:outline-none focus:ring-2 focus:ring-orangeAccent/20 text-sm bg-white cursor-pointer hover:border-brownWarm/50 transition-colors"
            >
              <option value="">全部地点</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* 菜系筛选 */}
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-textGray" />
            <select
              value={selectedCuisine}
              onChange={(e) => {
                const newCuisine = e.target.value;
                setSelectedCuisine(newCuisine);
                applyFilters(selectedLocation, newCuisine);
              }}
              className="px-4 py-2 pr-8 rounded-full border border-lightGray focus:border-brownWarm focus:outline-none focus:ring-2 focus:ring-orangeAccent/20 text-sm bg-white cursor-pointer hover:border-brownWarm/50 transition-colors"
            >
              <option value="">全部菜系</option>
              {cuisines.map((cui) => (
                <option key={cui.id} value={cui.name}>
                  {cui.name}
                </option>
              ))}
            </select>
          </div>

          {/* 清除筛选按钮 */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-lightGray hover:bg-cream text-textDark text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}

          {/* 当前筛选标签 */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-textGray">已筛选：</span>
              {selectedLocation && (
                <span className="px-3 py-1 bg-cream text-textDark text-sm rounded-full">
                  📍 {selectedLocation}
                </span>
              )}
              {selectedCuisine && (
                <span className="px-3 py-1 bg-cream text-textDark text-sm rounded-full">
                  🍜 {selectedCuisine}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
