"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  showFilters?: boolean;
}

export function SearchBar({
  defaultValue = "",
  placeholder = "搜索菜谱...比如：啤酒鸭、宫保鸡丁",
  showFilters = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setIsSearching(true);

    // 导航到搜索结果页
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);

    // 注意：由于导航会卸载组件，这里的setIsSearching(false)可能不会执行
    // 在搜索结果页会重新渲染
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={isSearching}
            className="w-full pl-12 pr-4 py-4 text-lg rounded-full border-2 border-sage-200 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-sage-400 animate-spin" />
            </div>
          )}
        </div>

        {/* 快速提示 */}
        <div className="mt-3 text-sm text-sage-500 text-center">
          💡 找不到菜谱？我们会为您智能生成！
        </div>
      </form>

      {/* 筛选器（可选） */}
      {showFilters && (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors text-sm"
          >
            按地点
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors text-sm"
          >
            按菜系
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors text-sm"
          >
            按食材
          </button>
        </div>
      )}
    </div>
  );
}
