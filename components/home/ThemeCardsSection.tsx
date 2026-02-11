import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";
import { SectionHeading } from "@/components/home/SectionHeading";

interface ThemeCard {
  id: string;
  title: string;
  imageUrl: string;
  tag: string;
  href?: string | null;
}

interface ThemeCardsSectionProps {
  cards: ThemeCard[];
  locale?: Locale;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function ThemeCardsSection({
  cards,
  locale = DEFAULT_LOCALE,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: ThemeCardsSectionProps) {
  return (
    <section className="editorial-section editorial-section--cream">
      <div className="editorial-container">
        <div className="mb-10">
          <SectionHeading
            title={title || t("home.themeCardsTitle", locale)}
            subtitle={subtitle || t("home.themeCardsSubtitle", locale)}
            action={
              <LocalizedLink
                href={ctaHref || "/recipe"}
                className="editorial-action"
              >
                {ctaLabel || t("common.viewAll", locale)}
                <ArrowRight className="w-4 h-4" />
              </LocalizedLink>
            }
          />
        </div>

        <div className="editorial-grid-theme">
          {cards.filter(card => card.imageUrl).map((card) => (
            <LocalizedLink
              key={card.id}
              href={card.href || `/recipe?tag=${encodeURIComponent(card.tag)}`}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-subtle hover:shadow-card transition-shadow"
            >
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 16vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-medium text-base tracking-wide">
                  {card.title}
                </h3>
              </div>
            </LocalizedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
