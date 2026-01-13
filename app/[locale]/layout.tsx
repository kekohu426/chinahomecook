import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_ISO_CODES,
} from "@/lib/i18n/config";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { SiteConfigProvider } from "@/components/config/SiteConfigProvider";
import { generateAlternates } from "@/lib/seo/alternates";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const alternates = generateAlternates("/", locale as Locale);
  const ogLocale = LOCALE_ISO_CODES[locale as Locale] || "zh-CN";
  const alternateLocales = SUPPORTED_LOCALES
    .filter((loc) => loc !== locale)
    .map((loc) => LOCALE_ISO_CODES[loc]);

  return {
    title: {
      template: isEn ? "%s | Recipe Zen" : "%s | Recipe Zen 食谱研习",
      default: isEn ? "Recipe Zen - AI Cooking Companion" : "Recipe Zen - 食谱研习",
    },
    description: isEn
      ? "AI-powered recipes reviewed by experts, with voice guidance and smart timers."
      : "极致治愈 × 极致实用的中国美食指南",
    alternates,
    openGraph: {
      locale: ogLocale,
      alternateLocale: alternateLocales,
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound();
  }

  return (
    <LocaleProvider locale={locale}>
      <SiteConfigProvider>{children}</SiteConfigProvider>
    </LocaleProvider>
  );
}
