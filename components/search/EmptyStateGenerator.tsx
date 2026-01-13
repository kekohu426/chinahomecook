"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizePath } from "@/lib/i18n/utils";

interface EmptyStateGeneratorProps {
  query: string;
}

export function EmptyStateGenerator({ query }: EmptyStateGeneratorProps) {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
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
        alert(isEn ? "Generation failed. Please try again." : "生成失败，请重试");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("生成失败:", error);
      alert(isEn ? "Generation failed. Please try again." : "生成失败，请重试");
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center py-16 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-8 max-w-md mx-auto">
        <ChefHat className="w-16 h-16 mx-auto text-sage-300 mb-6" />
        <h3 className="text-xl font-serif font-medium text-textDark mb-3">
          {isEn ? `No results for "${query}"` : `未找到 "${query}"`}
        </h3>
        <p className="text-textGray mb-8">
          {isEn
            ? "We don't have this recipe yet. Our AI chef can create it now!"
            : "我们的数据库中暂时没有这道菜。"}
          <br />
          {isEn ? "" : "不过，我们的 AI 主厨可以为您即时创作！"}
        </p>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brownWarm to-orangeAccent text-white px-6 py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isEn
                ? "Creating... (about 20s)"
                : "正在创作中 (约需20秒)..."}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {isEn ? "Generate now" : "立即生成食谱"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
