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
    needTitle: "告诉我们您的需求",
    placeholder:
      "例如：糖尿病可以吃的鸡的食谱、适合减肥的低热量晚餐、小孩爱吃的营养早餐...",
    examples: [
      "糖尿病可以吃的鸡的食谱",
      "适合减肥的低热量晚餐",
      "小孩爱吃的营养早餐",
      "高蛋白健身餐",
    ],
    analyzing: "正在分析...",
    getSuggestions: "获取推荐",
    yourNeed: "您的需求：",
    recommended: "为您推荐以下食谱",
    generateThis: "生成这道菜",
    retry: "重新输入需求",
    generating: "正在生成",
    generatingDesc: "AI 正在为您精心制作这道食谱，包括详细步骤和配图...",
    generatingHint: "预计需要 30-60 秒",
    success: "食谱生成成功！",
    ready: "已为您准备好",
    viewRecipe: "查看食谱",
    continue: "继续定制",
    listTitle: "定制食谱列表",
    listDesc: "来自真实需求的定制结果，已审核可复现。",
    loading: "加载中...",
    empty: "暂无定制食谱，快试试你的第一个需求吧。",
    reviewed: "已审核",
    minutes: "分钟",
    errorNeed: "请输入您的需求（至少2个字符）",
    errorSuggest: "获取推荐失败",
    errorGenerate: "生成食谱失败",
  },
  en: {
    steps: ["Your Needs", "Choose Recipe", "Generating"],
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
    generatingHint: "Estimated 30–60 seconds",
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
  // Fallback to English for unsupported locales
  const copy = COPY[locale as keyof typeof COPY] || COPY.en;
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");

  // 从 URL 读取 q 参数预填充输入框
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

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch(`/api/custom-recipes?limit=12&locale=${locale}`);
        const data = await res.json();
        if (data.success) {
          setRecentRecipes(data.data || []);
        }
      } catch (err) {
        console.error("加载定制食谱失败:", err);
      } finally {
        setLoadingRecent(false);
      }
    }

    loadRecent();
  }, [locale]);

  // 获取推荐
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
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || copy.errorSuggest);
      }

      setSuggestions(data.suggestions);
      setStep("suggestions");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errorSuggest);
    } finally {
      setLoading(false);
    }
  };

  // 生成食谱
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

      setGeneratedRecipeId(data.recipeId);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errorGenerate);
      setStep("suggestions");
    }
  };

  // 重新开始
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

      {/* 页面标题区 */}
      <div className="bg-gradient-to-br from-brownWarm via-orangeAccent/60 to-cream text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* 面包屑导航 */}
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
            <LocalizedLink href="/" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </LocalizedLink>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">
              {locale === "en" ? "AI Custom Recipes" : "AI 定制食谱"}
            </span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <ChefHat className="w-12 h-12" />
            <h1 className="text-5xl font-serif font-medium">
              {locale === "en" ? "Custom Recipes" : "定制菜谱"}
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            {locale === "en" ? "Custom Recipes" : "Custom Recipes"}
          </p>
          <p className="text-white/70 text-sm mt-2">
            {locale === "en"
              ? "Tell us your needs and get personalized recipes."
              : "告诉我们您的需求，AI 为您推荐并生成专属食谱"}
          </p>
        </div>
      </div>

      {/* 主内容 */}
      <main className="max-w-3xl mx-auto px-8 py-16">
        {/* 步骤指示器 */}
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

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: 输入需求 */}
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

        {/* Step 2: 选择食谱 */}
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

        {/* Step 3: 生成中 */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-brownWarm/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-brownWarm animate-spin" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-textDark mb-4">
              {copy.generating}《{selectedRecipe}》
            </h2>
            <p className="text-textGray mb-2">
              {copy.generatingDesc}
            </p>
            <p className="text-sm text-sage-400">{copy.generatingHint}</p>
          </div>
        )}

        {/* Step 4: 完成 */}
        {step === "complete" && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-textDark mb-4">
              {copy.success}
            </h2>
            <p className="text-textGray mb-8">
              《{selectedRecipe}》{copy.ready}
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
              {recentRecipes.map((recipe) => (
                <LocalizedLink
                  key={recipe.id}
                  href={`/recipe/${recipe.id}`}
                  className="group bg-cream rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-lightGray">
                    {recipe.coverImage ? (
                      <Image
                        src={recipe.coverImage}
                        alt={recipe.titleZh}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-textGray">
                        <span className="text-3xl">🍲</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-1">
                      {recipe.titleZh}
                    </h3>
                    <p className="text-xs text-textGray mt-2 line-clamp-2">
                      {recipe.summary?.oneLine ||
                        recipe.summary?.healingTone ||
                        (locale === "en"
                          ? "Custom flavors made easy to cook."
                          : "适合家常复现的定制口味。")}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-textGray mt-3">
                      {recipe.summary?.timeTotalMin && (
                        <span>
                          ⏱️ {recipe.summary.timeTotalMin} {copy.minutes}
                        </span>
                      )}
                      {recipe.summary?.difficulty && (
                        <span>🔥 {recipe.summary.difficulty}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-textGray">
                      {recipe.cuisine && (
                        <span className="px-2 py-0.5 bg-white rounded-full">
                          {recipe.cuisine}
                        </span>
                      )}
                      {recipe.location && (
                        <span className="px-2 py-0.5 bg-white rounded-full">
                          {recipe.location}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-white rounded-full">
                        {copy.reviewed}
                      </span>
                    </div>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
