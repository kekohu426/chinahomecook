"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator, type TranslationFunction } from "@/lib/i18n/translations";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * 获取当前语言
 */
export function useLocale() {
  return useContext(LocaleContext);
}

/**
 * 获取翻译函数
 *
 * 用法：
 * const { t, locale } = useTranslations();
 * const text = t("common.loading");
 */
export function useTranslations(): {
  t: TranslationFunction;
  locale: Locale;
  isEn: boolean;
  isZh: boolean;
} {
  const locale = useContext(LocaleContext);

  const t = useMemo(() => createTranslator(locale), [locale]);

  return {
    t,
    locale,
    isEn: locale === "en",
    isZh: locale === "zh",
  };
}
