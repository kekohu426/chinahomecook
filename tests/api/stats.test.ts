import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/stats/route";

const mockPrisma = vi.hoisted(() => ({
  recipe: {
    count: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/stats", () => {
  it("returns aggregated stats on success", async () => {
    mockPrisma.recipe.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(4);
    mockPrisma.recipe.aggregate.mockResolvedValueOnce({
      _sum: { viewCount: 123 },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      recipesGenerated: 4,
      recipesCollected: 6,
      totalRecipes: 10,
      totalViews: 123,
    });
  });

  it("returns 500 when prisma throws", async () => {
    mockPrisma.recipe.count.mockRejectedValueOnce(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
