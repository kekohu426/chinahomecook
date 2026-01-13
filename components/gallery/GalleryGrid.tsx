"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { Download, Eye, Loader2, X } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface GalleryImage {
  id: string;
  titleZh: string;
  titleEn: string | null;
  coverImage: string | null;
  cuisine: string | null;
  location: string | null;
}

interface GalleryGridProps {
  initialRecipes: GalleryImage[];
  total: number;
}

export function GalleryGrid({ initialRecipes, total }: GalleryGridProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const getDisplayTitle = (recipe: GalleryImage): string =>
    (isEn ? recipe.titleZh || recipe.titleEn : recipe.titleZh) || "";
  const [recipes, setRecipes] = useState<GalleryImage[]>(initialRecipes);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(recipes.length < total);
  const [page, setPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/gallery?page=${nextPage}&limit=20&locale=${locale}`
      );
      const data = await res.json();

      if (data.success) {
        setRecipes((prev) => [...prev, ...data.data]);
        setPage(nextPage);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error("加载更多失败:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, locale]);

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  // 下载图片
  const handleDownload = async (recipe: GalleryImage) => {
    if (downloading) return;

    setDownloading(recipe.id);
    try {
      const response = await fetch(`/api/gallery/download/${recipe.id}`);
      if (!response.ok) throw new Error(isEn ? "Download failed" : "下载失败");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getDisplayTitle(recipe)}_RecipeZen.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("下载失败:", error);
      alert(isEn ? "Download failed. Please try again." : "下载失败，请稍后重试");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      {/* 瀑布流布局 */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
        {recipes.map((recipe) => {
          const displayTitle = getDisplayTitle(recipe);
          return (
          <div
            key={recipe.id}
            className="break-inside-avoid mb-4 group relative rounded-xl overflow-hidden shadow-card bg-white"
          >
            {/* 图片 */}
            <div className="relative">
              <img
                src={recipe.coverImage || "/placeholder-food.jpg"}
                alt={displayTitle}
                className="w-full object-cover"
                loading="lazy"
              />

              {/* 悬浮遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* 标题 */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-medium text-lg mb-1">
                    {displayTitle}
                  </h3>
                  {(recipe.cuisine || recipe.location) && (
                    <p className="text-white/70 text-sm">
                      {[recipe.location, recipe.cuisine]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* 查看大图 */}
                  <button
                    onClick={() => setLightboxImage(recipe)}
                    className="w-10 h-10 rounded-full bg-white/90 text-textDark flex items-center justify-center hover:bg-white transition-colors"
                    title={isEn ? "View" : "查看大图"}
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {/* 下载 */}
                  <button
                    onClick={() => handleDownload(recipe)}
                    disabled={downloading === recipe.id}
                    className="w-10 h-10 rounded-full bg-brownWarm text-white flex items-center justify-center hover:bg-brownDark transition-colors disabled:opacity-60"
                    title={isEn ? "Download" : "下载图片"}
                  >
                    {downloading === recipe.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 底部信息（移动端显示） */}
            <div className="p-3 md:hidden">
              <LocalizedLink
                href={`/recipe/${recipe.id}`}
                className="text-textDark font-medium hover:text-brownWarm"
              >
                {displayTitle}
              </LocalizedLink>
            </div>
          </div>
        )})}
      </div>

      {/* 加载更多 */}
      <div ref={loadMoreRef} className="py-8 text-center">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-textGray">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{locale === "en" ? "Loading..." : "加载中..."}</span>
          </div>
        )}
        {!hasMore && recipes.length > 0 && (
          <p className="text-textGray">
            {locale === "en"
              ? `Loaded ${recipes.length} images`
              : `已加载全部 ${recipes.length} 张图片`}
          </p>
        )}
      </div>

      {/* Lightbox 大图预览 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {(() => {
            const lightboxTitle = getDisplayTitle(lightboxImage);
            const lightboxSubtitle = !isEn ? lightboxImage.titleEn : null;
            return (
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 图片 */}
            <img
              src={lightboxImage.coverImage || "/placeholder-food.jpg"}
              alt={lightboxTitle}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />

            {/* 底部信息 */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium text-xl">
                  {lightboxTitle}
                </h3>
                {lightboxSubtitle && lightboxSubtitle !== lightboxTitle && (
                  <p className="text-white/60 text-sm">{lightboxSubtitle}</p>
                )}
              </div>

              <div className="flex gap-3">
                <LocalizedLink
                  href={`/recipe/${lightboxImage.id}`}
                  className="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                >
                  {isEn ? "View Recipe" : "查看食谱"}
                </LocalizedLink>
                <button
                  onClick={() => handleDownload(lightboxImage)}
                  disabled={downloading === lightboxImage.id}
                  className="px-4 py-2 bg-brownWarm text-white rounded-full hover:bg-brownDark transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {downloading === lightboxImage.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isEn ? "Download" : "下载图片"}
                </button>
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
