import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./config";

export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const locale = segments[0];
  return isSupportedLocale(locale) ? locale : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  if (isSupportedLocale(segments[0])) {
    return "/" + segments.slice(1).join("/");
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function localizePath(pathname: string, locale: Locale): string {
  const normalized = stripLocaleFromPathname(pathname);
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function normalizeLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  return isSupportedLocale(input) ? input : DEFAULT_LOCALE;
}

export function toRouteLocale(contentLocale?: string | null): Locale {
  if (!contentLocale) return DEFAULT_LOCALE;
  if (isSupportedLocale(contentLocale)) return contentLocale;
  if (contentLocale.startsWith("zh")) return "zh";
  if (contentLocale.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}
