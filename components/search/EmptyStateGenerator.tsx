"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizePath } from "@/lib/i18n/utils";
import { useTranslations } from "@/lib/i18n/translations";

interface EmptyStateGeneratorProps {
  query: string;
}

export function EmptyStateGenerator({ query }: EmptyStateGeneratorProps) {
  const router = useRouter();
  const locale = useLocale();
  const { t } = useTranslations();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName: query,
          autoSave: true,
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.id) {
        // 跳转到新生成的菜谱页
        router.push(localizePath(`/recipe/${data.data.id}`, locale));
      } else {
        alert(t("ai.generateFailed"));
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("生成失败:", error);
      alert(t("ai.generateFailed"));
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center py-16 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-8 max-w-md mx-auto">
        <ChefHat className="w-16 h-16 mx-auto text-sage-300 mb-6" />
        <h3 className="text-xl font-serif font-medium text-textDark mb-3">
          {t("search.noResultsFor")} &quot;{query}&quot;
        </h3>
        <p className="text-textGray mb-8">
          {t("ai.aiChefTip")}
        </p>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brownWarm to-orangeAccent text-white px-6 py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("status.generating")}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t("ai.generateNow")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
