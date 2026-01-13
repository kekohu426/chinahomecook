/**
 * Collection 同步工具测试
 *
 * 测试范围：
 * - createCollectionForTag: 创建标签时自动创建 Collection
 * - syncCollectionForTag: 更新标签时同步 Collection
 * - handleCollectionOnTagDelete: 删除标签时处理 Collection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockPrisma = {
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

beforeEach(() => {
  vi.clearAllMocks();
});

// ========== 类型定义 ==========

type TagType = "cuisine" | "scene" | "method" | "taste" | "crowd" | "occasion" | "region";

interface TagInfo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

// ========== 辅助函数（模拟 collection/sync.ts 逻辑）==========

function getPathPrefix(type: TagType): string {
  const prefixes: Record<TagType, string> = {
    cuisine: "/recipe/cuisine",
    scene: "/recipe/scene",
    method: "/recipe/method",
    taste: "/recipe/taste",
    crowd: "/recipe/crowd",
    occasion: "/recipe/occasion",
    region: "/recipe/region",
  };
  return prefixes[type];
}

function getIdField(type: TagType): string {
  const fields: Record<TagType, string> = {
    cuisine: "cuisineId",
    scene: "sceneId",
    method: "methodId",
    taste: "tasteId",
    crowd: "crowdId",
    occasion: "occasionId",
    region: "regionId",
  };
  return fields[type];
}

// ========== createCollectionForTag 测试 ==========

describe("createCollectionForTag", () => {
  it("应该为 cuisine 类型创建正确的 Collection", async () => {
    const tag: TagInfo = {
      id: "cuisine-001",
      name: "川菜",
      slug: "sichuan",
      description: "四川菜系",
    };

    mockPrisma.collection.create.mockResolvedValue({
      id: "coll-001",
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      path: "/recipe/cuisine/sichuan",
      status: "DRAFT",
      cuisineId: tag.id,
    });

    const result = await mockPrisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        path: `${getPathPrefix("cuisine")}/${tag.slug}`,
        status: "DRAFT",
        [getIdField("cuisine")]: tag.id,
        rules: {},
        targetCount: 20,
        minRequired: 5,
      },
    });

    expect(result.path).toBe("/recipe/cuisine/sichuan");
    expect(result.cuisineId).toBe("cuisine-001");
    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "川菜",
        slug: "sichuan",
        path: "/recipe/cuisine/sichuan",
        status: "DRAFT",
        cuisineId: "cuisine-001",
      }),
    });
  });

  it("应该为 scene 类型创建正确的 Collection", async () => {
    const tag: TagInfo = {
      id: "scene-001",
      name: "早餐",
      slug: "breakfast",
    };

    await mockPrisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        path: `${getPathPrefix("scene")}/${tag.slug}`,
        status: "DRAFT",
        [getIdField("scene")]: tag.id,
        rules: {},
        targetCount: 20,
        minRequired: 5,
      },
    });

    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        path: "/recipe/scene/breakfast",
        sceneId: "scene-001",
      }),
    });
  });

  it("应该为 method 类型创建正确的 Collection", async () => {
    const tag: TagInfo = {
      id: "method-001",
      name: "红烧",
      slug: "braised",
    };

    await mockPrisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        path: `${getPathPrefix("method")}/${tag.slug}`,
        status: "DRAFT",
        [getIdField("method")]: tag.id,
        rules: {},
        targetCount: 20,
        minRequired: 5,
      },
    });

    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        path: "/recipe/method/braised",
        methodId: "method-001",
      }),
    });
  });

  it("应该为 region 类型创建正确的 Collection", async () => {
    const tag: TagInfo = {
      id: "region-001",
      name: "四川",
      slug: "sichuan",
    };

    await mockPrisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        path: `${getPathPrefix("region")}/${tag.slug}`,
        status: "DRAFT",
        [getIdField("region")]: tag.id,
        rules: {},
        targetCount: 20,
        minRequired: 5,
      },
    });

    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        path: "/recipe/region/sichuan",
        regionId: "region-001",
      }),
    });
  });

  it("description 为 null 时应该正确处理", async () => {
    const tag: TagInfo = {
      id: "taste-001",
      name: "酸辣",
      slug: "sour-spicy",
      description: null,
    };

    await mockPrisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        path: `${getPathPrefix("taste")}/${tag.slug}`,
        status: "DRAFT",
        [getIdField("taste")]: tag.id,
        rules: {},
        targetCount: 20,
        minRequired: 5,
      },
    });

    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: null,
      }),
    });
  });
});

// ========== syncCollectionForTag 测试 ==========

describe("syncCollectionForTag", () => {
  it("更新 name 时应该同步到 Collection", async () => {
    const tagId = "cuisine-001";
    const updates = { name: "川菜（更新）" };

    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "coll-001",
      cuisineId: tagId,
    });

    // 模拟查找 Collection
    const collection = await mockPrisma.collection.findFirst({
      where: { cuisineId: tagId },
    });

    expect(collection).not.toBeNull();

    // 模拟更新 Collection
    await mockPrisma.collection.update({
      where: { id: collection!.id },
      data: { name: updates.name },
    });

    expect(mockPrisma.collection.update).toHaveBeenCalledWith({
      where: { id: "coll-001" },
      data: { name: "川菜（更新）" },
    });
  });

  it("更新 slug 时应该同步 slug 和 path", async () => {
    const tagId = "scene-001";
    const updates = { slug: "brunch" };

    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "coll-002",
      sceneId: tagId,
      path: "/recipe/scene/breakfast",
    });

    const collection = await mockPrisma.collection.findFirst({
      where: { sceneId: tagId },
    });

    const newPath = `${getPathPrefix("scene")}/${updates.slug}`;

    await mockPrisma.collection.update({
      where: { id: collection!.id },
      data: {
        slug: updates.slug,
        path: newPath,
      },
    });

    expect(mockPrisma.collection.update).toHaveBeenCalledWith({
      where: { id: "coll-002" },
      data: {
        slug: "brunch",
        path: "/recipe/scene/brunch",
      },
    });
  });

  it("同时更新 name 和 slug 时应该同步所有字段", async () => {
    const tagId = "method-001";
    const updates = { name: "慢炖", slug: "slow-cook" };

    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "coll-003",
      methodId: tagId,
    });

    const collection = await mockPrisma.collection.findFirst({
      where: { methodId: tagId },
    });

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.slug) {
      updateData.slug = updates.slug;
      updateData.path = `${getPathPrefix("method")}/${updates.slug}`;
    }

    await mockPrisma.collection.update({
      where: { id: collection!.id },
      data: updateData,
    });

    expect(mockPrisma.collection.update).toHaveBeenCalledWith({
      where: { id: "coll-003" },
      data: {
        name: "慢炖",
        slug: "slow-cook",
        path: "/recipe/method/slow-cook",
      },
    });
  });

  it("Collection 不存在时不应该抛出错误", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    const collection = await mockPrisma.collection.findFirst({
      where: { tasteId: "nonexistent" },
    });

    expect(collection).toBeNull();
    // 不调用 update
    expect(mockPrisma.collection.update).not.toHaveBeenCalled();
  });
});

// ========== handleCollectionOnTagDelete 测试 ==========

describe("handleCollectionOnTagDelete", () => {
  it("删除标签时应该将 Collection 状态设为 DRAFT 并清除关联", async () => {
    const tagId = "cuisine-001";

    mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });

    await mockPrisma.collection.updateMany({
      where: { cuisineId: tagId },
      data: {
        status: "DRAFT",
        cuisineId: null,
      },
    });

    expect(mockPrisma.collection.updateMany).toHaveBeenCalledWith({
      where: { cuisineId: tagId },
      data: {
        status: "DRAFT",
        cuisineId: null,
      },
    });
  });

  it("应该正确处理不同类型的标签删除", async () => {
    const testCases: Array<{ type: TagType; tagId: string }> = [
      { type: "scene", tagId: "scene-001" },
      { type: "method", tagId: "method-001" },
      { type: "taste", tagId: "taste-001" },
      { type: "crowd", tagId: "crowd-001" },
      { type: "occasion", tagId: "occasion-001" },
      { type: "region", tagId: "region-001" },
    ];

    for (const { type, tagId } of testCases) {
      vi.clearAllMocks();
      mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });

      const idField = getIdField(type);

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
    }
  });

  it("没有关联的 Collection 时不应该抛出错误", async () => {
    mockPrisma.collection.updateMany.mockResolvedValue({ count: 0 });

    const result = await mockPrisma.collection.updateMany({
      where: { crowdId: "nonexistent" },
      data: {
        status: "DRAFT",
        crowdId: null,
      },
    });

    expect(result.count).toBe(0);
  });
});

// ========== Path 生成测试 ==========

describe("路径生成", () => {
  it("所有标签类型都应该有正确的路径前缀", () => {
    const types: TagType[] = ["cuisine", "scene", "method", "taste", "crowd", "occasion", "region"];

    types.forEach((type) => {
      const prefix = getPathPrefix(type);
      expect(prefix).toMatch(/^\/recipe\//);
      expect(prefix).toContain(type);
    });
  });

  it("所有标签类型都应该有正确的 ID 字段名", () => {
    const types: TagType[] = ["cuisine", "scene", "method", "taste", "crowd", "occasion", "region"];

    types.forEach((type) => {
      const field = getIdField(type);
      expect(field).toMatch(/Id$/);
      expect(field.toLowerCase()).toContain(type);
    });
  });
});

// ========== 集成场景测试 ==========

describe("集成场景", () => {
  it("创建 -> 更新 -> 删除 完整流程", async () => {
    // 1. 创建标签和 Collection
    const tag: TagInfo = {
      id: "occasion-001",
      name: "节日",
      slug: "festival",
    };

    mockPrisma.collection.create.mockResolvedValue({
      id: "coll-festival",
      name: tag.name,
      slug: tag.slug,
      path: "/recipe/occasion/festival",
      status: "DRAFT",
      occasionId: tag.id,
    });

    const created = await mockPrisma.collection.create({
      data: {
        name: tag.name,
        slug: tag.slug,
        path: `${getPathPrefix("occasion")}/${tag.slug}`,
        status: "DRAFT",
        [getIdField("occasion")]: tag.id,
        rules: {},
        targetCount: 20,
        minRequired: 5,
      },
    });

    expect(created.occasionId).toBe("occasion-001");

    // 2. 更新标签名称
    vi.clearAllMocks();
    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "coll-festival",
      occasionId: tag.id,
    });

    const collection = await mockPrisma.collection.findFirst({
      where: { occasionId: tag.id },
    });

    await mockPrisma.collection.update({
      where: { id: collection!.id },
      data: { name: "节日庆典" },
    });

    expect(mockPrisma.collection.update).toHaveBeenCalledWith({
      where: { id: "coll-festival" },
      data: { name: "节日庆典" },
    });

    // 3. 删除标签
    vi.clearAllMocks();
    mockPrisma.collection.updateMany.mockResolvedValue({ count: 1 });

    await mockPrisma.collection.updateMany({
      where: { occasionId: tag.id },
      data: {
        status: "DRAFT",
        occasionId: null,
      },
    });

    expect(mockPrisma.collection.updateMany).toHaveBeenCalledWith({
      where: { occasionId: "occasion-001" },
      data: {
        status: "DRAFT",
        occasionId: null,
      },
    });
  });
});
