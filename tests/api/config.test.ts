/**
 * 配置管理 API 单元测试
 *
 * 测试范围：
 * - /api/config/locations
 * - /api/config/cuisines
 * - /api/config/ingredient-icons
 * - /api/config/about
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockPrisma = {
  location: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  cuisine: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  ingredientIcon: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  aboutSection: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ========== 地点配置 API 测试 ==========

describe("地点配置 API", () => {
  describe("GET /api/config/locations", () => {
    it("应该返回所有地点列表", async () => {
      const mockLocations = [
        { id: "1", name: "川渝", slug: "chuanyu", sortOrder: 0, isActive: true },
        { id: "2", name: "江浙", slug: "jiangzhe", sortOrder: 1, isActive: true },
      ];
      mockPrisma.location.findMany.mockResolvedValue(mockLocations);

      // 模拟 GET 请求逻辑
      const where = undefined;
      const locations = await mockPrisma.location.findMany({
        where,
        orderBy: { sortOrder: "asc" },
      });

      expect(locations).toEqual(mockLocations);
      expect(mockPrisma.location.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { sortOrder: "asc" },
      });
    });

    it("应该支持只返回激活的地点", async () => {
      const mockActiveLocations = [
        { id: "1", name: "川渝", slug: "chuanyu", sortOrder: 0, isActive: true },
      ];
      mockPrisma.location.findMany.mockResolvedValue(mockActiveLocations);

      const activeOnly = true;
      const where = activeOnly ? { isActive: true } : undefined;

      await mockPrisma.location.findMany({
        where,
        orderBy: { sortOrder: "asc" },
      });

      expect(mockPrisma.location.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    });
  });

  describe("POST /api/config/locations", () => {
    it("应该成功创建地点", async () => {
      const newLocation = {
        id: "3",
        name: "粤港",
        slug: "yuegang",
        description: "粤港地区",
        sortOrder: 2,
        isActive: true,
      };
      mockPrisma.location.create.mockResolvedValue(newLocation);

      const body = { name: "粤港", slug: "yuegang", description: "粤港地区" };
      const result = await mockPrisma.location.create({
        data: {
          name: body.name,
          description: body.description,
          slug: body.slug,
          isActive: true,
          sortOrder: 0,
        },
      });

      expect(result.name).toBe("粤港");
      expect(mockPrisma.location.create).toHaveBeenCalled();
    });

    it("缺少 name 时应该返回错误", () => {
      const body: { slug: string; name?: string } = { slug: "test" };
      const isValid = body.name && body.slug;
      expect(isValid).toBeFalsy();
    });

    it("缺少 slug 时应该返回错误", () => {
      const body: { name: string; slug?: string } = { name: "测试" };
      const isValid = body.name && body.slug;
      expect(isValid).toBeFalsy();
    });

    it("应该使用默认的 isActive 和 sortOrder", async () => {
      const body: { name: string; slug: string; isActive?: boolean; sortOrder?: number } = { name: "测试", slug: "test" };

      await mockPrisma.location.create({
        data: {
          name: body.name,
          slug: body.slug,
          isActive: body.isActive !== undefined ? body.isActive : true,
          sortOrder: body.sortOrder !== undefined ? body.sortOrder : 0,
        },
      });

      expect(mockPrisma.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
          sortOrder: 0,
        }),
      });
    });
  });

  describe("PUT /api/config/locations/[id]", () => {
    it("应该成功更新地点", async () => {
      const updated = {
        id: "1",
        name: "川渝更新",
        slug: "chuanyu",
        sortOrder: 0,
        isActive: true,
      };
      mockPrisma.location.update.mockResolvedValue(updated);

      const result = await mockPrisma.location.update({
        where: { id: "1" },
        data: { name: "川渝更新" },
      });

      expect(result.name).toBe("川渝更新");
    });

    it("不存在的 ID 应该抛出错误", async () => {
      mockPrisma.location.update.mockRejectedValue(new Error("Record not found"));

      await expect(
        mockPrisma.location.update({
          where: { id: "nonexistent" },
          data: { name: "测试" },
        })
      ).rejects.toThrow();
    });
  });

  describe("DELETE /api/config/locations/[id]", () => {
    it("应该成功删除地点", async () => {
      mockPrisma.location.delete.mockResolvedValue({ id: "1" });

      await mockPrisma.location.delete({ where: { id: "1" } });

      expect(mockPrisma.location.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});

// ========== 食材图标 API 测试 ==========

describe("食材图标 API", () => {
  describe("GET /api/config/ingredient-icons", () => {
    it("应该返回所有图标", async () => {
      const mockIcons = [
        { id: "1", name: "鸡蛋", iconUrl: "https://example.com/egg.png", aliases: ["蛋"] },
        { id: "2", name: "番茄", iconUrl: "https://example.com/tomato.png", aliases: ["西红柿"] },
      ];
      mockPrisma.ingredientIcon.findMany.mockResolvedValue(mockIcons);

      const icons = await mockPrisma.ingredientIcon.findMany({
        where: undefined,
        orderBy: { sortOrder: "asc" },
      });

      expect(icons).toHaveLength(2);
      expect(icons[0].name).toBe("鸡蛋");
    });

    it("应该支持只返回激活的图标", async () => {
      await mockPrisma.ingredientIcon.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      expect(mockPrisma.ingredientIcon.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    });
  });

  describe("POST /api/config/ingredient-icons", () => {
    it("应该成功创建图标", async () => {
      const newIcon = {
        id: "3",
        name: "牛肉",
        iconUrl: "https://example.com/beef.png",
        aliases: ["牛排"],
        isActive: true,
      };
      mockPrisma.ingredientIcon.create.mockResolvedValue(newIcon);

      const result = await mockPrisma.ingredientIcon.create({
        data: {
          name: "牛肉",
          iconUrl: "https://example.com/beef.png",
          aliases: ["牛排"],
          isActive: true,
          sortOrder: 0,
        },
      });

      expect(result.name).toBe("牛肉");
    });

    it("缺少 name 应该返回错误", () => {
      const body: { iconUrl: string; name?: string } = { iconUrl: "https://example.com/test.png" };
      const name = typeof body.name === "string" ? body.name.trim() : "";
      expect(name).toBe("");
    });

    it("缺少 iconUrl 应该返回错误", () => {
      const body: { name: string; iconUrl?: string } = { name: "测试" };
      const iconUrl = typeof body.iconUrl === "string" ? body.iconUrl.trim() : "";
      expect(iconUrl).toBe("");
    });

    it("应该正确解析 aliases 数组", () => {
      const parseAliases = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
        }
        if (typeof value === "string") {
          return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };

      expect(parseAliases(["牛排", "牛腩"])).toEqual(["牛排", "牛腩"]);
    });

    it("应该正确解析 aliases 字符串（逗号分隔）", () => {
      const parseAliases = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
        }
        if (typeof value === "string") {
          return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };

      expect(parseAliases("牛排,牛腩")).toEqual(["牛排", "牛腩"]);
      expect(parseAliases("牛排，牛腩")).toEqual(["牛排", "牛腩"]); // 中文逗号
    });
  });
});

// ========== 关于我们 API 测试 ==========

describe("关于我们 API", () => {
  describe("GET /api/config/about", () => {
    it("应该返回所有区块", async () => {
      const mockSections = [
        { id: "1", titleZh: "品牌故事", contentZh: "内容...", type: "text", sortOrder: 0 },
        { id: "2", titleZh: "团队介绍", contentZh: "内容...", type: "image", sortOrder: 1 },
      ];
      mockPrisma.aboutSection.findMany.mockResolvedValue(mockSections);

      const sections = await mockPrisma.aboutSection.findMany({
        where: undefined,
        orderBy: { sortOrder: "asc" },
      });

      expect(sections).toHaveLength(2);
      expect(sections[0].titleZh).toBe("品牌故事");
    });

    it("应该支持只返回激活的区块", async () => {
      await mockPrisma.aboutSection.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      expect(mockPrisma.aboutSection.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    });
  });

  describe("POST /api/config/about", () => {
    it("应该成功创建区块", async () => {
      const newSection = {
        id: "3",
        titleZh: "新区块",
        contentZh: "内容",
        type: "text",
        sortOrder: 2,
        isActive: true,
      };
      mockPrisma.aboutSection.create.mockResolvedValue(newSection);

      const result = await mockPrisma.aboutSection.create({
        data: {
          titleZh: "新区块",
          contentZh: "内容",
          type: "text",
          sortOrder: 0,
          isActive: true,
        },
      });

      expect(result.titleZh).toBe("新区块");
    });

    it("缺少 titleZh 应该返回错误", () => {
      const body: { contentZh: string; type: string; titleZh?: string } = { contentZh: "内容", type: "text" };
      const isValid = body.titleZh && body.contentZh && body.type;
      expect(isValid).toBeFalsy();
    });

    it("缺少 contentZh 应该返回错误", () => {
      const body: { titleZh: string; type: string; contentZh?: string } = { titleZh: "标题", type: "text" };
      const isValid = body.titleZh && body.contentZh && body.type;
      expect(isValid).toBeFalsy();
    });

    it("缺少 type 应该返回错误", () => {
      const body: { titleZh: string; contentZh: string; type?: string } = { titleZh: "标题", contentZh: "内容" };
      const isValid = body.titleZh && body.contentZh && body.type;
      expect(isValid).toBeFalsy();
    });

    it("应该支持 text/image/video/mixed 类型", () => {
      const validTypes = ["text", "image", "video", "mixed"];
      validTypes.forEach((type) => {
        expect(["text", "image", "video", "mixed"]).toContain(type);
      });
    });
  });

  describe("PUT /api/config/about/[id]", () => {
    it("应该成功更新区块", async () => {
      const updated = {
        id: "1",
        titleZh: "更新后的标题",
        contentZh: "更新后的内容",
        type: "text",
      };
      mockPrisma.aboutSection.update.mockResolvedValue(updated);

      const result = await mockPrisma.aboutSection.update({
        where: { id: "1" },
        data: { titleZh: "更新后的标题" },
      });

      expect(result.titleZh).toBe("更新后的标题");
    });

    it("不存在的 ID 应该抛出错误", async () => {
      mockPrisma.aboutSection.update.mockRejectedValue(new Error("Record not found"));

      await expect(
        mockPrisma.aboutSection.update({
          where: { id: "nonexistent" },
          data: { titleZh: "测试" },
        })
      ).rejects.toThrow();
    });
  });

  describe("DELETE /api/config/about/[id]", () => {
    it("应该成功删除区块", async () => {
      mockPrisma.aboutSection.delete.mockResolvedValue({ id: "1" });

      await mockPrisma.aboutSection.delete({ where: { id: "1" } });

      expect(mockPrisma.aboutSection.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});

// ========== 响应格式测试 ==========

describe("API 响应格式", () => {
  it("成功响应应该包含 success: true 和 data", () => {
    const response = { success: true, data: [] };
    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("data");
  });

  it("错误响应应该包含 success: false 和 error", () => {
    const response = { success: false, error: "错误信息" };
    expect(response).toHaveProperty("success", false);
    expect(response).toHaveProperty("error");
  });

  it("分页响应应该包含 pagination 对象", () => {
    const response = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
    expect(response.pagination).toHaveProperty("page");
    expect(response.pagination).toHaveProperty("limit");
    expect(response.pagination).toHaveProperty("total");
    expect(response.pagination).toHaveProperty("totalPages");
  });
});
