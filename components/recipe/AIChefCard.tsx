/**
 * AIChefCard 组件
 *
 * AI 智能主厨对话框：用户可以提问关于食谱的问题
 *
 * 🚨 设计约束：100%还原设计稿
 * 参考：docs/UI_DESIGN.md - AI 智能主厨
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { t } from "@/lib/i18n/translations";

interface AIChefCardProps {
  recipeTitle: string;
}

export function AIChefCard({ recipeTitle }: AIChefCardProps) {
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/ai/chef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          recipeTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(t("ai.chefUnavailable", locale));
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer(t("ai.chefError", locale));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className="bg-brownDark text-white rounded-[18px] shadow-card p-8 mb-6 border border-brownWarm/40">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🔧</span>
        <h3 className="text-xl font-serif font-medium">
          {t("ai.chefTitle", locale)}
        </h3>
      </div>

      {/* 描述 */}
      <p className="text-cream/90 text-sm leading-relaxed mb-6">
        {t("ai.chefDescription", locale).replace("{title}", recipeTitle)}
      </p>

      {/* 输入框 */}
      <div className="flex gap-3 mb-4">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t("ai.chefPlaceholder", locale)}
          className="flex-1 bg-white/12 border-white/25 text-white placeholder:text-white/55 focus:border-white/40 rounded-button"
          disabled={loading}
        />
        <Button
          onClick={handleAskQuestion}
          disabled={loading || !question.trim()}
          className="bg-orangeAccent hover:bg-orangeAccent/90 text-brownDark font-medium px-6 rounded-button shadow-card"
        >
          {loading ? t("ai.chefThinking", locale) : t("ai.chefAsk", locale)}
        </Button>
      </div>

      {/* AI 回答 */}
      {answer && (
        <div className="bg-white/10 rounded-sm p-4 border-l-4 border-orangeAccent">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">👨‍🍳</span>
            <div>
              <p className="text-sm font-medium text-orangeAccent mb-2">
                {t("ai.chefAdvice", locale)}
              </p>
              <p className="text-sm text-cream/95 leading-relaxed">{answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
