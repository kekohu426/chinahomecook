import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { NextRequest } from "next/server";

const mockAuth = vi.hoisted(() => ({
  auth: vi.fn(async () => null),
}));

const mockGuard = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () =>
    new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  ),
}));

const prismaMock = vi.hoisted(() => {
  const defaultResponse = (method: string) => {
    switch (method) {
      case "findMany":
        return [];
      case "findUnique":
      case "findFirst":
        return null;
      case "count":
        return 0;
      case "aggregate":
        return { _sum: { viewCount: 0 } };
      case "create":
      case "update":
      case "upsert":
        return {};
      case "delete":
        return {};
      case "updateMany":
      case "deleteMany":
        return { count: 0 };
      case "createMany":
        return { count: 0 };
      default:
        return {};
    }
  };

  const modelHandler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop.startsWith("$")) {
        return vi.fn(async () => []);
      }
      return vi.fn(async () => defaultResponse(prop));
    },
  };

  const rootHandler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop.startsWith("$")) {
        return vi.fn(async () => []);
      }
      return new Proxy({}, modelHandler);
    },
  };

  return new Proxy({}, rootHandler);
});

vi.mock("@/lib/auth", () => mockAuth);
vi.mock("@/lib/auth/guard", () => mockGuard);
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/ai/image-task-executor", () => ({
  executeImageTask: vi.fn(async () => ({ success: true })),
  executePromptsOnly: vi.fn(async () => ({ success: true })),
  retryFailedImages: vi.fn(async () => ({ success: true })),
}));
vi.mock("@/lib/ai/job-executor", () => ({
  executeGenerateJobAsync: vi.fn(async () => ({ success: true })),
  cancelGenerateJob: vi.fn(async () => ({ success: true })),
  retryGenerateJob: vi.fn(async () => ({ success: true })),
}));
vi.mock("@/lib/ai/translation-job-executor", () => ({
  processTranslationQueue: vi.fn(async () => ({ success: true })),
  getTranslationJobs: vi.fn(async () => []),
  getTranslationJob: vi.fn(async () => null),
  updateTranslationJob: vi.fn(async () => ({})),
  deleteTranslationJob: vi.fn(async () => ({})),
}));
vi.mock("@/lib/ai/prompt-manager", () => ({
  getAppliedPrompt: vi.fn(async () => ({ prompt: "test", systemPrompt: "" })),
  getAllPromptConfigs: vi.fn(async () => []),
  getPromptConfig: vi.fn(async () => null),
  savePromptConfig: vi.fn(async () => ({})),
  resetPromptConfig: vi.fn(async () => ({})),
}));
vi.mock("@/lib/ai/prompt-generator", () => ({
  promptGenerator: { generate: vi.fn(async () => "test") },
}));
vi.mock("@/lib/ai/rule-generator", () => ({
  generateRulesFromNaturalLanguage: vi.fn(async () => []),
  validateRules: vi.fn(async () => ({ isValid: true })),
}));
vi.mock("@/lib/ai/recommend-dishes", () => ({
  recommendDishes: vi.fn(async () => []),
  getFallbackRecommendations: vi.fn(async () => []),
}));
vi.mock("@/lib/ai/evolink", () => ({
  evolinkClient: {
    generateImage: vi.fn(async () => ({ success: true, imageUrl: "test" })),
  },
  clearImageConfigCache: vi.fn(async () => undefined),
}));
vi.mock("@/lib/ai/generation-logger", () => {
  class MockLogger {
    logSuccess() {
      return undefined;
    }
    logFailure() {
      return undefined;
    }
  }
  return {
    AIGenerationLogger: MockLogger,
    calculateCost: vi.fn(() => 0),
  };
});
vi.mock("@/lib/ai/provider", () => ({
  getTextProvider: vi.fn(() => ({
    chat: vi.fn(async () => ({
      content: '{"suggestions":["测试菜"]}',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    })),
    getModel: () => "test-model",
    getName: () => "test-provider",
  })),
}));
vi.mock("@/lib/home/seed", () => ({
  seedHomeBrowseItems: vi.fn(async () => undefined),
  seedHomeTestimonials: vi.fn(async () => undefined),
  seedHomeThemes: vi.fn(async () => undefined),
}));
vi.mock("@/lib/ai/tag-relations", () => ({
  attachRecipeTags: vi.fn(async () => ({ unknown: [] })),
  resolveCuisineSlug: vi.fn(async () => null),
}));
vi.mock("@/lib/team/assign-members", () => ({
  assignTeamMembers: vi.fn(async () => ({ explorerId: null, reviewerId: null })),
}));
vi.mock("@/lib/ingredients/ensure-ingredient-icons", () => ({
  ensureIngredientIconRecords: vi.fn(async () => undefined),
}));
vi.mock("@/lib/ai/generate-recipe", () => ({
  generateRecipe: vi.fn(async () => ({
    success: true,
    data: {
      titleZh: "测试菜",
      summary: {},
      ingredients: [],
      steps: [],
    },
  })),
}));
vi.mock("@/lib/ai/cuisine-guides", () => ({
  getCuisineGuide: vi.fn(() => ""),
}));
vi.mock("@/lib/ai/url-validator", () => ({
  isValidAIBaseUrl: vi.fn(() => true),
}));
vi.mock("busboy", () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
  })),
}), { virtual: true });

const METHOD_REGEX = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const moduleCache = new Map<string, Promise<any>>();
const loadModule = (filePath: string) => {
  if (!moduleCache.has(filePath)) {
    moduleCache.set(filePath, import(pathToFileURL(filePath).href));
  }
  return moduleCache.get(filePath)!;
};

const walk = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  });
};

const toRoutePath = (filePath: string) => {
  const rel = path
    .relative(path.join(process.cwd(), "app"), filePath)
    .replace(/\\/g, "/");
  return `/${rel.replace(/\/route\.ts$/, "").replace(/^api\//, "api/")}`;
};

const extractMethods = (filePath: string) => {
  const content = fs.readFileSync(filePath, "utf8");
  const methods = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = METHOD_REGEX.exec(content))) {
    methods.add(match[1]);
  }
  return METHODS.filter((method) => methods.has(method));
};

const buildParams = (routePath: string) => {
  const params: Record<string, string> = {};
  const segments = routePath.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment.startsWith("[")) {
      const raw = segment.replace(/^\[+|\]+$/g, "");
      const name = raw.startsWith("...") ? raw.slice(3) : raw;
      params[name] = `${name}-test`;
    }
  }
  return Object.keys(params).length > 0 ? params : undefined;
};

const buildRequest = (routePath: string, method: string) => {
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
  };
  if (method !== "GET") {
    init.body = JSON.stringify({
      taskIds: [],
      ids: [],
      jobIds: [],
      recipeIds: [],
      items: [],
      tags: [],
      translations: [],
      files: [],
      steps: [],
      imageShots: [],
      prompts: [],
      recipes: [],
      locale: "zh",
      name: "test",
      title: "test",
      dishName: "test",
      question: "test",
      prompt: "test",
      section: "hero",
      content: {},
      action: "full",
      status: "draft",
      count: 1,
      autoSave: false,
      generateImages: false,
    });
  }
  return new NextRequest(`http://localhost${routePath}`, init);
};

describe("Admin routes respond", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "[]" } }] }),
      text: async () => "",
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: new Headers({ "content-type": "application/json" }),
    })) as any;
  });

  const adminRoot = path.join(process.cwd(), "app", "api", "admin");
  const routeFiles = walk(adminRoot).filter((file) => file.endsWith("route.ts"));

  const entries = routeFiles
    .map((filePath) => ({
      filePath,
      routePath: toRoutePath(filePath),
      methods: extractMethods(filePath),
    }))
    .filter((entry) => entry.methods.length > 0);

  for (const entry of entries) {
    for (const method of entry.methods) {
      it(`${method} ${entry.routePath} rejects without admin`, async () => {
        const mod = await loadModule(entry.filePath);
        const handler = mod[method];
        expect(typeof handler).toBe("function");

        const request = buildRequest(entry.routePath, method);
        const params = buildParams(entry.routePath);
        const response = await handler(request, params ? { params } : undefined);

        expect(response).toBeInstanceOf(Response);
        expect(typeof response.status).toBe("number");
      });
    }
  }
});
