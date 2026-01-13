import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const TRUST_ITEMS: Partial<Record<Locale, { title: string; description: string }[]>> = {
  zh: [
    {
      title: "已收录 1,200+ 道菜",
      description: "持续更新的家常菜单",
    },
    {
      title: "4.9/5 用户评分",
      description: "真实用户口碑认可",
    },
    {
      title: "专业厨师审核",
      description: "步骤与口感更可复现",
    },
  ],
  en: [
    {
      title: "1,200+ recipes collected",
      description: "Updated continuously",
    },
    {
      title: "4.9/5 user rating",
      description: "Loved by real home cooks",
    },
    {
      title: "Chef reviewed",
      description: "Repeatable steps you can trust",
    },
  ],
};

export function TrustBar({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const items = TRUST_ITEMS[locale] ?? TRUST_ITEMS[DEFAULT_LOCALE] ?? [];
  return (
    <section className="bg-white border-y border-cream">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col gap-1">
              <div className="text-sm font-medium text-textDark">{item.title}</div>
              <div className="text-xs text-textGray">{item.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
