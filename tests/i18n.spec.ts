/**
 * E2E 多语言测试
 *
 * 验证英文页面不包含中文内容
 *
 * 用法：pnpm test:i18n
 */

import { test, expect } from "@playwright/test";

const ENGLISH_PAGES = [
  { url: "/en/", name: "首页" },
  { url: "/en/recipe", name: "食谱页" },
  { url: "/en/gallery", name: "图库页" },
  { url: "/en/blog", name: "博客页" },
  { url: "/en/about", name: "关于页" },
];

// 允许的中文内容（如品牌名、特殊内容）
const ALLOWED_CHINESE = [
  "治愈系美食研习所", // 品牌名（可选保留）
];

test.describe("多语言 - 英文页面检查", () => {
  for (const page of ENGLISH_PAGES) {
    test(`${page.name} (${page.url}) 应无中文内容`, async ({ page: p }) => {
      await p.goto(page.url, { waitUntil: "networkidle" });
      await p.waitForTimeout(1000);

      const bodyText = await p.evaluate(() => document.body.innerText);

      // 提取所有中文
      const chineseMatches = bodyText.match(/[\u4e00-\u9fa5]+/g) || [];
      const uniqueChinese = [...new Set(chineseMatches)];

      // 过滤允许的中文
      const unexpectedChinese = uniqueChinese.filter(
        (text) => !ALLOWED_CHINESE.some((allowed) => text.includes(allowed))
      );

      if (unexpectedChinese.length > 0) {
        console.log(`发现中文内容: ${unexpectedChinese.join(", ")}`);
      }

      expect(unexpectedChinese).toEqual([]);
    });
  }
});

test.describe("多语言 - 中文页面检查", () => {
  test("中文首页应正常加载", async ({ page }) => {
    await page.goto("/zh/", { waitUntil: "networkidle" });

    // 应包含中文内容
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasChinese = /[\u4e00-\u9fa5]/.test(bodyText);

    expect(hasChinese).toBe(true);
  });
});
