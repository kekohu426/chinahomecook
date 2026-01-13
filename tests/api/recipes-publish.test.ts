import { describe, it, expect, vi } from "vitest";

// Mock auth 模块避免 next-auth 模块解析问题
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

// Mock prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {},
}));

import { PATCH } from "@/app/api/recipes/[id]/route";

describe("PATCH /api/recipes/[id] (deprecated)", () => {
  it("returns 410 Gone status indicating the endpoint is deprecated", async () => {
    const request = new Request("http://localhost/api/recipes/1", {
      method: "PATCH",
      body: JSON.stringify({ isPublished: true }),
    });

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(410);
    expect(json.success).toBe(false);
    expect(json.error).toContain("废弃");
  });
});
