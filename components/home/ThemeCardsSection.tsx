import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ThemeCard {
  id: string;
  title: string;
  imageUrl: string;
  tag: string;
}

interface ThemeCardsSectionProps {
  cards: ThemeCard[];
}

export function ThemeCardsSection({ cards }: ThemeCardsSectionProps) {
  return (
    <section className="py-16 bg-cream">
      <div className="max-w-7xl mx-auto px-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-medium text-textDark">
              热门主题
            </h2>
            <p className="text-textGray mt-1">精选食谱主题，找到你想要的</p>
          </div>
          <LocalizedLink
            href="/recipe"
            className="text-brownWarm hover:text-brownDark flex items-center gap-1 font-medium"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {cards.map((card) => (
            <LocalizedLink
              key={card.id}
              href={`/recipe?tag=${encodeURIComponent(card.tag)}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
            >
              {/* 背景图 */}
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 16vw"
              />

              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* 标题 */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-medium text-lg">{card.title}</h3>
              </div>
            </LocalizedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
