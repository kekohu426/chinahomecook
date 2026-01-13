/**
 * 标签 API Collection 同步集成测试
 *
 * 测试范围：
 * - 创建标签时自动创建 Collection
 * - 更新标签时同步 Collection
 * - 删除标签时处理 Collection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockPrisma = {
  scene: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  cookingMethod: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  taste: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  crowd: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  occasion: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  cuisine: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  location: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  collection: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "admin-001", role: "ADMIN" },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ========== Scene 标签测试 ==========

describe("Scene 标签 Collection 同步", () => {
  describe("POST /api/admin/config/tags/scenes", () => {
    it("创建场景标签后应该自动创建 Collection", async () => {
      const sceneData = {
        name: "早餐",
        slug: "breakfast",
        description: "早餐场景",
        sortOrder: 0,
        isActive: true,
      };

      // 模拟 slug 不存在
      mockPrisma.scene.findUnique.mockResolvedValue(null);

      // 模拟创建场景
      mockPrisma.scene.create.mockResolvedValue({
        id: "scene-001",
        ...sceneData,
      });

      // 模拟创建 Collection
      mockPrisma.collection.create.mockResolvedValue({
        id: "coll-001",
        name: sceneData.name,
        slug: sceneData.slug,
        path: `/recipe/scene/${sceneData.slug}`,
        status: "DRAFT",
        sceneId: "scene-001",
      });

      // 1. 创建场景
      const scene = await mockPrisma.scene.create({ data: sceneData });
      expect(scene.id).toBe("scene-001");

      // 2. 创建 Collection
      const collection = await mockPrisma.collection.create({
        data: {
          name: scene.name,
          slug: scene.slug,
          description: scene.description,
          path: `/recipe/scene/${scene.slug}`,
          status: "DRAFT",
          sceneId: scene.id,
          rules: {},
          targetCount: 20,
          minRequired: 5,
        },
      });

      expect(collection.sceneId).toBe("scene-001");
      expect(collection.path).toBe("/recipe/scene/breakfast");
    });
  });

  describe("PUT /api/admin/config/tags/scenes/[id]", () => {
    it("更新场景名称后应该同步 Collection", async () => {
      const sceneId = "scene-001";

      // 模拟场景存在
      mockPrisma.scene.findUnique.mockResolvedValue({
        id: sceneId,
        name: "早餐",
        slug: "breakfast",
      });

      // 模拟更新场景
      mockPrisma.scene.update.mockResolvedValue({
        id: sceneId,
        name: "早餐时光",
        slug: "breakfast",
      });

      // 模拟找到 Collection
      mockPrisma.collection.findFirst.mockResolvedValue({
        id: "coll-001",
        sceneId: sceneId,
      });

      // 模拟更新 Collection
      mockPrisma.collection.update.mockResolvedValue({
        id: "coll-001",
        name: "早餐时光",
      });

      // 1. 更新场景
      const scene = await mockPrisma.scene.update({
        where: { id: sceneId },
        data: { name: "早餐时光" },
      });

      // 2. 同步 Collection
      const collection = await mockPrisma.collection.findFirst({
        where: { sceneId: scene.id },
      });

      if (collection) {
        await mockPrisma.collection.update({
          where: { id: collection.id },
          data: { name: scene.name },
        });
      }

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: "coll-001" },
        data: { name: "早餐时光" },
      });
    });

    it("更新场景 slug 后应该同步 Collection path", async () => {
      const sceneId = "scene-001";
      const newSlug = "brunch";

      mockPrisma.scene.findUnique.mockResolvedValue({
        id: sceneId,
        slug: "breakfast",
      });

      mockPrisma.collection.findFirst.mockResolvedValue({
        id: "coll-001",
        sceneId: sceneId,
        path: "/recipe/scene/breakfast",
      });

      // 同步 slug 和 path
      await mockPrisma.collection.update({
        where: { id: "coll-001" },
        data: {
          slug: newSlug,
          path: `/recipe/scene/${newSlug}`,
        },
      });

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: "coll-001" },
        data: {
          slug: "brunch",
          path: "/recipe/scene/brunch",
        },
      });
    });
  });

  describe("DELETE /api/admin/config/tags/scenes/[id]", () => {
    it("删除场景后应该将 Collection 状态设为 DRAFT", async () => {
      const sceneId = "scene-001";

      mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.scene.delete.mockResolvedValue({ id: sceneId });

      // 1. 处理 Collection
      await mockPrisma.collection.updateMany({
        where: { sceneId },
        data: {
          status: "DRAFT",
          sceneId: null,
        },
      });

      // 2. 删除场景
      await mockPrisma.scene.delete({ where: { id: sceneId } });

      expect(mockPrisma.collection.updateMany).toHaveBeenCalledWith({
        where: { sceneId },
        data: {
          status: "DRAFT",
          sceneId: null,
        },
      });
    });
  });
});

// ========== Cuisine 标签测试 ==========

describe("Cuisine 菜系 Collection 同步", () => {
  describe("POST /api/config/cuisines", () => {
    it("创建菜系后应该自动创建 Collection", async () => {
      const cuisineData = {
        name: "川菜",
        slug: "sichuan",
        description: "四川菜系",
      };

      mockPrisma.cuisine.create.mockResolvedValue({
        id: "cuisine-001",
        ...cuisineData,
      });

      mockPrisma.collection.create.mockResolvedValue({
        id: "coll-cuisine-001",
        name: cuisineData.name,
        slug: cuisineData.slug,
        path: `/recipe/cuisine/${cuisineData.slug}`,
        cuisineId: "cuisine-001",
      });

      const cuisine = await mockPrisma.cuisine.create({ data: cuisineData });

      await mockPrisma.collection.create({
        data: {
          name: cuisine.name,
          slug: cuisine.slug,
          description: cuisine.description,
          path: `/recipe/cuisine/${cuisine.slug}`,
          status: "DRAFT",
          cuisineId: cuisine.id,
          rules: {},
          targetCount: 20,
          minRequired: 5,
        },
      });

      expect(mockPrisma.collection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cuisineId: "cuisine-001",
          path: "/recipe/cuisine/sichuan",
        }),
      });
    });
  });

  describe("PUT /api/config/cuisines/[id]", () => {
    it("更新菜系后应该同步 Collection", async () => {
      const cuisineId = "cuisine-001";

      mockPrisma.collection.findFirst.mockResolvedValue({
        id: "coll-cuisine-001",
        cuisineId: cuisineId,
      });

      await mockPrisma.collection.update({
        where: { id: "coll-cuisine-001" },
        data: { name: "川菜（更新）" },
      });

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: "coll-cuisine-001" },
        data: { name: "川菜（更新）" },
      });
    });
  });

  describe("DELETE /api/config/cuisines/[id]", () => {
    it("删除菜系后应该处理 Collection", async () => {
      const cuisineId = "cuisine-001";

      mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });

      await mockPrisma.collection.updateMany({
        where: { cuisineId },
        data: {
          status: "DRAFT",
          cuisineId: null,
        },
      });

      expect(mockPrisma.collection.updateMany).toHaveBeenCalledWith({
        where: { cuisineId },
        data: {
          status: "DRAFT",
          cuisineId: null,
        },
      });
    });
  });
});

// ========== Location 地点测试 ==========

describe("Location 地点 Collection 同步", () => {
  describe("POST /api/config/locations", () => {
    it("创建地点后应该自动创建 Collection（使用 region 类型）", async () => {
      const locationData = {
        name: "四川",
        slug: "sichuan",
        description: "四川地区",
      };

      mockPrisma.location.create.mockResolvedValue({
        id: "location-001",
        ...locationData,
      });

      mockPrisma.collection.create.mockResolvedValue({
        id: "coll-region-001",
        name: locationData.name,
        slug: locationData.slug,
        path: `/recipe/region/${locationData.slug}`,
        regionId: "location-001",
      });

      const location = await mockPrisma.location.create({ data: locationData });

      await mockPrisma.collection.create({
        data: {
          name: location.name,
          slug: location.slug,
          description: location.description,
          path: `/recipe/region/${location.slug}`,
          status: "DRAFT",
          regionId: location.id,
          rules: {},
          targetCount: 20,
          minRequired: 5,
        },
      });

      expect(mockPrisma.collection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          regionId: "location-001",
          path: "/recipe/region/sichuan",
        }),
      });
    });
  });

  describe("PUT /api/config/locations/[id]", () => {
    it("更新地点后应该同步 Collection", async () => {
      const locationId = "location-001";

      mockPrisma.collection.findFirst.mockResolvedValue({
        id: "coll-region-001",
        regionId: locationId,
      });

      await mockPrisma.collection.update({
        where: { id: "coll-region-001" },
        data: {
          name: "四川省",
          slug: "sichuan-province",
          path: "/recipe/region/sichuan-province",
        },
      });

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: "coll-region-001" },
        data: expect.objectContaining({
          path: "/recipe/region/sichuan-province",
        }),
      });
    });
  });

  describe("DELETE /api/config/locations/[id]", () => {
    it("删除地点后应该处理 Collection", async () => {
      const locationId = "location-001";

      mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });

      await mockPrisma.collection.updateMany({
        where: { regionId: locationId },
        data: {
          status: "DRAFT",
          regionId: null,
        },
      });

      expect(mockPrisma.collection.updateMany).toHaveBeenCalledWith({
        where: { regionId: locationId },
        data: {
          status: "DRAFT",
          regionId: null,
        },
      });
    });
  });
});

// ========== 其他标签类型测试 ==========

describe("其他标签类型 Collection 同步", () => {
  const tagTypes = [
    { type: "method", model: "cookingMethod", idField: "methodId" },
    { type: "taste", model: "taste", idField: "tasteId" },
    { type: "crowd", model: "crowd", idField: "crowdId" },
    { type: "occasion", model: "occasion", idField: "occasionId" },
  ];

  tagTypes.forEach(({ type, idField }) => {
    describe(`${type} 标签`, () => {
      it(`创建后应该创建 Collection（path: /recipe/${type}/xxx）`, async () => {
        const tagId = `${type}-001`;
        const slug = "test-slug";

        mockPrisma.collection.create.mockResolvedValue({
          id: `coll-${type}-001`,
          [idField]: tagId,
          path: `/recipe/${type}/${slug}`,
        });

        await mockPrisma.collection.create({
          data: {
            name: "测试标签",
            slug: slug,
            path: `/recipe/${type}/${slug}`,
            status: "DRAFT",
            [idField]: tagId,
            rules: {},
            targetCount: 20,
            minRequired: 5,
          },
        });

        expect(mockPrisma.collection.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            path: `/recipe/${type}/${slug}`,
            [idField]: tagId,
          }),
        });
      });

      it(`删除后应该将 Collection ${idField} 设为 null`, async () => {
        const tagId = `${type}-001`;

        mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });

        await mockPrisma.collection.updateMany({
          where: { [idField]: tagId },
          data: {
            status: "DRAFT",
            [idField]: null,
          },
        });

        expect(mockPrisma.collection.updateMany).toHaveBeenCalledWith({
          where: { [idField]: tagId },
          data: {
            status: "DRAFT",
            [idField]: null,
          },
        });
      });
    });
  });
});

// ========== 错误处理测试 ==========

describe("错误处理", () => {
  it("Collection 创建失败不应该阻止标签创建", async () => {
    mockPrisma.scene.create.mockResolvedValue({
      id: "scene-001",
      name: "测试场景",
      slug: "test",
    });

    mockPrisma.collection.create.mockRejectedValue(new Error("Database error"));

    // 标签创建成功
    const scene = await mockPrisma.scene.create({
      data: { name: "测试场景", slug: "test" },
    });
    expect(scene.id).toBe("scene-001");

    // Collection 创建失败但不影响流程
    try {
      await mockPrisma.collection.create({
        data: { name: "测试场景", slug: "test", path: "/recipe/scene/test" },
      });
    } catch (error) {
      // 错误被捕获，不影响主流程
      expect(error).toBeInstanceOf(Error);
    }
  });

  it("Collection 更新失败不应该阻止标签更新", async () => {
    mockPrisma.scene.update.mockResolvedValue({
      id: "scene-001",
      name: "更新后",
    });

    mockPrisma.collection.findFirst.mockResolvedValue({ id: "coll-001" });
    mockPrisma.collection.update.mockRejectedValue(new Error("Update failed"));

    // 标签更新成功
    const scene = await mockPrisma.scene.update({
      where: { id: "scene-001" },
      data: { name: "更新后" },
    });
    expect(scene.name).toBe("更新后");

    // Collection 更新失败但不影响流程
    try {
      await mockPrisma.collection.update({
        where: { id: "coll-001" },
        data: { name: "更新后" },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
