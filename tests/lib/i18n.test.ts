import { describe, it, expect } from "vitest";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  LOCALE_ISO_CODES,
  CONTENT_LOCALE_FALLBACKS,
} from "@/lib/i18n/config";
import {
  getLocaleFromPathname,
  stripLocaleFromPathname,
  localizePath,
  normalizeLocale,
} from "@/lib/i18n/utils";

describe("i18n config", () => {
  it("has zh as default locale", () => {
    expect(DEFAULT_LOCALE).toBe("zh");
  });

  it("supports zh and en locales", () => {
    expect(SUPPORTED_LOCALES).toContain("zh");
    expect(SUPPORTED_LOCALES).toContain("en");
  });

  it("has labels for all supported locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeDefined();
    }
    expect(LOCALE_LABELS.zh).toBe("中文");
    expect(LOCALE_LABELS.en).toBe("English");
  });

  it("has ISO codes for all supported locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_ISO_CODES[locale]).toBeDefined();
    }
    expect(LOCALE_ISO_CODES.zh).toBe("zh-CN");
    expect(LOCALE_ISO_CODES.en).toBe("en");
  });

  it("has fallbacks for all supported locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(CONTENT_LOCALE_FALLBACKS[locale]).toBeDefined();
      expect(Array.isArray(CONTENT_LOCALE_FALLBACKS[locale])).toBe(true);
    }
  });
});

describe("i18n utils", () => {
  describe("getLocaleFromPathname", () => {
    it("extracts locale from path", () => {
      expect(getLocaleFromPathname("/zh/recipe")).toBe("zh");
      expect(getLocaleFromPathname("/en/recipe")).toBe("en");
      expect(getLocaleFromPathname("/zh")).toBe("zh");
      expect(getLocaleFromPathname("/en")).toBe("en");
    });

    it("returns null for paths without locale", () => {
      expect(getLocaleFromPathname("/recipe")).toBeNull();
      expect(getLocaleFromPathname("/")).toBeNull();
      expect(getLocaleFromPathname("/admin/recipes")).toBeNull();
    });

    it("returns null for unsupported locales", () => {
      expect(getLocaleFromPathname("/ja/recipe")).toBeNull();
      expect(getLocaleFromPathname("/fr/recipe")).toBeNull();
    });
  });

  describe("stripLocaleFromPathname", () => {
    it("removes locale prefix from path", () => {
      expect(stripLocaleFromPathname("/zh/recipe")).toBe("/recipe");
      expect(stripLocaleFromPathname("/en/recipe/123")).toBe("/recipe/123");
      expect(stripLocaleFromPathname("/zh")).toBe("/");
    });

    it("returns original path if no locale prefix", () => {
      expect(stripLocaleFromPathname("/recipe")).toBe("/recipe");
      expect(stripLocaleFromPathname("/")).toBe("/");
    });
  });

  describe("localizePath", () => {
    it("adds locale prefix to path", () => {
      expect(localizePath("/recipe", "zh")).toBe("/zh/recipe");
      expect(localizePath("/recipe/123", "en")).toBe("/en/recipe/123");
      expect(localizePath("/", "zh")).toBe("/zh");
    });

    it("replaces existing locale prefix", () => {
      expect(localizePath("/zh/recipe", "en")).toBe("/en/recipe");
      expect(localizePath("/en/recipe", "zh")).toBe("/zh/recipe");
    });
  });

  describe("normalizeLocale", () => {
    it("returns supported locale as-is", () => {
      expect(normalizeLocale("zh")).toBe("zh");
      expect(normalizeLocale("en")).toBe("en");
    });

    it("returns default locale for unsupported", () => {
      expect(normalizeLocale("ja")).toBe("zh");
      expect(normalizeLocale("fr")).toBe("zh");
      expect(normalizeLocale("")).toBe("zh");
    });
  });
});
