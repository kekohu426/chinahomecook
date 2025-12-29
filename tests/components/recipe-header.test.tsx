import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import type { Recipe } from "@/types/recipe";

const baseRecipe: Recipe = {
  schemaVersion: "1.1.0",
  titleZh: "啤酒鸭",
  titleEn: "Braised Duck in Beer",
  summary: {
    oneLine: "麦香与肉脂的微醺共舞",
    healingTone: "家的味道，总在啤酒香里藏着",
    difficulty: "medium",
    timeTotalMin: 60,
    timeActiveMin: 30,
    servings: 3,
  },
  story: {
    title: "微醺时光",
    content: "故事内容",
    tags: ["家常菜"],
  },
  ingredients: [],
  steps: [],
  styleGuide: {
    theme: "治愈系暖调",
    lighting: "自然光",
    composition: "留白",
    aesthetic: "吉卜力",
  },
  imageShots: [],
};

describe("RecipeHeader", () => {
  it("renders hero image when coverImage is provided", () => {
    render(<RecipeHeader recipe={baseRecipe} coverImage="https://example.com/hero.jpg" />);
    const img = screen.getByRole("img", { name: "啤酒鸭" });
    expect(img).toHaveAttribute("src", "https://example.com/hero.jpg");
  });

  it("renders title and summary", () => {
    render(<RecipeHeader recipe={baseRecipe} coverImage={null} />);
    expect(screen.getByText("啤酒鸭")).toBeInTheDocument();
    expect(screen.getByText("麦香与肉脂的微醺共舞")).toBeInTheDocument();
  });
});
