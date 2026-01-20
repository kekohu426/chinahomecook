import Image from "next/image";
import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

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
  const isEn = locale === "en";
  const badges = config.chips?.slice(0, 3) || [];
  const supportingText = config.placeholder;
  const seoTitle = config.seoTitle ?? config.title;
  const displayTitle = config.displayTitle ?? config.title;
  // 根据设计规范：主CTA是"浏览全部食谱"，次CTA是"AI定制"
  const primary =
    primaryCta ??
    (isEn
      ? { label: "Browse All Recipes →", href: "/recipe" }
      : { label: "浏览全部食谱 →", href: "/recipe" });
  const secondary =
    secondaryCta ??
    (isEn
      ? { label: "Or try AI Custom →", href: "/ai-custom" }
      : { label: "或试试 AI定制你的专属菜谱 →", href: "/ai-custom" });
  const formatNumber = (num: number) => {
    if (isEn) {
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

      <div className="relative max-w-7xl mx-auto px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-sm text-brownDark border border-cream shadow-sm"
                  >
                    <span className="text-brownWarm">✓</span>
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <h1 className="sr-only">{seoTitle}</h1>
            <div className="text-4xl md:text-5xl font-serif font-medium text-textDark mb-4 leading-tight">
              {displayTitle}
            </div>
            <p className="text-lg md:text-xl text-textGray mb-4">
              {config.subtitle}
            </p>
            <p className="text-base text-textGray/80 max-w-xl mb-8">
              {supportingText}
            </p>

            <div className="flex flex-col gap-4">
              <LocalizedLink
                href={primary.href}
                className="inline-flex items-center justify-center px-8 py-4 bg-brownWarm text-white rounded-lg font-medium shadow-lg hover:bg-brownDark transition-colors w-fit"
              >
                {primary.label}
              </LocalizedLink>
              <LocalizedLink
                href={secondary.href}
                className="text-sm text-textGray hover:text-brownWarm underline underline-offset-4 transition-colors w-fit"
              >
                {secondary.label}
              </LocalizedLink>
            </div>

            {stats && (
              <div className="mt-8 flex flex-wrap items-center gap-2 text-base text-textGray">
                <span>
                  📊 {config.statsLabels?.generated || (isEn ? "Generated" : "已生成")}{" "}
                  <span className="font-semibold text-brownWarm">
                    {formatNumber(stats.recipesGenerated)}+
                  </span>{" "}
                  {config.statsLabels?.recipes || (isEn ? "recipes" : "菜谱")}
                </span>
                <span className="text-cream">|</span>
                <span>
                  ❤️ {config.statsLabels?.collected || (isEn ? "Collected" : "已收藏")}{" "}
                  <span className="font-semibold text-brownWarm">
                    {formatNumber(stats.recipesCollected)}+
                  </span>{" "}
                  {config.statsLabels?.times || (isEn ? "times" : "次")}
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden shadow-card border border-cream bg-white">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={isEn ? "Recipe Zen hero" : "Recipe Zen 主视觉"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🍲</div>
                    <p className="text-sm">
                      {isEn ? "Warm food scene placeholder" : "温暖美食场景图占位"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white/90 border border-cream rounded-2xl px-4 py-3 shadow-card">
              <p className="text-xs text-textGray">
                {config.imageFloatingText ||
                  (isEn
                    ? "Expert-reviewed · Repeatable steps"
                    : "专业团队审核 · 步骤可复现")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
