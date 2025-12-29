import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/recipes/[id]/route";

const findUnique = vi.fn();
const update = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    recipe: {
      findUnique,
      update,
    },
  },
}));

describe("PATCH /api/recipes/[id]", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
  });

  it("updates publish status when body is valid", async () => {
    findUnique.mockResolvedValueOnce({ id: "1", isPublished: false });
    update.mockResolvedValueOnce({ id: "1", isPublished: true });

    const request = new Request("http://localhost/api/recipes/1", {
      method: "PATCH",
      body: JSON.stringify({ isPublished: true }),
    });

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.isPublished).toBe(true);
  });

  it("rejects invalid payload", async () => {
    const request = new Request("http://localhost/api/recipes/1", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
