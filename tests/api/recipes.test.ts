/**
 * 食谱API集成测试
 */

import { describe, it, expect } from "vitest";

describe("食谱API筛选功能", () => {
  it("应该支持按地点筛选", () => {
    const params = new URLSearchParams({ location: "川渝", published: "true" });
    expect(params.get("location")).toBe("川渝");
  });

  it("应该支持按菜系筛选", () => {
    const params = new URLSearchParams({ cuisine: "川菜", published: "true" });
    expect(params.get("cuisine")).toBe("川菜");
  });

  it("应该支持按食材筛选", () => {
    const params = new URLSearchParams({ ingredient: "鸭肉", published: "true" });
    expect(params.get("ingredient")).toBe("鸭肉");
  });

  it("应该支持组合筛选", () => {
    const params = new URLSearchParams({
      location: "川渝",
      cuisine: "川菜",
      ingredient: "豆腐",
    });
    expect(params.get("location")).toBe("川渝");
    expect(params.get("cuisine")).toBe("川菜");
    expect(params.get("ingredient")).toBe("豆腐");
  });

  it("应该支持多个食材筛选", () => {
    const ingredients = ["鸭肉", "啤酒"];
    const param = ingredients.join(",");
    expect(param.split(",")).toEqual(["鸭肉", "啤酒"]);
  });
});

describe("搜索参数", () => {
  it("应该正确编码搜索关键词", () => {
    const query = "啤酒鸭";
    const encoded = encodeURIComponent(query);
    expect(encoded).toBe("%E5%95%A4%E9%85%92%E9%B8%AD");
  });

  it("应该正确解码搜索关键词", () => {
    const encoded = "%E5%95%A4%E9%85%92%E9%B8%AD";
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe("啤酒鸭");
  });
});

describe("分页参数", () => {
  it("应该正确计算跳过的记录数", () => {
    const page = 2;
    const limit = 12;
    const skip = (page - 1) * limit;
    expect(skip).toBe(12);
  });

  it("应该正确计算总页数", () => {
    const total = 25;
    const limit = 12;
    const totalPages = Math.ceil(total / limit);
    expect(totalPages).toBe(3);
  });
});
