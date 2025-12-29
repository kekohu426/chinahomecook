import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import type { Recipe } from "@/types/recipe";

const recipe: Recipe = {
  schemaVersion: "1.1.0",
  titleZh: "番茄炒蛋",
  titleEn: "Tomato Egg",
  summary: {
    oneLine: "酸甜交织的家常温暖",
    healingTone: "温柔治愈",
    difficulty: "easy",
    timeTotalMin: 15,
    timeActiveMin: 10,
    servings: 2,
  },
  story: {
    title: "小故事",
    content: "这是一段足够长的故事内容用于测试。",
    tags: ["家常菜"],
  },
  ingredients: [
    {
      section: "主料",
      items: [
        {
          name: "鸡蛋",
          iconKey: "egg",
          amount: 2,
          unit: "个",
          notes: null,
        },
      ],
    },
  ],
  steps: [
    {
      id: "step01",
      title: "准备",
      action: "准备食材。",
      speechText: "准备食材。",
      timerSec: 0,
      visualCue: "食材齐全。",
      failPoint: "火太大。",
      photoBrief: "食材摆盘。",
    },
  ],
  styleGuide: {
    theme: "治愈系",
    lighting: "自然光",
    composition: "留白",
    aesthetic: "日杂风",
  },
  imageShots: [],
};

describe("RecipeHeader", () => {
  it("renders hero image when coverImage provided", () => {
    render(<RecipeHeader recipe={recipe} coverImage="https://example.com/hero.jpg" />);

    const image = screen.getByRole("img", { name: "番茄炒蛋" });
    expect(image).toHaveAttribute("src", "https://example.com/hero.jpg");
  });

  it("renders fallback background when coverImage missing", () => {
    render(<RecipeHeader recipe={recipe} coverImage={null} />);

    expect(screen.queryByRole("img", { name: "番茄炒蛋" })).not.toBeInTheDocument();
  });
});
