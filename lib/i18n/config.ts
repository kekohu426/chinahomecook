export const DEFAULT_LOCALE = "zh" as const;

/**
 * 路由支持的语言列表
 *
 * 这些是前端 URL 路由实际支持的语言 (/zh/..., /en/...)
 * 翻译服务 (lib/ai/translate.ts) 可能支持更多语言用于预生成翻译
 *
 * 扩展语言时需要更新：
 * - 这里的 SUPPORTED_LOCALES
 * - LOCALE_LABELS, LOCALE_NAMES_EN, LOCALE_ISO_CODES, CONTENT_LOCALE_FALLBACKS
 * - middleware.ts 中的路由逻辑
 */
export const SUPPORTED_LOCALES = [
  "zh",
  "en",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * 语言显示名称（本地化）
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

/**
 * 语言的英文名称（用于 AI 翻译提示）
 */
export const LOCALE_NAMES_EN: Record<Locale, string> = {
  zh: "Chinese",
  en: "English",
};

/**
 * 语言对应的 ISO 代码（用于 SEO hreflang）
 */
export const LOCALE_ISO_CODES: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
};

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * 内容回退顺序（找不到当前语言时按顺序查找）
 */
export const CONTENT_LOCALE_FALLBACKS: Record<Locale, string[]> = {
  zh: ["zh", "zh-CN"],
  en: ["en"],
};
