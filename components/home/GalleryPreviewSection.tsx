import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

interface GalleryImage {
  id: string;
  titleZh: string;
  slug?: string | null;
  coverImage: string | null;
  cuisine: string | null;
}

interface GalleryPreviewSectionProps {
  images: GalleryImage[];
  locale?: Locale;
}

export function GalleryPreviewSection({
  images,
  locale = DEFAULT_LOCALE,
}: GalleryPreviewSectionProps) {
  // 瀑布流布局：分成3列
  const columns: GalleryImage[][] = [[], [], []];
  images.forEach((img, i) => {
    columns[i % 3].push(img);
  });

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-medium text-textDark">
              {locale === "en" ? "Food Image Library" : "高清美食图片库"}
            </h2>
            <p className="text-textGray mt-1">
              {locale === "en"
                ? "AI-generated images, free and commercial-friendly."
                : "AI 生成真实感素材，高清、可商用、免费下载。"}
            </p>
          </div>
          <LocalizedLink
            href="/recipe"
            className="text-brownWarm hover:text-brownDark flex items-center gap-1 font-medium"
          >
            {locale === "en" ? "View related recipes" : "查看相关菜谱"}
            <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>

        {/* 瀑布流图片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-4">
              {column.map((img, imgIndex) => {
                // 根据位置设置不同的高度
                const heightClass =
                  (colIndex + imgIndex) % 3 === 0
                    ? "aspect-[3/4]"
                    : (colIndex + imgIndex) % 3 === 1
                    ? "aspect-square"
                    : "aspect-[4/3]";

                return (
                  <LocalizedLink
                    key={img.id}
                    href={`/recipe/${img.slug || img.id}`}
                    className="group block relative rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                  >
                    <div className={`relative ${heightClass} bg-lightGray`}>
                      {img.coverImage && (
                        <Image
                          src={img.coverImage}
                          alt={img.titleZh}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 33vw"
                        />
                      )}

                      {/* 悬浮信息 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-medium line-clamp-1">
                            {img.titleZh}
                          </p>
                          {img.cuisine && (
                            <p className="text-white/70 text-sm">{img.cuisine}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
