import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

// 默认配置
const DEFAULT_CONFIG = {
  title: "我们的初心",
  values: [
    { title: "免费", description: "让每个人都能轻松学做菜，不因价格而犹豫。" },
    { title: "治愈", description: "用一道道家常菜，温暖每个平凡的日子。" },
    { title: "用心", description: "AI 提供效率，团队保证质量，细节更安心。" },
  ],
  ctaLabel: "了解我们的故事 →",
  ctaHref: "/about",
};

interface ValueItem {
  title: string;
  description: string;
}

interface BrandStorySectionProps {
  locale?: Locale;
  title?: string;
  values?: ValueItem[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function BrandStorySection({
  locale = DEFAULT_LOCALE,
  title,
  values,
  ctaLabel,
  ctaHref,
}: BrandStorySectionProps) {
  const displayTitle = title ?? DEFAULT_CONFIG.title;
  const displayValues = values ?? DEFAULT_CONFIG.values;
  const displayCtaLabel = ctaLabel ?? DEFAULT_CONFIG.ctaLabel;
  const displayCtaHref = ctaHref ?? DEFAULT_CONFIG.ctaHref;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="rounded-3xl border border-cream bg-cream/60 p-8">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
              <div className="text-center">
                <div className="text-4xl mb-2">🥘</div>
                <p className="text-sm">
                  {locale === "en" ? "Team + kitchen scene" : "团队与厨房场景"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark mb-6">
              {displayTitle}
            </h2>
            <div className="space-y-4 text-sm text-textGray">
              {displayValues.map((value) => (
                <div key={value.title}>
                  <p className="text-base font-medium text-textDark mb-1">
                    {value.title}
                  </p>
                  <p>{value.description}</p>
                </div>
              ))}
            </div>
            <LocalizedLink
              href={displayCtaHref}
              className="inline-flex mt-6 text-brownWarm font-medium"
            >
              {displayCtaLabel}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
