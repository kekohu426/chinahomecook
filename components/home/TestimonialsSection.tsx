import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import {
  DEFAULT_TESTIMONIALS_EN,
  DEFAULT_TESTIMONIALS_ZH,
} from "@/lib/home/defaults";
import { t } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/home/SectionHeading";
import { MessageCircle } from "lucide-react";

const DEFAULT_TESTIMONIALS: Partial<Record<Locale, Array<{
  id?: string;
  name: string;
  role: string;
  city: string;
  avatarUrl: string;
  content: string;
  meta: string;
}>>> = {
  zh: DEFAULT_TESTIMONIALS_ZH,
  en: DEFAULT_TESTIMONIALS_EN,
};

interface TestimonialsSectionProps {
  items?: Array<{
    id?: string;
    name: string;
    role: string;
    city: string;
    content: string;
    meta: string;
    avatarUrl?: string | null;
  }>;
  locale?: Locale;
  title?: string;
  subtitle?: string;
}

export function TestimonialsSection({
  items,
  locale = DEFAULT_LOCALE,
  title,
  subtitle,
}: TestimonialsSectionProps) {
  const fallbackTestimonials =
    DEFAULT_TESTIMONIALS[locale] ?? DEFAULT_TESTIMONIALS[DEFAULT_LOCALE] ?? [];
  const testimonials = items && items.length > 0 ? items : fallbackTestimonials;

  return (
    <section className="editorial-section editorial-section--cream">
      <div className="editorial-container">
        <div className="mb-10">
          <SectionHeading
            title={title || t("home.testimonials", locale)}
            subtitle={subtitle || t("home.realUserFeedback", locale)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={item.id || `${item.name}-${index}`}
              className="editorial-card editorial-card--white p-6 flex flex-col gap-4 relative"
            >
              <MessageCircle className="absolute top-4 right-4 w-8 h-8 text-brownWarm/15" />
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brownWarm/10 text-brownWarm flex items-center justify-center font-medium">
                  {item.avatarUrl ? (
                    <Image
                      src={item.avatarUrl}
                      alt={t("common.avatarAlt", locale).replace("{name}", item.name)}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    item.name.slice(0, 1)
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-textDark">
                    {item.name}
                  </div>
                  <div className="text-xs text-textGray">
                    {item.role} - {item.city}
                  </div>
                </div>
              </div>

              <p className="text-sm text-textDark leading-relaxed">
                &ldquo;{item.content}&rdquo;
              </p>

              <div className="text-xs text-textGray">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
