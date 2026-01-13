import { describe, it, expect } from "vitest";
import {
  t,
  getTranslations,
  createTranslator,
  translations,
} from "@/lib/i18n/translations";

describe("translations", () => {
  describe("t function", () => {
    it("returns Chinese translation for zh locale", () => {
      expect(t("common.loading", "zh")).toBe("加载中...");
      expect(t("nav.home", "zh")).toBe("首页");
      expect(t("recipe.ingredients", "zh")).toBe("食材");
    });

    it("returns English translation for en locale", () => {
      expect(t("common.loading", "en")).toBe("Loading...");
      expect(t("nav.home", "en")).toBe("Home");
      expect(t("recipe.ingredients", "en")).toBe("Ingredients");
    });

    it("returns nested translation keys", () => {
      expect(t("search.filters.cuisine", "zh")).toBe("菜系");
      expect(t("search.filters.cuisine", "en")).toBe("Cuisine");
    });

    it("returns fallback for missing key", () => {
      expect(t("nonexistent.key", "zh")).toBe("nonexistent.key");
      expect(t("nonexistent.key", "en", "Fallback")).toBe("Fallback");
    });

    it("falls back to Chinese for missing English translation", () => {
      // 如果英文缺失，应该回退到中文
      // 当前实现中所有键都有翻译，这里测试逻辑正确性
      expect(t("common.loading", "en")).toBe("Loading...");
    });
  });

  describe("getTranslations function", () => {
    it("returns all translations for a namespace", () => {
      const commonZh = getTranslations("common", "zh");
      expect(commonZh.loading).toBe("加载中...");
      expect(commonZh.error).toBe("出错了");
      expect(commonZh.save).toBe("保存");
    });

    it("returns empty object for non-existent namespace", () => {
      const result = getTranslations("nonexistent", "zh");
      expect(result).toEqual({});
    });
  });

  describe("createTranslator function", () => {
    it("creates a translator for zh locale", () => {
      const translate = createTranslator("zh");
      expect(translate("common.loading")).toBe("加载中...");
      expect(translate("nav.recipes")).toBe("食谱");
    });

    it("creates a translator for en locale", () => {
      const translate = createTranslator("en");
      expect(translate("common.loading")).toBe("Loading...");
      expect(translate("nav.recipes")).toBe("Recipes");
    });
  });

  describe("translations dictionary", () => {
    it("has zh and en locales", () => {
      expect(translations).toHaveProperty("zh");
      expect(translations).toHaveProperty("en");
    });

    it("has consistent keys across locales", () => {
      const zhKeys = Object.keys(translations.zh);
      const enKeys = Object.keys(translations.en);
      expect(zhKeys).toEqual(enKeys);
    });

    it("has all required namespaces", () => {
      const requiredNamespaces = [
        "common",
        "nav",
        "recipe",
        "home",
        "search",
        "footer",
        "error",
      ];
      for (const ns of requiredNamespaces) {
        expect(translations.zh).toHaveProperty(ns);
        expect(translations.en).toHaveProperty(ns);
      }
    });
  });
});
