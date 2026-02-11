import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Check, Image as ImageIcon } from "lucide-react";

function getDefaultConfig(locale: Locale) {
  return {
    title: t("home.toolsTitle", locale),
    subtitle: t("home.toolsSubtitle", locale),
    cookMode: {
      title: t("home.cookModeTitle", locale),
      features: [
        t("home.cookModeFeature1", locale),
        t("home.cookModeFeature2", locale),
        t("home.cookModeFeature3", locale),
        t("home.cookModeFeature4", locale),
      ],
      ctaLabel: t("home.cookModeCta", locale),
      ctaHref: "/recipe",
    },
    toolkit: {
      title: t("home.toolkitTitle", locale),
      features: [
        t("home.toolkitFeature1", locale),
        t("home.toolkitFeature2", locale),
        t("home.toolkitFeature3", locale),
        t("home.toolkitFeature4", locale),
        t("home.toolkitFeature5", locale),
      ],
      ctaLabel: t("home.toolkitCta", locale),
      ctaHref: "/recipe",
    },
  };
}

interface ToolConfig {
  title: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

interface ToolsShowcaseSectionProps {
  locale?: Locale;
  title?: string;
  subtitle?: string;
  cookMode?: ToolConfig;
  toolkit?: ToolConfig;
}

export function ToolsShowcaseSection({
  locale = DEFAULT_LOCALE,
  title,
  subtitle,
  cookMode,
  toolkit,
}: ToolsShowcaseSectionProps) {
  const defaultConfig = getDefaultConfig(locale);
  const displayTitle = title ?? defaultConfig.title;
  const displaySubtitle = subtitle ?? defaultConfig.subtitle;
  const displayCookMode = cookMode ?? defaultConfig.cookMode;
  const displayToolkit = toolkit ?? defaultConfig.toolkit;

  return (
    <section className="editorial-section editorial-section--cream">
      <div className="editorial-container space-y-12">
        <SectionHeading title={displayTitle} subtitle={displaySubtitle} />

        <div className="editorial-grid-2 items-center">
          <div className="editorial-card editorial-card--white p-6">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
              <div className="text-center">
                <ImageIcon className="w-10 h-10 text-brownWarm/40 mx-auto mb-2" />
                <p className="text-sm">
                  {t("home.cookModePreview", locale)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium text-textDark">
              {displayCookMode.title}
            </h3>
            <ul className="space-y-2 text-sm text-textGray">
              {displayCookMode.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brownWarm mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <LocalizedLink
              href={displayCookMode.ctaHref}
              className="editorial-link"
            >
              {displayCookMode.ctaLabel}
            </LocalizedLink>
          </div>
        </div>

        <div className="editorial-grid-2 items-center">
          <div className="order-2 lg:order-1 space-y-4">
            <h3 className="text-xl font-medium text-textDark">
              {displayToolkit.title}
            </h3>
            <ul className="space-y-2 text-sm text-textGray">
              {displayToolkit.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brownWarm mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <LocalizedLink
              href={displayToolkit.ctaHref}
              className="editorial-link"
            >
              {displayToolkit.ctaLabel}
            </LocalizedLink>
          </div>

          <div className="order-1 lg:order-2 editorial-card editorial-card--white p-6">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
              <div className="text-center">
                <ImageIcon className="w-10 h-10 text-brownWarm/40 mx-auto mb-2" />
                <p className="text-sm">
                  {t("home.toolkitPreview", locale)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
