import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { ArrowRight, Clock, ChefHat } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish, toEnglishLabel } from "@/lib/i18n/english";
import { CUISINE_LABELS_EN } from "@/lib/i18n/labels";
import { SectionHeading } from "@/components/home/SectionHeading";

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
      if (value == "easy") return "Easy";
      if (value == "medium") return "Medium";
      if (value == "hard") return "Hard";
      return value;
    }
    return DIFFICULTY_TO_LABEL[value as keyof typeof DIFFICULTY_TO_LABEL] || value;
  };

  return (
    <section className="editorial-section editorial-section--white">
      <div className="editorial-container">
        <div className="mb-10">
          <SectionHeading
            title={title || t("home.weeklyFavorites", locale)}
            subtitle={subtitle || t("home.teamVerified", locale)}
            action={
              <LocalizedLink
                href={ctaHref || "/recipe"}
                className="editorial-action"
              >
                {ctaLabel || t("home.viewMore", locale)}
                <ArrowRight className="w-4 h-4" />
              </LocalizedLink>
            }
          />
        </div>

        <div className="editorial-grid-3">
          {recipes.map((recipe) => {
            const summary = recipe.summary as any;
            const difficultyLabel = getDifficultyLabel(summary?.difficulty);
            const displayTitle = isEn
              ? ensureEnglish(recipe.titleEn || recipe.titleZh, "Untitled Recipe")
              : recipe.titleZh;
            const cuisineLabel = isEn
              ? toEnglishLabel(recipe.cuisine, CUISINE_LABELS_EN, "")
              : recipe.cuisine;

            return (
              <LocalizedLink
                key={recipe.id}
                href={`/recipe/${recipe.slug || recipe.id}`}
                className="group editorial-card"
              >
                <div className="editorial-image">
                  {recipe.coverImage ? (
                    <Image
                      src={recipe.coverImage}
                      alt={displayTitle}
                      fill
                      className="editorial-image-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-textGray">
                      <ChefHat className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                </div>

                <div className="editorial-card-body editorial-card-body--lg">
                  <h3 className="font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-2">
                    {displayTitle}
                  </h3>

                  {!isEn && recipe.titleEn && (
                    <p className="text-sm text-textGray mt-2 line-clamp-1">
                      {recipe.titleEn}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-4 editorial-meta">
                    {recipe.cuisine && (
                      <span className="px-2 py-1 border border-brownWarm/40 text-brownWarm rounded-full">
                        {cuisineLabel}
                      </span>
                    )}
                    {summary?.timeTotalMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {summary.timeTotalMin} {t("recipe.minutes", locale)}
                      </span>
                    )}
                    {difficultyLabel && <span>{difficultyLabel}</span>}
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
