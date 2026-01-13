import { CONTENT_LOCALE_FALLBACKS, DEFAULT_LOCALE, type Locale } from "./config";

export function getContentLocales(locale: Locale): string[] {
  const fallback = CONTENT_LOCALE_FALLBACKS[locale];
  if (fallback && fallback.length > 0) {
    return fallback;
  }
  return [locale || DEFAULT_LOCALE];
}
