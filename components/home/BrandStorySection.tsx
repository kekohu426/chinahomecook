import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Image as ImageIcon } from "lucide-react";

function getDefaultConfig(locale: Locale) {
  return {
    title: t("home.ourMission", locale),
    values: [
      { title: t("home.valueFree", locale), description: t("home.valueFreeDesc", locale) },
      { title: t("home.valueHealing", locale), description: t("home.valueHealingDesc", locale) },
      { title: t("home.valueCare", locale), description: t("home.valueCareDesc", locale) },
    ],
    ctaLabel: t("home.learnOurStory", locale),
    ctaHref: "/about",
  };
}

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
  const defaultConfig = getDefaultConfig(locale);
  const displayTitle = title ?? defaultConfig.title;
  const displayValues = values ?? defaultConfig.values;
  const displayCtaLabel = ctaLabel ?? defaultConfig.ctaLabel;
  const displayCtaHref = ctaHref ?? defaultConfig.ctaHref;

  return (
    <section className="editorial-section editorial-section--white">
      <div className="editorial-container">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="editorial-card p-8">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
              <div className="text-center">
                <ImageIcon className="w-10 h-10 text-brownWarm/40 mx-auto mb-2" />
                <p className="text-sm">
                  {t("home.teamPlaceholder", locale)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading title={displayTitle} />
            <div className="space-y-5 text-sm text-textGray mt-6">
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
              className="inline-flex mt-6 editorial-link"
            >
              {displayCtaLabel}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
