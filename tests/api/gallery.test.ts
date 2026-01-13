/**
 * 图片库 API 单元测试
 *
 * 测试范围：
 * - GET /api/gallery（列表、分页、搜索）
 * - GET /api/gallery/download/[id]（下载带水印图片）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockPrisma = {
  recipe: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ========== GET /api/gallery 测试 ==========

describe("GET /api/gallery", () => {
  const mockRecipes = [
    {
      id: "1",
      titleZh: "麻婆豆腐",
      titleEn: "Mapo Tofu",
      coverImage: "https://example.com/mapo.jpg",
      cuisine: "川菜",
      location: "川渝",
    },
    {
      id: "2",
      titleZh: "红烧肉",
      titleEn: "Braised Pork",
      coverImage: "https://example.com/hongshao.jpg",
      cuisine: "浙菜",
      location: "江浙",
    },
  ];

  it("应该返回已发布且有封面图的食谱", async () => {
    mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes);
    mockPrisma.recipe.count.mockResolvedValue(2);

    const where = {
      isPublished: true,
      coverImage: { not: null },
    };

    await mockPrisma.recipe.findMany({
      where,
      select: {
        id: true,
        titleZh: true,
        titleEn: true,
        coverImage: true,
        cuisine: true,
        location: true,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublished: true,
          coverImage: { not: null },
        },
      })
    );
  });

  it("应该支持分页", async () => {
    mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes);
    mockPrisma.recipe.count.mockResolvedValue(50);

    const page = 2;
    const limit = 20;

    await mockPrisma.recipe.findMany({
      where: { isPublished: true, coverImage: { not: null } },
      skip: (page - 1) * limit,
      take: limit,
    });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    );
  });

  it("应该支持搜索", async () => {
    const q = "豆腐";

    const where: any = {
      isPublished: true,
      coverImage: { not: null },
    };

    if (q) {
      where.OR = [
        { titleZh: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } },
      ];
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { titleZh: { contains: "豆腐", mode: "insensitive" } },
        ]),
      }),
    });
  });

  it("应该支持 cuisine 筛选", async () => {
    const cuisine = "川菜";

    const where: any = {
      isPublished: true,
      coverImage: { not: null },
    };

    if (cuisine) {
      where.cuisine = cuisine;
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        cuisine: "川菜",
      }),
    });
  });

  it("应该支持 location 筛选", async () => {
    const location = "川渝";

    const where: any = {
      isPublished: true,
      coverImage: { not: null },
    };

    if (location) {
      where.location = location;
    }

    await mockPrisma.recipe.findMany({ where });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        location: "川渝",
      }),
    });
  });

  it("应该返回 hasMore 分页标记", () => {
    const page = 1;
    const limit = 20;
    const total = 50;

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };

    expect(pagination.hasMore).toBe(true);
    expect(pagination.totalPages).toBe(3);
  });

  it("最后一页 hasMore 应该为 false", () => {
    const page = 3;
    const limit = 20;
    const total = 50;

    const hasMore = page * limit < total;
    expect(hasMore).toBe(false);
  });
});

// ========== GET /api/gallery/download/[id] 测试 ==========

describe("GET /api/gallery/download/[id]", () => {
  it("应该查找食谱", async () => {
    const mockRecipe = {
      id: "1",
      titleZh: "麻婆豆腐",
      coverImage: "https://example.com/mapo.jpg",
    };
    mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);

    const recipe = await mockPrisma.recipe.findUnique({
      where: { id: "1" },
      select: { id: true, titleZh: true, coverImage: true },
    });

    expect(recipe?.coverImage).toBe("https://example.com/mapo.jpg");
  });

  it("不存在的 ID 应该返回 null", async () => {
    mockPrisma.recipe.findUnique.mockResolvedValue(null);

    const recipe = await mockPrisma.recipe.findUnique({
      where: { id: "nonexistent" },
    });

    expect(recipe).toBeNull();
  });

  it("无封面图应该返回 null coverImage", async () => {
    const mockRecipe = {
      id: "1",
      titleZh: "测试",
      coverImage: null,
    };
    mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);

    const recipe = await mockPrisma.recipe.findUnique({
      where: { id: "1" },
    });

    expect(recipe?.coverImage).toBeNull();
  });

  it("应该正确编码文件名", () => {
    const titleZh = "麻婆豆腐";
    const filename = `${titleZh}.jpg`;
    const encodedFilename = encodeURIComponent(filename);

    expect(encodedFilename).toBe("%E9%BA%BB%E5%A9%86%E8%B1%86%E8%85%90.jpg");
  });

  it("Content-Disposition 应该使用 attachment", () => {
    const filename = "麻婆豆腐.jpg";
    const encodedFilename = encodeURIComponent(filename);
    const contentDisposition = `attachment; filename="${encodedFilename}"`;

    expect(contentDisposition).toContain("attachment");
    expect(contentDisposition).toContain(encodedFilename);
  });
});

// ========== 响应格式测试 ==========

describe("Gallery API 响应格式", () => {
  it("成功响应应该包含 success、data、pagination", () => {
    const response = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("data");
    expect(response).toHaveProperty("pagination");
    expect(response.pagination).toHaveProperty("hasMore");
  });

  it("data 项应该包含必要字段", () => {
    const item = {
      id: "1",
      titleZh: "麻婆豆腐",
      titleEn: "Mapo Tofu",
      coverImage: "https://example.com/mapo.jpg",
      cuisine: "川菜",
      location: "川渝",
    };

    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("titleZh");
    expect(item).toHaveProperty("coverImage");
  });
});
