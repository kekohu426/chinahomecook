import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/search/route";

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockGenerateRecipe = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    recipe: {
      findMany: (...args: any[]) => mockFindMany(...args),
      create: (...args: any[]) => mockCreate(...args),
    },
  },
}));

vi.mock("@/lib/ai/generate-recipe", () => ({
  generateRecipe: (...args: any[]) => mockGenerateRecipe(...args),
}));

const sampleRecipeData = {
  schemaVersion: "1.1.0",
  titleZh: "测试菜谱",
  titleEn: "Test Recipe",
  summary: {
    oneLine: "测试简介",
    healingTone: "治愈文案",
    difficulty: "easy",
    timeTotalMin: 10,
    timeActiveMin: 5,
    servings: 2,
  },
  story: {
    title: "故事",
    content: "这是一个足够长的文化故事内容，用于通过验证。",
    tags: ["测试"],
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
  imageShots: [
    {
      key: "hero",
      imagePrompt: "test prompt",
      ratio: "16:9",
    },
  ],
};

describe("GET /api/search", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreate.mockReset();
    mockGenerateRecipe.mockReset();
  });

  it("returns 400 when query is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/search");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("returns database results when found", async () => {
    mockFindMany.mockResolvedValue([{ id: "recipe-1" }]);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=测试"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.source).toBe("database");
    expect(data.data).toHaveLength(1);
    expect(mockGenerateRecipe).not.toHaveBeenCalled();
  });

  it("does not auto-generate when autoGenerate=false", async () => {
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=测试&autoGenerate=false"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.source).toBe("database");
    expect(data.data).toHaveLength(0);
  });

  it("auto-generates when no results", async () => {
    mockFindMany.mockResolvedValue([]);
    mockGenerateRecipe.mockResolvedValue({ success: true, data: sampleRecipeData });
    mockCreate.mockResolvedValue({ id: "new-id", ...sampleRecipeData });

    const request = new NextRequest(
      "http://localhost:3000/api/search?q=测试"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.source).toBe("ai-generated");
    expect(data.data).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalled();
  });
});
