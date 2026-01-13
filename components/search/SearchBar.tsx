"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizePath } from "@/lib/i18n/utils";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  showFilters?: boolean;
}

export function SearchBar({
  defaultValue = "",
  placeholder,
  showFilters = false,
}: SearchBarProps) {
  const router = useRouter();
  const locale = useLocale();
  const [query, setQuery] = useState(defaultValue);
  const [isSearching, setIsSearching] = useState(false);
  const resolvedPlaceholder =
    placeholder ||
    (locale === "en"
      ? "Search recipes... e.g. Kung Pao Chicken"
      : "搜索菜谱...比如：啤酒鸭、宫保鸡丁");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setIsSearching(true);

    // 导航到搜索结果页
    router.push(
      `${localizePath("/search", locale)}?q=${encodeURIComponent(query.trim())}`
    );
    
    // 不要在导航后立即重置，等待跳转。
    // 但为了防止跳转被取消或极快完成导致状态卡住，可以在短暂延迟后恢复
    // 或者干脆不禁用输入框，只显示 loading 状态
  };

  // 监听 defaultValue 变化（可选，视需求而定，这里先保留）
  // useEffect(() => {
  //   setQuery(defaultValue);
  // }, [defaultValue]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={resolvedPlaceholder}
            // 移除 disabled={isSearching}，防止状态锁死导致无法输入
            className="w-full pl-12 pr-4 py-4 text-lg rounded-full border-2 border-sage-200 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white text-textDark"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-sage-400 animate-spin" />
            </div>
          )}
        </div>

        {/* 快速提示 */}
        <div className="mt-3 text-sm text-sage-500 text-center">
          {locale === "en"
            ? "💡 Can't find it? We'll generate one for you!"
            : "💡 找不到菜谱？我们会为您智能生成！"}
        </div>
      </form>

      {/* 筛选器（可选） */}
      {showFilters && (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors text-sm"
          >
            {locale === "en" ? "By Region" : "按地点"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors text-sm"
          >
            {locale === "en" ? "By Cuisine" : "按菜系"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors text-sm"
          >
            {locale === "en" ? "By Ingredient" : "按食材"}
          </button>
        </div>
      )}
    </div>
  );
}
