import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { DIFFICULTY_TO_LABEL } from "@/types/recipe";

interface CustomRecipe {
  id: string;
  titleZh: string;
  slug?: string | null;
  summary?: any;
  coverImage?: string | null;
  location?: string | null;
  cuisine?: string | null;
  scenes?: string[] | null;
}

// 场景标签映射（彩色标签）
const SCENE_TAGS: Record<string, { emoji: string; label: string; labelEn: string; color: string }> = {
  "jianfei": { emoji: "🎯", label: "减脂", labelEn: "Diet", color: "bg-green-100 text-green-700" },
  "kuaishou": { emoji: "⚡", label: "快手", labelEn: "Quick", color: "bg-yellow-100 text-yellow-700" },
  "jiachang": { emoji: "🏠", label: "家常", labelEn: "Home", color: "bg-blue-100 text-blue-700" },
  "yanke": { emoji: "🍽️", label: "宴客", labelEn: "Feast", color: "bg-purple-100 text-purple-700" },
  "zaofan": { emoji: "☀️", label: "早餐", labelEn: "Breakfast", color: "bg-orange-100 text-orange-700" },
  "xiaochi": { emoji: "🍡", label: "小吃", labelEn: "Snack", color: "bg-pink-100 text-pink-700" },
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
      if (value === "easy") return "Easy";
      if (value === "medium") return "Medium";
      if (value === "hard") return "Hard";
      return value;
    }
    return DIFFICULTY_TO_LABEL[value as keyof typeof DIFFICULTY_TO_LABEL] || value;
  };

  // 获取食谱的场景标签
  const getSceneTag = (recipe: CustomRecipe, index: number) => {
    // 尝试从 scenes 数组中获取
    if (recipe.scenes && recipe.scenes.length > 0) {
      for (const scene of recipe.scenes) {
        if (SCENE_TAGS[scene]) {
          return SCENE_TAGS[scene];
        }
      }
    }
    // 根据食谱特点推断标签
    const summary = recipe.summary;
    if (summary?.timeTotalMin && summary.timeTotalMin <= 20) {
      return SCENE_TAGS["kuaishou"];
    }
    // 默认按索引分配标签
    const defaultTags = ["jianfei", "kuaishou", "jiachang", "yanke"];
    return SCENE_TAGS[defaultTags[index % defaultTags.length]];
  };

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-8">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {title ||
              (locale === "en"
                ? "See What Others Have Customized"
                : "看看别人都定制了什么")}
          </h2>
          <p className="text-textGray mt-2">
            {subtitle ||
              (locale === "en"
                ? "From diet meals to quick dishes, AI has helped 10,000+ people find answers."
                : "从减脂餐到快手菜，AI 已帮助 10,000+ 人找到答案。")}
          </p>
        </div>

        {hasRecipes ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recipes.slice(0, 8).map((recipe, index) => {
                const difficultyLabel = getDifficultyLabel(
                  recipe.summary?.difficulty
                );
                const sceneTag = getSceneTag(recipe, index);
                return (
                  <LocalizedLink
                    key={recipe.id}
                    href={`/recipe/${recipe.slug || recipe.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-lightGray">
                      {recipe.coverImage ? (
                        <Image
                          src={recipe.coverImage}
                          alt={recipe.titleZh}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-textGray">
                          <span className="text-3xl">🍲</span>
                        </div>
                      )}
                      {/* 彩色场景标签 */}
                      {sceneTag && (
                        <span className={`absolute top-3 left-3 px-2 py-1 text-xs rounded-md font-medium ${sceneTag.color}`}>
                          {sceneTag.emoji} {isEn ? sceneTag.labelEn : sceneTag.label}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-1">
                        {recipe.titleZh}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-textGray mt-3">
                        {recipe.summary?.timeTotalMin && (
                          <span>
                            ⏱️ {recipe.summary.timeTotalMin}
                            {isEn ? " min" : " 分钟"}
                          </span>
                        )}
                        {difficultyLabel && (
                          <span>
                            {difficultyLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>

            {/* CTA 按钮 */}
            <div className="mt-10 flex justify-center">
              <LocalizedLink
                href={ctaHref || "/ai-custom"}
                className="px-8 py-4 border-2 border-brownWarm text-brownWarm rounded-lg font-medium hover:bg-brownWarm hover:text-white transition-colors"
              >
                {ctaLabel || (locale === "en" ? "I Want to Customize Too →" : "我也要定制 →")}
              </LocalizedLink>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-cream shadow-card p-10 text-center text-textGray">
            {locale === "en"
              ? "No custom recipes yet. Create your first one."
              : "暂无定制食谱，欢迎创建你的第一道专属菜谱。"}
          </div>
        )}
      </div>
    </section>
  );
}
