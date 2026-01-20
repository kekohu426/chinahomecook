import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { ArrowRight, Clock, ChefHat } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";

interface Recipe {
  id: string;
  titleZh: string;
  titleEn: string | null;
  slug?: string | null;
  summary: any;
  coverImage: string | null;
  cuisine: string | null;
  location: string | null;
}

interface HotRecipesSectionProps {
  recipes: Recipe[];
  locale?: Locale;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function HotRecipesSection({
  recipes,
  locale = DEFAULT_LOCALE,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: HotRecipesSectionProps) {
  const isEn = locale === "en";
  const getDifficultyLabel = (value?: string) => {
    if (!value) return null;
    if (isEn) {
      if (value === "easy") return "Easy";
      if (value === "medium") return "Medium";
      if (value === "hard") return "Hard";
      return value;
    }
    return DIFFICULTY_TO_LABEL[value as keyof typeof DIFFICULTY_TO_LABEL] || value;
  };
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-medium text-textDark">
              {title || (locale === "en" ? "Weekly Favorites" : "本周精选家常菜")}
            </h2>
            <p className="text-textGray mt-1">
              {subtitle ||
                (locale === "en"
                  ? "AI-curated and expert-reviewed."
                  : "AI 辅助整理，团队审核，新手也能轻松上手。")}
            </p>
          </div>
          <LocalizedLink
            href={ctaHref || "/recipe"}
            className="text-brownWarm hover:text-brownDark flex items-center gap-1 font-medium"
          >
            {ctaLabel || (locale === "en" ? "View more" : "查看更多")}
            <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>

        {/* 食谱网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recipes.map((recipe) => {
            const summary = recipe.summary as any;
            const difficultyLabel = getDifficultyLabel(summary?.difficulty);
            const displayTitle = isEn ? recipe.titleEn || recipe.titleZh : recipe.titleZh;
            return (
              <LocalizedLink
                key={recipe.id}
                href={`/recipe/${recipe.slug || recipe.id}`}
                className="group bg-cream rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
              >
                {/* 封面图 */}
                <div className="relative aspect-[4/3] bg-lightGray">
                  {recipe.coverImage ? (
                    <Image
                      src={recipe.coverImage}
                      alt={displayTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-textGray">
                      <ChefHat className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="p-4">
                  <h3 className="font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-1">
                    {displayTitle}
                  </h3>

                  {!isEn && recipe.titleEn && (
                    <p className="text-sm text-textGray mt-1 line-clamp-1">
                      {recipe.titleEn}
                    </p>
                  )}

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {recipe.cuisine && (
                      <span className="px-2 py-0.5 bg-brownWarm/10 text-brownWarm text-xs rounded-full">
                        {recipe.cuisine}
                      </span>
                    )}
                    {summary?.timeTotalMin && (
                      <span className="flex items-center gap-1 text-xs text-textGray">
                        <Clock className="w-3 h-3" />
                        {summary.timeTotalMin} {isEn ? "min" : "分钟"}
                      </span>
                    )}
                    {difficultyLabel && (
                      <span className="text-xs text-textGray">
                        {difficultyLabel}
                      </span>
                    )}
                  </div>
                </div>
              </LocalizedLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
