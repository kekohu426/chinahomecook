import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import {
  DEFAULT_TESTIMONIALS_EN,
  DEFAULT_TESTIMONIALS_ZH,
} from "@/lib/home/defaults";

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
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {title || (locale === "en" ? "Testimonials" : "用户证言")}
          </h2>
          <p className="text-textGray mt-2">
            {subtitle ||
              (locale === "en"
                ? "Real voices, warmth and trust."
                : "来自真实用户的反馈，温度与专业并存。")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={item.id || `${item.name}-${index}`}
              className="relative bg-white rounded-2xl border border-cream shadow-card p-6 flex flex-col gap-4"
            >
              <span className="absolute top-4 right-4 text-3xl text-brownWarm/15 font-serif">
                “
              </span>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brownWarm/10 text-brownWarm flex items-center justify-center font-medium">
                  {item.avatarUrl ? (
                    <Image
                      src={item.avatarUrl}
                      alt={
                        locale === "en" ? `${item.name} avatar` : `${item.name} 头像`
                      }
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
                    {item.role} · {item.city}
                  </div>
                </div>
              </div>

              <p className="text-sm text-textDark leading-relaxed">
                “{item.content}”
              </p>

              <div className="text-xs text-textGray">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
