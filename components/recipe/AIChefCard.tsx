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

interface AIChefCardProps {
  recipeTitle: string;
}

export function AIChefCard({ recipeTitle }: AIChefCardProps) {
  const locale = useLocale();
  const isEn = locale === "en";
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
        throw new Error(
          isEn ? "AI service is temporarily unavailable" : "AI 服务暂时不可用"
        );
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer(
        isEn
          ? "Sorry, the AI chef can't respond right now. Please try again later."
          : "抱歉，AI 主厨暂时无法回答，请稍后再试。"
      );
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
          {isEn ? "AI Chef" : "AI 智能主厨"}
        </h3>
      </div>

      {/* 描述 */}
      <p className="text-cream/90 text-sm leading-relaxed mb-6">
        {isEn
          ? `I'm your digital chef. Ask anything about "${recipeTitle}"—for example, what to substitute if you don't have beer—and I'll guide you step by step.`
          : `我是你的数字主厨。关于这道《${recipeTitle}》，有任何问题，比如没放啤酒可以用什么代替，我都会守在灶台边为你解答。`}
      </p>

      {/* 输入框 */}
      <div className="flex gap-3 mb-4">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isEn
              ? "Example: Can I use white wine instead of beer?"
              : "例如：没放啤酒可以用白酒代替吗？"
          }
          className="flex-1 bg-white/12 border-white/25 text-white placeholder:text-white/55 focus:border-white/40 rounded-button"
          disabled={loading}
        />
        <Button
          onClick={handleAskQuestion}
          disabled={loading || !question.trim()}
          className="bg-orangeAccent hover:bg-orangeAccent/90 text-brownDark font-medium px-6 rounded-button shadow-card"
        >
          {loading ? (isEn ? "Thinking..." : "思考中...") : isEn ? "Ask Chef" : "咨询主厨"}
        </Button>
      </div>

      {/* AI 回答 */}
      {answer && (
        <div className="bg-white/10 rounded-sm p-4 border-l-4 border-orangeAccent">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">👨‍🍳</span>
            <div>
              <p className="text-sm font-medium text-orangeAccent mb-2">
                {isEn ? "Chef's advice:" : "主厨的建议："}
              </p>
              <p className="text-sm text-cream/95 leading-relaxed">{answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
