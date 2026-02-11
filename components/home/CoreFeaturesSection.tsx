import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { CheckCircle, Target, Clock, Users } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";

const ICON_MAP: Record<string, React.ReactNode> = {
  check: <CheckCircle className="w-8 h-8 text-brownWarm" />,
  target: <Target className="w-8 h-8 text-brownWarm" />,
  clock: <Clock className="w-8 h-8 text-brownWarm" />,
  users: <Users className="w-8 h-8 text-brownWarm" />,
};

function getDefaultFeatures(locale: Locale) {
  return [
    { icon: "check", title: t("home.featureExpertReview", locale), description: t("home.featureExpertReviewDesc", locale) },
    { icon: "target", title: t("home.featureClearSteps", locale), description: t("home.featureClearStepsDesc", locale) },
    { icon: "clock", title: t("home.featureSaveTime", locale), description: t("home.featureSaveTimeDesc", locale) },
    { icon: "users", title: t("home.featureFamilyFriendly", locale), description: t("home.featureFamilyFriendlyDesc", locale) },
  ];
}

interface CoreFeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface CoreFeaturesSectionProps {
  locale?: Locale;
  title?: string;
  features?: CoreFeatureItem[];
}

export function CoreFeaturesSection({
  locale = DEFAULT_LOCALE,
  title,
  features,
}: CoreFeaturesSectionProps) {
  const displayTitle = title ?? t("home.whyChooseUs", locale);
  const displayFeatures = features ?? getDefaultFeatures(locale);

  return (
    <section className="editorial-section editorial-section--white">
      <div className="editorial-container">
        <div className="mb-10">
          <SectionHeading title={displayTitle} />
        </div>

        <div className="editorial-grid-2">
          {displayFeatures.map((feature) => (
            <div
              key={feature.title}
              className="editorial-card p-6 flex items-start gap-4"
            >
              <div className="mt-1">{ICON_MAP[feature.icon] ?? ICON_MAP.check}</div>
              <div>
                <h3 className="text-lg font-medium text-textDark">
                  {feature.title}
                </h3>
                <p className="text-sm text-textGray leading-relaxed mt-2">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
