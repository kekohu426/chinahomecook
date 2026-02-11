import Image from "next/image";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { ChefHat } from "lucide-react";

interface HeroConfig {
  title: string;
  displayTitle?: string;
  seoTitle?: string;
  subtitle: string;
  placeholder: string;
  chips: string[];
  imageFloatingText?: string;
  statsLabels?: {
    generated: string;
    recipes: string;
    collected: string;
    times: string;
  };
}

interface HeroSectionProps {
  config: HeroConfig;
  imageUrl?: string | null;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: {
    recipesGenerated: number;
    recipesCollected: number;
    totalDownloads: number;
  };
  locale?: Locale;
}

export function HeroSection({
  config,
  imageUrl,
  primaryCta,
  secondaryCta,
  stats,
  locale = DEFAULT_LOCALE,
}: HeroSectionProps) {
  const badges = config.chips?.slice(0, 3) || [];
  const supportingText = config.placeholder;
  const rawDisplayTitle = config.displayTitle ?? config.title;
  const displayTitle =
    locale === "en"
      ? rawDisplayTitle.replace(/\s+([^\s]+)\s*$/, "\u00A0$1")
      : rawDisplayTitle;
  // 根据设计规范：主CTA是"浏览全部食谱"，次CTA是"AI定制"
  const primary =
    primaryCta ?? { label: t("home.browseAllRecipes", locale), href: "/recipe" };
  const secondary =
    secondaryCta ?? { label: t("home.aiCustomSubtitle", locale), href: "/ai-custom" };
  const formatNumber = (num: number) => {
    if (locale === "en") {
      return num.toLocaleString("en-US");
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString("zh-CN");
  };

  return (
    <section className="relative bg-cream overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-orangeAccent/15 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -right-24 w-96 h-96 bg-brownWarm/15 blur-3xl rounded-full" />
      </div>

      <div className="relative editorial-container py-20 lg:py-28">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            
            <div className="editorial-eyebrow">
              <span className="editorial-eyebrow-line" />
              <span>Recipe Zen</span>
            </div>

            {badges.length > 0 && (
              <div className="editorial-badges mt-5">
                {badges.map((badge) => (
                  <span key={badge} className="flex items-center gap-2">
                    <span className="editorial-badge-dot" />
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <h1 className="editorial-hero-title mt-6 max-w-2xl text-balance">
              {displayTitle}
            </h1>
            <p className="editorial-hero-subtitle editorial-hero-subtitle--dark mt-5 max-w-xl">
              {config.subtitle}
            </p>
            <p className="editorial-hero-body editorial-hero-body--dark max-w-xl mt-4">
              {supportingText}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <LocalizedLink
                href={primary.href}
                className="editorial-button-primary inline-flex items-center justify-center"
              >
                {primary.label}
              </LocalizedLink>
              <LocalizedLink
                href={secondary.href}
                className="editorial-link-muted"
              >
                {secondary.label}
              </LocalizedLink>
            </div>

            {stats && (
              <div className="mt-8 flex flex-wrap items-center gap-4 editorial-meta">
                <span>
                  {config.statsLabels?.generated || t("home.statsGenerated", locale)}{" "}
                  <span className="font-semibold text-brownWarm">
                    {formatNumber(stats.recipesGenerated)}+
                  </span>{" "}
                  {config.statsLabels?.recipes || t("home.statsRecipes", locale)}
                </span>
                <span className="editorial-meta-dot" />
                <span>
                  {config.statsLabels?.collected || t("home.statsCollected", locale)}{" "}
                  <span className="font-semibold text-brownWarm">
                    {formatNumber(stats.recipesCollected)}+
                  </span>{" "}
                  {config.statsLabels?.times || t("home.statsTimes", locale)}
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden shadow-card border border-cream bg-white">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={t("home.heroTitle", locale)}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
                  <div className="text-center">
                    <ChefHat className="w-10 h-10 text-brownWarm/60 mx-auto mb-3" />
                    <p className="text-sm">
                      {t("home.teamPlaceholder", locale)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white/90 border border-cream rounded-2xl px-4 py-3 shadow-card">
              <p className="text-xs text-textGray">
                {config.imageFloatingText || t("home.teamVerified", locale)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
