/**
 * SearchResultCard 组件
 *
 * 搜索结果卡片（用于搜索页）
 */

import Link from "next/link";
import { ChefHat } from "lucide-react";

interface SearchResultCardProps {
  id: string;
  titleZh: string;
  summary?: { oneLine?: string } | null;
  location?: string | null;
  cuisine?: string | null;
  aiGenerated?: boolean | null;
  coverImage?: string | null;
}

export function SearchResultCard({
  id,
  titleZh,
  summary,
  location,
  cuisine,
  aiGenerated,
  coverImage,
}: SearchResultCardProps) {
  return (
    <Link href={`/recipe/${id}`} className="group block">
      <div className="bg-white rounded-2xl border-2 border-lightGray hover:border-brownWarm/40 transition-all overflow-hidden hover:shadow-lg">
        {/* 封面图占位 */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-cream to-orangeAccent/20 flex items-center justify-center overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={titleZh}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ChefHat className="w-16 h-16 text-textGray" />
          )}
        </div>

        {/* 内容 */}
        <div className="p-5">
          {/* 标题 */}
          <h3 className="text-xl font-medium text-textDark mb-2 group-hover:text-brownWarm transition-colors">
            {titleZh}
          </h3>

          {/* 一句话描述 */}
          {summary?.oneLine && (
            <p className="text-sm text-textGray mb-3">
              {summary.oneLine}
            </p>
          )}

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {location && (
              <span className="px-2 py-1 bg-cream text-textDark text-xs rounded-full">
                📍 {location}
              </span>
            )}
            {cuisine && (
              <span className="px-2 py-1 bg-lightGray text-textDark text-xs rounded-full">
                🍜 {cuisine}
              </span>
            )}
            {aiGenerated && (
              <span className="px-2 py-1 bg-orangeAccent/20 text-brownDark text-xs rounded-full">
                ✨ AI生成
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
