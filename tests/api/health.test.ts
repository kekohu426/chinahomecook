import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";

const mockPrisma = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  recipe: { findFirst: vi.fn() },
  collection: { findFirst: vi.fn() },
  aIConfig: { findFirst: vi.fn() },
  user: { findFirst: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("returns healthy when database and tables are available", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce(1);
    mockPrisma.recipe.findFirst.mockResolvedValueOnce({});
    mockPrisma.collection.findFirst.mockResolvedValueOnce({});
    mockPrisma.aIConfig.findFirst.mockResolvedValueOnce({});
    mockPrisma.user.findFirst.mockResolvedValueOnce({});

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.tables.status).toBe("ok");
  });

  it("returns unhealthy when database connection fails", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("db down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("error");
  });

  it("returns unhealthy when required tables are missing", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce(1);
    mockPrisma.recipe.findFirst.mockRejectedValueOnce(new Error("missing"));
    mockPrisma.collection.findFirst.mockResolvedValueOnce({});
    mockPrisma.aIConfig.findFirst.mockResolvedValueOnce({});
    mockPrisma.user.findFirst.mockResolvedValueOnce({});

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.tables.status).toBe("error");
    expect(body.checks.tables.missing).toContain("Recipe");
  });
});
