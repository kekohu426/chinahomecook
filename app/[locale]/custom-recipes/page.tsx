"use client";

import { useState, useEffect } from "react";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ChefHat,
  Loader2,
  ArrowRight,
  Check,
  AlertCircle,
  ChevronRight,
  Home,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTranslations } from "@/lib/i18n/translations";
import { containsCjk, ensureEnglish, toEnglishLabel } from "@/lib/i18n/english";
import { CUISINE_LABELS_EN, LOCATION_LABELS_EN } from "@/lib/i18n/labels";

interface Suggestion {
  name: string;
  reason: string;
}

interface CustomRecipeSummary {
  oneLine?: string;
  healingTone?: string;
  timeTotalMin?: number;
  difficulty?: string;
}

interface CustomRecipeItem {
  id: string;
  title?: string | null;
  titleZh: string;
  summary?: CustomRecipeSummary | null;
  coverImage?: string | null;
  cuisine?: string | null;
  location?: string | null;
}

type Step = "input" | "suggestions" | "generating" | "complete";

const COPY = {
  zh: {
    steps: ["输入需求", "选择食谱", "生成中"],
    breadcrumbTitle: "AI 定制食谱",
    heroTitle: "定制食谱",
    heroSubtitle: "你的专属定制食谱",
    heroDescription: "告诉我们你的需求，AI 将为你推荐并生成专属食谱。",
    cardFallback: "适合家庭复刻的定制口味。",
    needTitle: "告诉我们你的需求",
    placeholder:
      "例如：适合控糖人群的鸡肉菜谱、低热量晚餐、孩子爱吃的营养早餐...",
    examples: [
      "控糖人群可吃的鸡肉菜谱",
      "适合减脂的低热量晚餐",
      "孩子爱吃的营养早餐",
      "高蛋白健身餐",
    ],
    analyzing: "正在分析...",
    getSuggestions: "获取推荐",
    yourNeed: "你的需求：",
    recommended: "为你推荐以下食谱",
    generateThis: "生成这道菜",
    retry: "重新输入需求",
    generating: "正在生成",
    generatingDesc: "AI 正在为你制作完整食谱，包含详细步骤和配图...",
    generatingHint: "预计 30-60 秒",
    success: "食谱生成成功！",
    ready: "已为你准备好",
    viewRecipe: "查看食谱",
    continue: "继续定制",
    listTitle: "定制食谱列表",
    listDesc: "来自真实需求的定制结果，已审核可复刻。",
    loading: "加载中...",
    empty: "暂无定制食谱，快试试你的第一个需求吧。",
    reviewed: "已审核",
    minutes: "分钟",
    errorNeed: "请输入你的需求（至少2个字符）",
    errorSuggest: "获取推荐失败",
    errorGenerate: "生成食谱失败",
  },
  en: {
    steps: ["Your Needs", "Choose Recipe", "Generating"],
    breadcrumbTitle: "AI Custom Recipes",
    heroTitle: "Custom Recipes",
    heroSubtitle: "Your personalized recipes",
    heroDescription: "Tell us your needs and get personalized recipes.",
    cardFallback: "Custom flavors made easy to cook.",
    needTitle: "Tell us what you need",
    placeholder:
      "Example: low-sugar chicken recipe, low-calorie dinner, kids-friendly breakfast...",
    examples: [
      "Low-sugar chicken recipe",
      "Low-calorie dinner",
      "Kids-friendly breakfast",
      "High-protein meal",
    ],
    analyzing: "Analyzing...",
    getSuggestions: "Get suggestions",
    yourNeed: "Your need:",
    recommended: "We recommend these recipes",
    generateThis: "Generate this recipe",
    retry: "Edit your needs",
    generating: "Generating",
    generatingDesc:
      "AI is crafting the full recipe with detailed steps and images...",
    generatingHint: "Estimated 30-60 seconds",
    success: "Recipe generated!",
    ready: "is ready for you",
    viewRecipe: "View recipe",
    continue: "Keep customizing",
    listTitle: "Custom Recipe List",
    listDesc: "Real needs, reviewed and repeatable.",
    loading: "Loading...",
    empty: "No custom recipes yet. Try your first request.",
    reviewed: "Reviewed",
    minutes: "min",
    errorNeed: "Please enter at least 2 characters.",
    errorSuggest: "Failed to get suggestions",
    errorGenerate: "Failed to generate recipe",
  },
};

export default function CustomRecipesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { t } = useTranslations();
  const isEn = locale === "en";
  // Fallback to English for unsupported locales
  const copy = COPY[locale as keyof typeof COPY] || COPY.en;
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");

  // 浠?URL 璇诲彇 q 鍙傛暟棰勫～鍏呰緭鍏ユ
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setPrompt(q);
    }
  }, [searchParams]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRecipeId, setGeneratedRecipeId] = useState<string | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<CustomRecipeItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const displaySelectedRecipe = isEn
    ? ensureEnglish(selectedRecipe, "your recipe")
    : (selectedRecipe || "");
  const generatingHeading = displaySelectedRecipe
    ? `${copy.generating} "${displaySelectedRecipe}"`
    : copy.generating;
  const completedMessage = displaySelectedRecipe
    ? `"${displaySelectedRecipe}" ${copy.ready}`
    : copy.ready;

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch(`/api/custom-recipes?limit=12&locale=${locale}`);
        const data = await res.json();
        if (data.success) {
          setRecentRecipes(data.data || []);
        }
      } catch (err) {
        console.error("鍔犺浇瀹氬埗椋熻氨澶辫触:", err);
      } finally {
        setLoadingRecent(false);
      }
    }

    loadRecent();
  }, [locale]);

  // 鑾峰彇鎺ㄨ崘
  const handleGetSuggestions = async () => {
    if (!prompt.trim() || prompt.trim().length < 2) {
      setError(copy.errorNeed);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/custom-recipes/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), locale }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || copy.errorSuggest);
      }

      const normalizedSuggestions = (Array.isArray(data.suggestions) ? data.suggestions : [])
        .map((item: Suggestion, index: number) => {
          const name = typeof item?.name === "string" ? item.name.trim() : "";
          const reason = typeof item?.reason === "string" ? item.reason.trim() : "";

          if (isEn) {
            return {
              name: ensureEnglish(name, `Recipe ${index + 1}`),
              reason: ensureEnglish(reason, "Recommended for your needs."),
            };
          }

          return {
            name: name || `椋熻氨 ${index + 1}`,
            reason,
          };
        })
        .filter((item: Suggestion) => item.name.length > 0);

      if (normalizedSuggestions.length === 0) {
        throw new Error(copy.errorSuggest);
      }

      setSuggestions(normalizedSuggestions);
      setStep("suggestions");
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.errorSuggest;
      setError(isEn && containsCjk(message) ? copy.errorSuggest : message);
    } finally {
      setLoading(false);
    }
  };

  // 鐢熸垚椋熻氨
  const handleGenerateRecipe = async (recipeName: string) => {
    setSelectedRecipe(recipeName);
    setStep("generating");
    setError(null);

    try {
      const res = await fetch("/api/custom-recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeName,
          customPrompt: prompt.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || copy.errorGenerate);
      }

      // API 杩斿洖 taskId 鍜?redirectUrl锛岃烦杞埌杩涘害椤甸潰
      if (data.taskId) {
        router.push(`/${locale}/custom-recipes/progress/${data.taskId}`);
      } else {
        throw new Error("鏈幏鍙栧埌浠诲姟ID");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.errorGenerate;
      setError(isEn && containsCjk(message) ? copy.errorGenerate : message);
      setStep("suggestions");
    }
  };

  // Reset flow state
  const handleReset = () => {
    setStep("input");
    setPrompt("");
    setSuggestions([]);
    setSelectedRecipe(null);
    setError(null);
    setGeneratedRecipeId(null);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* 椤甸潰鏍囬鍖?*/}
      <div className="bg-gradient-to-br from-brownWarm via-orangeAccent/60 to-cream text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* 闈㈠寘灞戝鑸?*/}
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
            <LocalizedLink href="/" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">
              {copy.breadcrumbTitle}
            </span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <ChefHat className="w-12 h-12" />
            <h1 className="text-5xl font-serif font-medium">
              {copy.heroTitle}
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            {copy.heroSubtitle}
          </p>
          <p className="text-white/70 text-sm mt-2">
            {copy.heroDescription}
          </p>
        </div>
      </div>

      {/* 涓诲唴瀹?*/}
      <main className="max-w-3xl mx-auto px-8 py-16">
        {/* 姝ラ鎸囩ず鍣?*/}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { key: "input", label: copy.steps[0] },
            { key: "suggestions", label: copy.steps[1] },
            { key: "generating", label: copy.steps[2] },
          ].map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s.key
                    ? "bg-brownWarm text-white"
                    : step === "complete" ||
                      (step === "suggestions" && s.key === "input") ||
                      (step === "generating" && s.key !== "generating")
                    ? "bg-green-500 text-white"
                    : "bg-sage-200 text-sage-500"
                }`}
              >
                {(step === "complete" ||
                  (step === "suggestions" && s.key === "input") ||
                  (step === "generating" && s.key !== "generating")) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm ${
                  step === s.key ? "text-brownWarm font-medium" : "text-sage-500"
                }`}
              >
                {s.label}
              </span>
              {index < 2 && (
                <div className="w-12 h-px bg-sage-200 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* 閿欒鎻愮ず */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: 杈撳叆闇€姹?*/}
        {step === "input" && (
          <div className="bg-white rounded-2xl shadow-card p-8">
            <h2 className="text-2xl font-serif font-medium text-textDark mb-6">
              {copy.needTitle}
            </h2>

            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={copy.placeholder}
                className="w-full px-4 py-4 border border-sage-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brownWarm/30"
                rows={4}
              />

              <div className="flex flex-wrap gap-2">
                {copy.examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1.5 text-sm bg-sage-100 text-sage-700 rounded-full hover:bg-sage-200 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGetSuggestions}
                disabled={loading || !prompt.trim()}
                className="w-full py-4 bg-brownWarm text-white rounded-xl hover:bg-brownDark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-lg font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {copy.analyzing}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {copy.getSuggestions}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 閫夋嫨椋熻氨 */}
        {step === "suggestions" && (
          <div className="space-y-6">
            <div className="bg-sage-50 rounded-xl p-4 mb-6">
              <p className="text-sage-700">
                <span className="font-medium">{copy.yourNeed}</span> {prompt}
              </p>
            </div>

            <h2 className="text-2xl font-serif font-medium text-textDark">
              {copy.recommended}
            </h2>

            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-medium text-textDark mb-2">
                        {suggestion.name}
                      </h3>
                      <p className="text-textGray">{suggestion.reason}</p>
                    </div>
                    <button
                      onClick={() => handleGenerateRecipe(suggestion.name)}
                      className="px-6 py-3 bg-brownWarm text-white rounded-full hover:bg-brownDark transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                      {copy.generateThis}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 text-sage-600 hover:text-sage-800 transition-colors"
            >
              {copy.retry}
            </button>
          </div>
        )}

        {/* Step 3: 鐢熸垚涓?*/}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-brownWarm/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-brownWarm animate-spin" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-textDark mb-4">
              {generatingHeading}
            </h2>
            <p className="text-textGray mb-2">
              {copy.generatingDesc}
            </p>
            <p className="text-sm text-sage-400">{copy.generatingHint}</p>
          </div>
        )}

        {/* Step 4: 瀹屾垚 */}
        {step === "complete" && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-textDark mb-4">
              {copy.success}
            </h2>
            <p className="text-textGray mb-8">
              {completedMessage}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LocalizedLink
                href={`/recipe/${generatedRecipeId}`}
                className="px-8 py-4 bg-brownWarm text-white rounded-xl hover:bg-brownDark transition-colors text-lg font-medium"
              >
                {copy.viewRecipe}
              </LocalizedLink>
              <button
                onClick={handleReset}
                className="px-8 py-4 border border-sage-200 text-sage-700 rounded-xl hover:border-sage-400 transition-colors"
              >
                {copy.continue}
              </button>
            </div>
          </div>
        )}
      </main>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-medium text-textDark">
                {copy.listTitle}
              </h2>
              <p className="text-textGray mt-1">
                {copy.listDesc}
              </p>
            </div>
          </div>

          {loadingRecent ? (
            <div className="text-center text-textGray">{copy.loading}</div>
          ) : recentRecipes.length === 0 ? (
            <div className="text-center text-textGray">
              {copy.empty}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentRecipes.map((recipe) => {
                const localizedTitle = recipe.title || recipe.titleZh;
                const displayTitle = isEn
                  ? ensureEnglish(localizedTitle, "Custom Recipe")
                  : localizedTitle;
                const displayOneLine = recipe.summary?.oneLine
                  ? isEn
                    ? ensureEnglish(recipe.summary.oneLine, "")
                    : recipe.summary.oneLine
                  : "";
                const displayHealing = recipe.summary?.healingTone
                  ? isEn
                    ? ensureEnglish(recipe.summary.healingTone, "")
                    : recipe.summary.healingTone
                  : "";
                const displayCuisine = recipe.cuisine
                  ? isEn
                    ? toEnglishLabel(recipe.cuisine, CUISINE_LABELS_EN, "")
                    : recipe.cuisine
                  : null;
                const displayLocation = recipe.location
                  ? isEn
                    ? toEnglishLabel(recipe.location, LOCATION_LABELS_EN, "")
                    : recipe.location
                  : null;
                const displayDifficulty = (() => {
                  const value = recipe.summary?.difficulty;
                  if (!value) return null;
                  if (value === "easy") return t("recipe.easy");
                  if (value === "medium") return t("recipe.medium");
                  if (value === "hard") return t("recipe.hard");
                  return isEn ? ensureEnglish(value, "") : value;
                })();
                return (
                <LocalizedLink
                  key={recipe.id}
                  href={`/recipe/${recipe.id}`}
                  className="group bg-cream rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-lightGray">
                    {recipe.coverImage ? (
                      <Image
                        src={recipe.coverImage}
                        alt={displayTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-textGray">
                        <span className="text-3xl">馃嵅</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-1">
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-textGray mt-2 line-clamp-2">
                      {displayOneLine || displayHealing || copy.cardFallback}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-textGray mt-3">
                      {recipe.summary?.timeTotalMin && (
                        <span>
                          鈴憋笍 {recipe.summary.timeTotalMin} {copy.minutes}
                        </span>
                      )}
                      {displayDifficulty && (
                        <span>馃敟 {displayDifficulty}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-textGray">
                      {displayCuisine && (
                        <span className="px-2 py-0.5 bg-white rounded-full">
                          {displayCuisine}
                        </span>
                      )}
                      {displayLocation && (
                        <span className="px-2 py-0.5 bg-white rounded-full">
                          {displayLocation}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-white rounded-full">
                        {copy.reviewed}
                      </span>
                    </div>
                  </div>
                </LocalizedLink>
              );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}


