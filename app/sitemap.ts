/**
 * 动态 Sitemap 生成
 *
 * 包含：
 * - 静态页面（首页、关于、博客列表等）
 * - 食谱详情页
 * - 菜系聚合页
 *
 * 每个页面使用 alternates.languages 声明多语言版本
 */

import { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_ISO_CODES, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/utils";
import { generateSitemapAlternates } from "@/lib/seo/alternates";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://recipesite.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];
  const locales = [...SUPPORTED_LOCALES];
  const buildUrl = (path: string, locale: Locale) =>
    `${BASE_URL}${localizePath(path || "/", locale)}`;

  // 静态页面
  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/recipe", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/custom-recipes", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/search", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/gallery", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/copyright", priority: 0.4, changeFrequency: "yearly" as const },
  ];

  for (const page of staticPages) {
    const alternateLanguages = generateSitemapAlternates(page.path || "/");
    for (const locale of locales) {
      sitemapEntries.push({
        url: buildUrl(page.path || "/", locale),
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority:
          locale === DEFAULT_LOCALE ? page.priority : Math.max(0.3, page.priority - 0.1),
        alternates: {
          languages: alternateLanguages,
        },
      });
    }
  }

  // 获取所有已发布的食谱
  try {
    const recipes = await prisma.recipe.findMany({
      where: { status: "published" },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    for (const recipe of recipes) {
      const alternateLanguages = generateSitemapAlternates(`/recipe/${recipe.id}`);
      for (const locale of locales) {
        sitemapEntries.push({
          url: buildUrl(`/recipe/${recipe.id}`, locale),
          lastModified: recipe.updatedAt,
          changeFrequency: "weekly",
          priority: locale === DEFAULT_LOCALE ? 0.8 : 0.7,
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch recipes for sitemap:", error);
  }

  // 获取所有已发布的菜系聚合页
  try {
    const cuisines = await prisma.cuisine.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        translations: {
          select: { locale: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    for (const cuisine of cuisines) {
      const path = `/recipe/cuisine/${cuisine.slug}`;
      const publishedLocales = new Set<Locale>([DEFAULT_LOCALE]);
      for (const translation of cuisine.translations) {
        if (SUPPORTED_LOCALES.includes(translation.locale as Locale)) {
          publishedLocales.add(translation.locale as Locale);
        }
      }
      const alternateLanguages: Record<string, string> = {};
      for (const locale of publishedLocales) {
        alternateLanguages[LOCALE_ISO_CODES[locale]] = buildUrl(path, locale);
      }
      for (const locale of publishedLocales) {
        sitemapEntries.push({
          url: buildUrl(path, locale),
          lastModified: cuisine.updatedAt,
          changeFrequency: "weekly",
          priority: locale === DEFAULT_LOCALE ? 0.85 : 0.75,
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch cuisines for sitemap:", error);
  }

  // 获取所有地点聚合页
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        translations: {
          select: { locale: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    for (const location of locations) {
      const path = `/recipe/location/${location.slug}`;
      const publishedLocales = new Set<Locale>([DEFAULT_LOCALE]);
      for (const translation of location.translations) {
        if (SUPPORTED_LOCALES.includes(translation.locale as Locale)) {
          publishedLocales.add(translation.locale as Locale);
        }
      }
      const alternateLanguages: Record<string, string> = {};
      for (const locale of publishedLocales) {
        alternateLanguages[LOCALE_ISO_CODES[locale]] = buildUrl(path, locale);
      }
      for (const locale of publishedLocales) {
        sitemapEntries.push({
          url: buildUrl(path, locale),
          lastModified: location.updatedAt,
          changeFrequency: "weekly",
          priority: locale === DEFAULT_LOCALE ? 0.8 : 0.7,
          alternates: {
            languages: alternateLanguages,
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch locations for sitemap:", error);
  }

  return sitemapEntries;
}
