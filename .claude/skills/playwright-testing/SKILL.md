---
name: playwright-testing
description: E2E testing with Playwright for web applications. Use when user says "E2E", "端到端测试", "playwright", "自动化测试", "测试用例", or wants to create or run automated tests.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx playwright:*), Bash(npm test:*)
---

# Playwright Testing - E2E 自动化测试

## Overview

使用 Playwright 进行端到端测试，确保 Web 应用功能正确性和用户体验质量。

## Setup

### 安装

```bash
npm install -D @playwright/test
npx playwright install
```

### 配置文件

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test Patterns

### Basic Page Test

```typescript
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display hero section", async ({ page }) => {
    await page.goto("/zh");

    // 检查标题
    await expect(page.locator("h1")).toBeVisible();

    // 检查导航
    await expect(page.getByRole("navigation")).toBeVisible();

    // 检查页面标题
    await expect(page).toHaveTitle(/Recipe/);
  });

  test("should navigate to recipes", async ({ page }) => {
    await page.goto("/zh");

    await page.getByRole("link", { name: /食谱|Recipes/i }).click();

    await expect(page).toHaveURL(/\/recipe/);
  });
});
```

### Form Test

```typescript
// e2e/search.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("should search and display results", async ({ page }) => {
    await page.goto("/zh");

    // 找到搜索框
    const searchInput = page.getByPlaceholder(/搜索|Search/i);
    await expect(searchInput).toBeVisible();

    // 输入搜索词
    await searchInput.fill("红烧肉");
    await searchInput.press("Enter");

    // 等待结果
    await expect(page).toHaveURL(/\/zh\/search\?q=红烧肉/);

    // 检查结果
    await expect(page.getByText(/红烧肉/)).toBeVisible();
  });

  test("should show empty state for no results", async ({ page }) => {
    await page.goto("/zh/search?q=xyznotexist123");

    await expect(page.getByText(/未找到|No results/i)).toBeVisible();
  });
});
```

### Authentication Test

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect unauthenticated user from admin", async ({ page }) => {
    await page.goto("/admin");

    // 应该重定向到登录页
    await expect(page).toHaveURL(/\/login|\/unauthorized/);
  });

  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    // 点击 Google 登录（模拟）
    await page.getByRole("button", { name: /Google/i }).click();

    // 验证登录后状态（根据实际情况调整）
    // await expect(page.getByText(/Welcome/i)).toBeVisible();
  });
});
```

### API Route Test

```typescript
// e2e/api.spec.ts
import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("GET /api/recipes returns data", async ({ request }) => {
    const response = await request.get("/api/recipes");

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test("POST /api/recipes requires auth", async ({ request }) => {
    const response = await request.post("/api/recipes", {
      data: { titleZh: "测试" },
    });

    expect(response.status()).toBe(401);
  });
});
```

### Visual Regression Test

```typescript
// e2e/visual.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("home page matches snapshot", async ({ page }) => {
    await page.goto("/zh");

    // 等待所有图片加载
    await page.waitForLoadState("networkidle");

    // 截图对比
    await expect(page).toHaveScreenshot("home.png", {
      maxDiffPixels: 100,
    });
  });

  test("recipe card matches snapshot", async ({ page }) => {
    await page.goto("/recipe");

    const card = page.locator('[data-testid="recipe-card"]').first();
    await expect(card).toHaveScreenshot("recipe-card.png");
  });
});
```

---

## Page Object Model

```typescript
// e2e/pages/HomePage.ts
import { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly heroTitle: Locator;
  readonly recipeCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/搜索|Search/i);
    this.heroTitle = page.locator("h1");
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
  }

  async goto() {
    await this.page.goto("/");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  async getRecipeCount() {
    return await this.recipeCards.count();
  }
}

// 使用
// e2e/home-pom.spec.ts
import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test("search from home page", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.search("红烧肉");
  await expect(page).toHaveURL(/q=红烧肉/);
});
```

---

## Commands

```bash
# 运行所有测试
npx playwright test

# 运行特定文件
npx playwright test e2e/home.spec.ts

# UI 模式（交互式调试）
npx playwright test --ui

# 生成测试代码
npx playwright codegen http://localhost:3000

# 查看报告
npx playwright show-report

# 更新截图快照
npx playwright test --update-snapshots
```

---

## CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Checklist

E2E 测试检查清单：

- [ ] 核心用户流程覆盖
- [ ] 表单提交测试
- [ ] 错误状态测试
- [ ] 响应式布局测试
- [ ] API 路由测试
- [ ] 认证流程测试
- [ ] 视觉回归测试（关键页面）
- [ ] CI 集成配置
