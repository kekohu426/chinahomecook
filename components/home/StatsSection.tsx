"use client";

import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

interface Stats {
  recipesGenerated: number;
  recipesCollected: number;
  totalDownloads: number;
}

interface Review {
  name: string;
  content: string;
  rating: number;
}

interface StatsSectionProps {
  stats: Stats;
  reviews: Review[];
  locale?: Locale;
}

export function StatsSection({
  stats,
  reviews,
  locale = DEFAULT_LOCALE,
}: StatsSectionProps) {
  const [currentReview, setCurrentReview] = useState(0);
  const isEn = locale === "en";

  // 自动轮播评价
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const formatNumber = (num: number) => {
    if (isEn) {
      return num.toLocaleString("en-US");
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString("zh-CN");
  };

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* 统计数据 */}
          <div className="flex gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-brownWarm">
                {formatNumber(stats.recipesGenerated)}+
              </div>
              <div className="text-sm text-textGray mt-1">
                {isEn ? "Recipes Generated" : "已生成食谱"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brownWarm">
                {formatNumber(stats.recipesCollected)}+
              </div>
              <div className="text-sm text-textGray mt-1">
                {isEn ? "Recipes Collected" : "收录菜品"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brownWarm">
                {formatNumber(stats.totalDownloads)}+
              </div>
              <div className="text-sm text-textGray mt-1">
                {isEn ? "Total Downloads" : "累计下载"}
              </div>
            </div>
          </div>

          {/* 用户评价轮播 */}
          {reviews.length > 0 && (
            <div className="flex-1 max-w-md">
              <div className="bg-cream/50 rounded-xl p-6 relative">
                <div className="flex items-start gap-4">
                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full bg-brownWarm/10 flex items-center justify-center text-brownWarm font-medium shrink-0">
                    {reviews[currentReview].name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    {/* 星级 */}
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < reviews[currentReview].rating
                              ? "fill-orangeAccent text-orangeAccent"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* 评价内容 */}
                    <p className="text-textDark mb-2">
                      &ldquo;{reviews[currentReview].content}&rdquo;
                    </p>

                    {/* 用户名 */}
                    <p className="text-sm text-textGray">
                      — {reviews[currentReview].name}
                    </p>
                  </div>
                </div>

                {/* 轮播指示器 */}
                {reviews.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {reviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentReview(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentReview ? "bg-brownWarm" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
