import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";
import { t } from "@/lib/i18n/translations";
import { ensureEnglish } from "@/lib/i18n/english";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Image as ImageIcon } from "lucide-react";

interface CustomRecipe {
  id: string;
  titleZh: string;
  titleEn?: string | null;
  slug?: string | null;
  summary?: any;
  coverImage?: string | null;
  location?: string | null;
  cuisine?: string | null;
  scenes?: string[] | null;
}

const SCENE_TAGS: Record<string, { emoji: string; label: string; labelEn: string; color: string }> = {
  jianfei: { emoji: "🥗", label: "减脂", labelEn: "Diet", color: "bg-green-100 text-green-700" },
  kuaishou: { emoji: "⚡", label: "快手", labelEn: "Quick", color: "bg-yellow-100 text-yellow-700" },
  jiachang: { emoji: "🍲", label: "家常", labelEn: "Home", color: "bg-blue-100 text-blue-700" },
  yanke: { emoji: "🍽️", label: "宴客", labelEn: "Feast", color: "bg-purple-100 text-purple-700" },
  zaofan: { emoji: "🍳", label: "早餐", labelEn: "Breakfast", color: "bg-orange-100 text-orange-700" },
  xiaochi: { emoji: "🥟", label: "小吃", labelEn: "Snack", color: "bg-pink-100 text-pink-700" },
};

interface CustomRecipesSectionProps {
  recipes: CustomRecipe[];
  locale?: Locale;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function CustomRecipesSection({
  recipes,
  locale = DEFAULT_LOCALE,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: CustomRecipesSectionProps) {
  const hasRecipes = recipes && recipes.length > 0;
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

  const getSceneTag = (recipe: CustomRecipe, index: number) => {
    if (recipe.scenes && recipe.scenes.length > 0) {
      for (const scene of recipe.scenes) {
        if (SCENE_TAGS[scene]) {
          return SCENE_TAGS[scene];
        }
      }
    }
    const summary = recipe.summary;
    if (summary?.timeTotalMin && summary.timeTotalMin <= 20) {
      return SCENE_TAGS["kuaishou"];
    }
    const defaultTags = ["jianfei", "kuaishou", "jiachang", "yanke"];
    return SCENE_TAGS[defaultTags[index % defaultTags.length]];
  };

  return (
    <section className="editorial-section editorial-section--cream">
      <div className="editorial-container">
        <div className="mb-10">
          <SectionHeading
            title={title || t("home.customRecipesTitle", locale)}
            subtitle={subtitle || t("home.customRecipesSubtitle", locale)}
          />
        </div>

        {hasRecipes ? (
          <>
            <div className="editorial-grid-3">
              {recipes.slice(0, 9).map((recipe, index) => {
                const difficultyLabel = getDifficultyLabel(
                  recipe.summary?.difficulty
                );
                const sceneTag = getSceneTag(recipe, index);
                const displayTitle = isEn
                  ? ensureEnglish(
                      recipe.titleEn || recipe.titleZh,
                      "Custom Recipe"
                    )
                  : recipe.titleZh;

                return (
                  <LocalizedLink
                    key={recipe.id}
                    href={`/recipe/${recipe.slug || recipe.id}`}
                    className="group editorial-card editorial-card--white"
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
                        <div className="w-full h-full flex items-center justify-center text-textGray">
                          <ImageIcon className="w-10 h-10 text-brownWarm/40" />
                        </div>
                      )}
                      {sceneTag && (
                        <span className={`absolute top-3 left-3 px-2 py-1 text-xs rounded-md font-medium ${sceneTag.color}`}>
                          {sceneTag.emoji} {isEn ? sceneTag.labelEn : sceneTag.label}
                        </span>
                      )}
                    </div>
                    <div className="editorial-card-body editorial-card-body--lg">
                      <h3 className="text-base font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-2">
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-3 editorial-meta mt-4">
                        {recipe.summary?.timeTotalMin && (
                          <span>
                            {recipe.summary.timeTotalMin}
                            {" "}{t("recipe.minutes", locale)}
                          </span>
                        )}
                        {difficultyLabel && <span>{difficultyLabel}</span>}
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>

            <div className="mt-10 flex justify-start">
              <LocalizedLink
                href={ctaHref || "/ai-custom"}
                className="editorial-link"
              >
                {ctaLabel || t("ai.wantCustomize", locale)}
              </LocalizedLink>
            </div>
          </>
        ) : (
          <div className="editorial-card editorial-card--white p-10 text-left text-textGray">
            {t("home.noCustomRecipes", locale)}
          </div>
        )}
      </div>
    </section>
  );
}
