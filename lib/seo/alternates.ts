/**
 * SEO 多语言 alternates 工具
 *
 * 生成 hreflang、canonical 等 SEO 元数据
 */

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_ISO_CODES,
  type Locale,
} from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/utils";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://recipesite.com";

/**
 * 生成完整 URL
 */
export function buildUrl(path: string, locale?: Locale): string {
  const localizedPath = locale ? localizePath(path, locale) : path;
  return `${BASE_URL}${localizedPath}`;
}

/**
 * 生成 hreflang alternates 对象
 * 用于 Next.js Metadata 的 alternates.languages
 */
export function generateLanguageAlternates(
  path: string
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    const langCode = LOCALE_ISO_CODES[locale];
    languages[langCode] = buildUrl(path, locale);
  }

  // 添加 x-default（指向默认语言）
  languages["x-default"] = buildUrl(path, DEFAULT_LOCALE);

  return languages;
}

/**
 * 生成 canonical URL
 */
export function generateCanonical(path: string, locale: Locale): string {
  return buildUrl(path, locale);
}

/**
 * 生成完整的 alternates 对象（用于 Next.js Metadata）
 */
export function generateAlternates(path: string, locale: Locale) {
  return {
    canonical: generateCanonical(path, locale),
    languages: generateLanguageAlternates(path),
  };
}

/**
 * 为 sitemap 生成 alternates
 * 返回格式符合 MetadataRoute.Sitemap 的 alternates 结构
 */
export function generateSitemapAlternates(
  path: string
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    const langCode = locale === "zh" ? "zh-CN" : locale;
    languages[langCode] = buildUrl(path, locale);
  }

  return languages;
}
