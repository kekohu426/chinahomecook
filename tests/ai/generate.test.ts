/**
 * AI生成服务清洗与规范化测试
 */

import { describe, it, expect } from "vitest";
import { cleanAIResponse, normalizeRecipeData } from "@/lib/ai/generate-recipe";

describe("cleanAIResponse", () => {
  it("removes markdown fences", () => {
    const input = "```json\n{\"ok\":true}\n```";
    const cleaned = cleanAIResponse(input);
    expect(cleaned).toBe('{"ok":true}');
  });

  it("quotes unquoted amount/unit/notes values", () => {
    const input = `{\n  "ingredients": [\n    {\n      "section": "主料",\n      "items": [\n        {\n          "name": "盐",\n          "iconKey": "spice",\n          "amount": 适量,\n          "unit": 适量,\n          "notes": 少许\n        }\n      ]\n    }\n  ]\n}`;
    const cleaned = cleanAIResponse(input);
    const parsed = JSON.parse(cleaned);
    const item = parsed.ingredients[0].items[0];
    expect(item.amount).toBe("适量");
    expect(item.unit).toBe("适量");
    expect(item.notes).toBe("少许");
  });
});

describe("normalizeRecipeData", () => {
  it("converts numeric strings to numbers", () => {
    const data = {
      summary: { timeTotalMin: "10", timeActiveMin: "5", servings: "2" },
      ingredients: [
        {
          section: "主料",
          items: [{ name: "盐", iconKey: "spice", amount: "2.5", unit: "克" }],
        },
      ],
      steps: [{ timerSec: "60" }],
    };

    const normalized = normalizeRecipeData(data);
    expect(normalized.summary.timeTotalMin).toBe(10);
    expect(normalized.ingredients[0].items[0].amount).toBe(2.5);
    expect(normalized.steps[0].timerSec).toBe(60);
  });

  it("maps non-numeric amount to 1 and keeps unit", () => {
    const data = {
      ingredients: [
        {
          section: "主料",
          items: [{ name: "盐", iconKey: "spice", amount: "适量", unit: "适量" }],
        },
      ],
    };

    const normalized = normalizeRecipeData(data);
    expect(normalized.ingredients[0].items[0].amount).toBe(1);
    expect(normalized.ingredients[0].items[0].unit).toBe("适量");
  });

  it("fills unit when amount is a label and unit missing", () => {
    const data = {
      ingredients: [
        {
          section: "主料",
          items: [{ name: "盐", iconKey: "spice", amount: "适量" }],
        },
      ],
    };

    const normalized = normalizeRecipeData(data);
    expect(normalized.ingredients[0].items[0].amount).toBe(1);
    expect(normalized.ingredients[0].items[0].unit).toBe("适量");
  });
});
