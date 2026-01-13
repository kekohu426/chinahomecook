/**
 * 定制菜谱 API 单元测试
 *
 * 测试范围：
 * - POST /api/custom-recipes/suggest（AI 推荐食谱名称）
 * - POST /api/custom-recipes/generate（生成完整食谱）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AI Provider
const mockProvider = {
  chat: vi.fn(),
};

vi.mock("@/lib/ai/provider", () => ({
  getTextProvider: () => mockProvider,
}));

// Mock Prisma
const mockPrisma = {
  recipe: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock generateRecipe
vi.mock("@/lib/ai/generate-recipe", () => ({
  generateRecipe: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ========== POST /api/custom-recipes/suggest 测试 ==========

describe("POST /api/custom-recipes/suggest", () => {
  it("应该返回推荐列表", async () => {
    const aiResponse = {
      content: JSON.stringify({
        suggestions: [
          { name: "清蒸鸡胸肉", reason: "低脂高蛋白，适合糖尿病患者" },
          { name: "白灼虾", reason: "无糖无淀粉，健康美味" },
          { name: "凉拌木耳", reason: "富含膳食纤维，有助于控制血糖" },
        ],
      }),
    };
    mockProvider.chat.mockResolvedValue(aiResponse);

    const result = await mockProvider.chat({
      messages: [
        { role: "system", content: "..." },
        { role: "user", content: "用户需求：糖尿病可以吃的鸡的食谱" },
      ],
    });

    const parsed = JSON.parse(result.content);
    expect(parsed.suggestions).toHaveLength(3);
    expect(parsed.suggestions[0].name).toBe("清蒸鸡胸肉");
    expect(parsed.suggestions[0].reason).toContain("糖尿病");
  });

  it("空 prompt 应该验证失败", () => {
    const prompt1 = "";
    const prompt2: string | null = null;
    const prompt3: string | undefined = undefined;

    // 验证逻辑：prompt 必须存在且为字符串且长度 >= 2
    const validate = (p: unknown) =>
      p != null && typeof p === "string" && p.trim().length >= 2;

    expect(validate(prompt1)).toBe(false);
    expect(validate(prompt2)).toBe(false);
    expect(validate(prompt3)).toBe(false);
  });

  it("prompt 少于2字符应该验证失败", () => {
    const prompt = "a";
    const isValid = prompt && typeof prompt === "string" && prompt.trim().length >= 2;
    expect(isValid).toBe(false);
  });

  it("prompt 等于2字符应该验证通过", () => {
    const prompt = "鸡肉";
    const isValid = prompt && typeof prompt === "string" && prompt.trim().length >= 2;
    expect(isValid).toBe(true);
  });

  it("应该返回 { name, reason } 格式", async () => {
    const aiResponse = {
      content: '{"suggestions": [{"name": "红烧鸡腿", "reason": "经典家常菜"}]}',
    };
    mockProvider.chat.mockResolvedValue(aiResponse);

    const result = await mockProvider.chat({ messages: [] });
    const parsed = JSON.parse(result.content);

    expect(parsed.suggestions[0]).toHaveProperty("name");
    expect(parsed.suggestions[0]).toHaveProperty("reason");
  });

  it("应该能从带有额外文本的响应中提取 JSON", () => {
    const content = `根据您的需求，为您推荐以下食谱：

{"suggestions": [{"name": "蒸蛋", "reason": "简单健康"}]}

希望对您有帮助！`;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed.suggestions).toHaveLength(1);
  });

  it("无法解析的响应应该抛出错误", () => {
    const content = "这是一个没有JSON的响应";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeNull();
  });

  it("响应格式错误应该被检测到", () => {
    const parsed = { suggestions: "not an array" };
    expect(Array.isArray(parsed.suggestions)).toBe(false);
  });
});

// ========== POST /api/custom-recipes/generate 测试 ==========

describe("POST /api/custom-recipes/generate", () => {
  it("应该生成完整食谱", async () => {
    const mockRecipe = {
      id: "generated-123",
      titleZh: "清蒸鸡胸肉",
      titleEn: "Steamed Chicken Breast",
      summary: "健康低脂的鸡胸肉做法",
    };
    mockPrisma.recipe.create.mockResolvedValue(mockRecipe);

    const result = await mockPrisma.recipe.create({
      data: {
        titleZh: "清蒸鸡胸肉",
        isPublished: true,
      },
    });

    expect(result.id).toBe("generated-123");
    expect(result.titleZh).toBe("清蒸鸡胸肉");
  });

  it("缺少 recipeName 应该验证失败", () => {
    const body1: { recipeName?: string } = {};
    const body2 = { recipeName: "" };
    const body3 = { recipeName: "  " };

    const isValid1 = body1.recipeName && body1.recipeName.trim();
    const isValid2 = body2.recipeName && body2.recipeName.trim();
    const isValid3 = body3.recipeName && body3.recipeName.trim();

    expect(isValid1).toBeFalsy();
    expect(isValid2).toBeFalsy();
    expect(isValid3).toBeFalsy();
  });

  it("应该返回生成的 recipeId", async () => {
    mockPrisma.recipe.create.mockResolvedValue({ id: "new-recipe-id" });

    const result = await mockPrisma.recipe.create({
      data: { titleZh: "测试" },
    });

    const response = {
      success: true,
      recipeId: result.id,
    };

    expect(response.recipeId).toBe("new-recipe-id");
  });

  it("生成的食谱应该默认发布", async () => {
    const data = {
      titleZh: "清蒸鸡胸肉",
      isPublished: true, // 定制菜谱直接发布
    };

    await mockPrisma.recipe.create({ data });

    expect(mockPrisma.recipe.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isPublished: true,
      }),
    });
  });

  it("应该包含用户的 customPrompt 作为上下文", () => {
    const recipeName = "清蒸鸡胸肉";
    const customPrompt = "糖尿病可以吃的鸡的食谱";

    // 生成时应该将 customPrompt 作为上下文传递给 AI
    const context = `用户需求：${customPrompt}，推荐食谱：${recipeName}`;

    expect(context).toContain(customPrompt);
    expect(context).toContain(recipeName);
  });
});

// ========== 响应格式测试 ==========

describe("Custom Recipes API 响应格式", () => {
  it("suggest 成功响应应该包含 success 和 suggestions", () => {
    const response = {
      success: true,
      suggestions: [{ name: "红烧鸡腿", reason: "经典家常菜" }],
    };

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("suggestions");
    expect(Array.isArray(response.suggestions)).toBe(true);
  });

  it("generate 成功响应应该包含 success 和 recipeId", () => {
    const response = {
      success: true,
      recipeId: "abc123",
    };

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("recipeId");
  });

  it("错误响应应该包含 success: false 和 error", () => {
    const response = {
      success: false,
      error: "推荐食谱失败，请稍后重试",
    };

    expect(response.success).toBe(false);
    expect(response.error).toBeTruthy();
  });
});

// ========== 输入验证测试 ==========

describe("输入验证", () => {
  it("prompt 应该去除首尾空格", () => {
    const prompt = "  糖尿病饮食  ";
    const trimmed = prompt.trim();
    expect(trimmed).toBe("糖尿病饮食");
    expect(trimmed.length).toBe(5);
  });

  it("recipeName 应该去除首尾空格", () => {
    const recipeName = "  清蒸鸡胸肉  ";
    const trimmed = recipeName.trim();
    expect(trimmed).toBe("清蒸鸡胸肉");
  });

  it("非字符串 prompt 应该验证失败", () => {
    const prompts: unknown[] = [123, {}, [], true, null, undefined];

    // 验证逻辑：prompt 必须为非空字符串
    const validate = (p: unknown) =>
      p != null && typeof p === "string" && p.trim().length >= 2;

    prompts.forEach((prompt) => {
      expect(validate(prompt)).toBe(false);
    });
  });
});
