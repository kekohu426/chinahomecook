import type { Locale } from "@/lib/i18n/config";

const DATE_LOCALES: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

const SPEECH_LOCALES: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

export const getDateLocale = (locale: Locale) => DATE_LOCALES[locale] || "en-US";
export const getSpeechLocale = (locale: Locale) =>
  SPEECH_LOCALES[locale] || "en-US";
