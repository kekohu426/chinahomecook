import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to define mocks before they're used in vi.mock
const mockPrisma = vi.hoisted(() => ({
  recipe: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  recipeTranslation: {
    upsert: vi.fn(),
  },
  cuisine: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  cuisineTranslation: {
    upsert: vi.fn(),
  },
  translationJob: {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock AI provider
vi.mock("@/lib/ai/provider", () => ({
  getTextProvider: () => ({
    chat: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        title: "Kung Pao Chicken",
        description: "A spicy stir-fried dish",
        name: "Sichuan Cuisine",
      }),
    }),
  }),
}));

import {
  TRANSLATION_LOCALES,
  type TranslationLocale,
} from "@/lib/ai/translate";

describe("Translation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TRANSLATION_LOCALES", () => {
    it("includes required locales", () => {
      expect(TRANSLATION_LOCALES).toContain("zh");
      expect(TRANSLATION_LOCALES).toContain("en");
      expect(TRANSLATION_LOCALES).toContain("ja");
      expect(TRANSLATION_LOCALES).toContain("ko");
    });

    it("has correct type", () => {
      const locale: TranslationLocale = "en";
      expect(TRANSLATION_LOCALES.includes(locale)).toBe(true);
    });
  });
});

describe("Translation Job Executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("job status validation", () => {
    it("only executes pending jobs", async () => {
      mockPrisma.translationJob.findUnique.mockResolvedValue({
        id: "job-1",
        status: "completed",
        entityType: "recipe",
        entityId: "recipe-1",
        targetLang: "en",
        retryCount: 0,
        maxRetries: 3,
      });

      // Import after mocks are set up
      const { executeTranslationJob } = await import(
        "@/lib/ai/translation-job-executor"
      );

      const result = await executeTranslationJob("job-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("状态异常");
    });

    it("returns error for non-existent job", async () => {
      mockPrisma.translationJob.findUnique.mockResolvedValue(null);

      const { executeTranslationJob } = await import(
        "@/lib/ai/translation-job-executor"
      );

      const result = await executeTranslationJob("non-existent");
      expect(result.success).toBe(false);
      expect(result.error).toBe("任务不存在");
    });
  });

  describe("createTranslationJob", () => {
    it("creates new job when none exists", async () => {
      mockPrisma.translationJob.findFirst.mockResolvedValue(null);
      mockPrisma.translationJob.create.mockResolvedValue({
        id: "new-job-id",
        entityType: "recipe",
        entityId: "recipe-1",
        targetLang: "en",
        status: "pending",
      });

      const { createTranslationJob } = await import(
        "@/lib/ai/translation-job-executor"
      );

      const jobId = await createTranslationJob("recipe", "recipe-1", "en");
      expect(jobId).toBe("new-job-id");
      expect(mockPrisma.translationJob.create).toHaveBeenCalled();
    });

    it("returns existing job id when duplicate", async () => {
      mockPrisma.translationJob.findFirst.mockResolvedValue({
        id: "existing-job-id",
        entityType: "recipe",
        entityId: "recipe-1",
        targetLang: "en",
        status: "pending",
      });

      const { createTranslationJob } = await import(
        "@/lib/ai/translation-job-executor"
      );

      const jobId = await createTranslationJob("recipe", "recipe-1", "en");
      expect(jobId).toBe("existing-job-id");
      expect(mockPrisma.translationJob.create).not.toHaveBeenCalled();
    });
  });
});
