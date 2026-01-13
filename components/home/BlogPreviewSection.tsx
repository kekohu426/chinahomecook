import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

// Mock 博客数据
const MOCK_BLOGS: Partial<Record<Locale, {
  id: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
  tags: string[];
}[]>> = {
  zh: [
  {
    id: "1",
    title: "新手必看：掌握这5个技巧，炒菜再也不翻车",
    summary:
      "从火候控制到调味顺序，这些基础技巧能让你的厨艺突飞猛进。很多人做菜不好吃，往往就是忽略了这些细节...",
    coverImage: "https://files.evolink.ai/api/v1/storage/f_c1cabe7f-e.webp",
    publishedAt: "2025-01-15",
    tags: ["烹饪技巧", "新手入门"],
  },
  {
    id: "2",
    title: "川菜的灵魂：郫县豆瓣酱的前世今生",
    summary:
      "被誉为'川菜之魂'的郫县豆瓣酱，有着300多年的历史。从一颗蚕豆到餐桌上的美味，经历了怎样的蜕变？",
    coverImage: "https://files.evolink.ai/api/v1/storage/f_bd97c64d-e.webp",
    publishedAt: "2025-01-10",
    tags: ["美食文化", "川菜"],
  },
  {
    id: "3",
    title: "减脂期怎么吃？这份食谱清单请收好",
    summary:
      "减脂不等于节食，掌握正确的饮食方法，既能享受美食又能保持好身材。这份经过营养师认证的食谱清单...",
    coverImage: "https://files.evolink.ai/api/v1/storage/f_5a57a8e4-e.webp",
    publishedAt: "2025-01-05",
    tags: ["健康饮食", "减脂"],
  },
  {
    id: "4",
    title: "新手做饭常见的5个误区，你中了几个？",
    summary:
      "掌握做饭的底层规律比记食谱更重要。避开这些误区，厨艺提升会更快...",
    coverImage: "https://files.evolink.ai/api/v1/storage/f_1a2b3c4d-e.webp",
    publishedAt: "2025-01-01",
    tags: ["新手入门", "做饭误区"],
  },
  ],
  en: [
    {
      id: "1",
      title: "5 essential skills for beginner cooks",
      summary:
        "From heat control to seasoning timing, these basics level up your cooking fast.",
      coverImage: "https://files.evolink.ai/api/v1/storage/f_c1cabe7f-e.webp",
      publishedAt: "2025-01-15",
      tags: ["Basics", "Tips"],
    },
    {
      id: "2",
      title: "The soul of Sichuan cuisine: Pixian douban",
      summary:
        "A 300-year journey from humble beans to the heart of bold flavors.",
      coverImage: "https://files.evolink.ai/api/v1/storage/f_bd97c64d-e.webp",
      publishedAt: "2025-01-10",
      tags: ["Culture", "Sichuan"],
    },
    {
      id: "3",
      title: "How to eat lean without feeling deprived",
      summary:
        "A balanced list of recipes that keep you full and satisfied.",
      coverImage: "https://files.evolink.ai/api/v1/storage/f_5a57a8e4-e.webp",
      publishedAt: "2025-01-05",
      tags: ["Healthy", "Low-fat"],
    },
    {
      id: "4",
      title: "5 common cooking mistakes to avoid",
      summary:
        "Fix these habits and your dishes will taste better immediately.",
      coverImage: "https://files.evolink.ai/api/v1/storage/f_1a2b3c4d-e.webp",
      publishedAt: "2025-01-01",
      tags: ["Beginners", "Mistakes"],
    },
  ],
};

export function BlogPreviewSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const blogs = MOCK_BLOGS[locale] ?? MOCK_BLOGS[DEFAULT_LOCALE] ?? [];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-medium text-textDark">
              {locale === "en" ? "Cooking Tips & Food Stories" : "美食知识与烹饪技巧"}
            </h2>
            <p className="text-textGray mt-1">
              {locale === "en"
                ? "Not just recipes, but practical knowledge too."
                : "不只是菜谱，还有实用的烹饪知识与美食文化。"}
            </p>
          </div>
          <LocalizedLink
            href="/blog"
            className="text-brownWarm hover:text-brownDark flex items-center gap-1 font-medium"
          >
            {locale === "en" ? "Read more" : "查看更多"}
            <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>

        {/* 博客卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <LocalizedLink
              key={blog.id}
              href={`/blog/${blog.id}`}
              className="group bg-cream rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
            >
              {/* 封面图 */}
              <div className="relative aspect-[16/9] bg-lightGray">
                <Image
                  src={blog.coverImage}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              {/* 内容 */}
              <div className="p-5">
                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-brownWarm/10 text-brownWarm text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 标题 */}
                <h3 className="font-medium text-textDark group-hover:text-brownWarm transition-colors line-clamp-2 mb-2">
                  {blog.title}
                </h3>

                {/* 摘要 */}
                <p className="text-sm text-textGray line-clamp-2 mb-3">
                  {blog.summary}
                </p>

                {/* 日期 */}
                <div className="flex items-center gap-1 text-xs text-textGray">
                  <Calendar className="w-3 h-3" />
                  {blog.publishedAt}
                </div>
              </div>
            </LocalizedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
