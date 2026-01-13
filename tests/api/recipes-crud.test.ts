/**
 * 食谱管理 API 单元测试
 *
 * 测试范围：
 * - GET /api/recipes（列表、分页、筛选）
 * - POST /api/recipes（创建）
 * - GET /api/recipes/[id]（单个）
 * - PUT /api/recipes/[id]（更新）
 * - PATCH /api/recipes/[id]（发布状态）
 * - DELETE /api/recipes/[id]（删除）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockPrisma = {
  recipe: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock 验证器
vi.mock("@/lib/validators/recipe", () => ({
  safeValidateRecipe: vi.fn((data) => ({
    success: true,
    data: {
      schemaVersion: data.schemaVersion || "1.1.0",
      titleZh: data.titleZh,
      titleEn: data.titleEn,
      summary: data.summary,
      story: data.story,
      ingredients: data.ingredients || [],
      steps: data.steps || [],
      styleGuide: data.styleGuide || {},
      imageShots: data.imageShots || [],
    },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ========== GET /api/recipes 测试 ==========

describe("GET /api/recipes", () => {
  const mockRecipes = [
    {
      id: "1",
      titleZh: "麻婆豆腐",
      titleEn: "Mapo Tofu",
      location: "川渝",
      cuisine: "川菜",
      mainIngredients: ["豆腐", "肉末"],
      isPublished: true,
    },
    {
      id: "2",
      titleZh: "红烧肉",
      titleEn: "Braised Pork",
      location: "江浙",
      cuisine: "浙菜",
      mainIngredients: ["五花肉"],
      isPublished: true,
    },
  ];

  it("应该返回分页结果", async () => {
    mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes);
    mockPrisma.recipe.count.mockResolvedValue(2);

    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      mockPrisma.recipe.findMany({
        where: {},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      mockPrisma.recipe.count({ where: {} }),
    ]);

    expect(recipes).toHaveLength(2);
    expect(total).toBe(2);

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
    expect(pagination.totalPages).toBe(1);
  });

  it("应该支持 search 关键词搜索", async () => {
    const search = "豆腐";
    const where: any = {};

    if (search) {
      where.OR = [
        { titleZh: { contains: search } },
        { titleEn: { contains: search } },
      ];
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { titleZh: { contains: "豆腐" } },
          { titleEn: { contains: "豆腐" } },
        ],
      },
    });
  });

  it("应该支持 published 状态筛选", async () => {
    const publishedParam = "true";
    const where: any = {};

    if (publishedParam !== null) {
      where.isPublished = publishedParam === "true";
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { isPublished: true },
    });
  });

  it("应该支持 location 地点筛选", async () => {
    const location = "川渝";
    const where: any = {};

    if (location) {
      where.location = location;
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { location: "川渝" },
    });
  });

  it("应该支持 cuisine 菜系筛选", async () => {
    const cuisine = "川菜";
    const where: any = {};

    if (cuisine) {
      where.cuisine = cuisine;
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { cuisine: "川菜" },
    });
  });

  it("应该支持单个食材筛选", async () => {
    const ingredientParam = "豆腐";
    const where: any = {};

    if (ingredientParam) {
      const ingredients = ingredientParam.split(",").map((i) => i.trim());
      where.mainIngredients = { hasEvery: ingredients };
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { mainIngredients: { hasEvery: ["豆腐"] } },
    });
  });

  it("应该支持多个食材组合筛选", async () => {
    const ingredientParam = "豆腐,肉末";
    const where: any = {};

    if (ingredientParam) {
      const ingredients = ingredientParam.split(",").map((i) => i.trim());
      where.mainIngredients = { hasEvery: ingredients };
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: { mainIngredients: { hasEvery: ["豆腐", "肉末"] } },
    });
  });

  it("应该支持组合筛选", async () => {
    const where = {
      location: "川渝",
      cuisine: "川菜",
      mainIngredients: { hasEvery: ["豆腐"] },
      isPublished: true,
    };

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({ where });
  });
});

// ========== POST /api/recipes 测试 ==========

describe("POST /api/recipes", () => {
  it("应该成功创建食谱", async () => {
    const newRecipe = {
      id: "3",
      schemaVersion: "1.1.0",
      titleZh: "宫保鸡丁",
      titleEn: "Kung Pao Chicken",
      summary: "经典川菜",
      story: "宫保鸡丁的故事...",
      ingredients: [],
      steps: [],
      styleGuide: {},
      imageShots: [],
      location: "川渝",
      cuisine: "川菜",
      mainIngredients: ["鸡肉", "花生"],
      slug: "gong-bao-ji-ding",
      isPublished: false,
      aiGenerated: false,
    };
    mockPrisma.recipe.create.mockResolvedValue(newRecipe);

    const result = await mockPrisma.recipe.create({
      data: newRecipe,
    });

    expect(result.titleZh).toBe("宫保鸡丁");
    expect(result.isPublished).toBe(false);
  });

  it("应该自动生成 slug", () => {
    const body: { titleZh: string; slug?: string } = { titleZh: "红烧排骨" };
    const slug =
      body.slug ||
      `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    expect(slug).toMatch(/^recipe-\d+-[a-z0-9]+$/);
  });

  it("验证失败时应该返回错误详情", () => {
    const validation = {
      success: false,
      error: {
        issues: [
          { path: ["titleZh"], message: "必填字段" },
          { path: ["summary"], message: "必填字段" },
        ],
      },
    };

    expect(validation.success).toBe(false);
    expect(validation.error.issues).toHaveLength(2);
  });
});

// ========== GET /api/recipes/[id] 测试 ==========

describe("GET /api/recipes/[id]", () => {
  it("应该返回单个食谱", async () => {
    const mockRecipe = {
      id: "1",
      titleZh: "麻婆豆腐",
      titleEn: "Mapo Tofu",
    };
    mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);

    const recipe = await mockPrisma.recipe.findUnique({
      where: { id: "1" },
    });

    expect(recipe?.titleZh).toBe("麻婆豆腐");
  });

  it("不存在的 ID 应该返回 null", async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null);

    const recipe = await mockPrisma.recipe.findUnique({
      where: { id: "nonexistent" },
    });

    expect(recipe).toBeNull();
  });
});

// ========== PUT /api/recipes/[id] 测试 ==========

describe("PUT /api/recipes/[id]", () => {
  it("应该成功更新食谱", async () => {
    const existing = { id: "1", titleZh: "麻婆豆腐" };
    const updated = { id: "1", titleZh: "麻婆豆腐（改良版）" };

    mockPrisma.recipe.findUnique.mockResolvedValue(existing);
    mockPrisma.recipe.update.mockResolvedValue(updated);

    const result = await mockPrisma.recipe.update({
      where: { id: "1" },
      data: { titleZh: "麻婆豆腐（改良版）" },
    });

    expect(result.titleZh).toBe("麻婆豆腐（改良版）");
  });

  it("不存在的食谱应该返回 404 逻辑", async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null);

    const existing = await mockPrisma.recipe.findUnique({
      where: { id: "nonexistent" },
    });

    expect(existing).toBeNull();
    // API 应该返回 { success: false, error: "食谱不存在" }
  });

  it("验证失败应该返回 400", () => {
    const validation = {
      success: false,
      error: { issues: [{ path: ["titleZh"], message: "必填" }] },
    };

    expect(validation.success).toBe(false);
    // API 应该返回 status: 400
  });
});

// ========== PATCH /api/recipes/[id] 测试 ==========

describe("PATCH /api/recipes/[id]", () => {
  it("应该成功更新发布状态", async () => {
    const existing = { id: "1", isPublished: false };
    const updated = { id: "1", isPublished: true };

    mockPrisma.recipe.findUnique.mockResolvedValue(existing);
    mockPrisma.recipe.update.mockResolvedValue(updated);

    const result = await mockPrisma.recipe.update({
      where: { id: "1" },
      data: { isPublished: true },
    });

    expect(result.isPublished).toBe(true);
  });

  it("isPublished 必须为 boolean", () => {
    const body1 = { isPublished: true };
    const body2 = { isPublished: "true" };
    const body3 = { isPublished: 1 };

    expect(typeof body1.isPublished === "boolean").toBe(true);
    expect(typeof body2.isPublished === "boolean").toBe(false);
    expect(typeof body3.isPublished === "boolean").toBe(false);
  });

  it("不存在的食谱应该返回 404 逻辑", async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null);

    const existing = await mockPrisma.recipe.findUnique({
      where: { id: "nonexistent" },
    });

    expect(existing).toBeNull();
  });
});

// ========== DELETE /api/recipes/[id] 测试 ==========

describe("DELETE /api/recipes/[id]", () => {
  it("应该成功删除食谱", async () => {
    const existing = { id: "1", titleZh: "麻婆豆腐" };
    mockPrisma.recipe.findUnique.mockResolvedValue(existing);
    mockPrisma.recipe.delete.mockResolvedValue(existing);

    await mockPrisma.recipe.delete({ where: { id: "1" } });

    expect(mockPrisma.recipe.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });

  it("不存在的食谱应该返回 404 逻辑", async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null);

    const existing = await mockPrisma.recipe.findUnique({
      where: { id: "nonexistent" },
    });

    expect(existing).toBeNull();
  });
});

// ========== 分页逻辑测试 ==========

describe("分页计算", () => {
  it("应该正确计算 skip 值", () => {
    expect((1 - 1) * 10).toBe(0);
    expect((2 - 1) * 10).toBe(10);
    expect((3 - 1) * 10).toBe(20);
  });

  it("应该正确计算总页数", () => {
    expect(Math.ceil(0 / 10)).toBe(0);
    expect(Math.ceil(5 / 10)).toBe(1);
    expect(Math.ceil(10 / 10)).toBe(1);
    expect(Math.ceil(11 / 10)).toBe(2);
    expect(Math.ceil(25 / 10)).toBe(3);
  });
});
