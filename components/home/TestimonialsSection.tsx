import Image from "next/image";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const DEFAULT_TESTIMONIALS: Partial<Record<Locale, Array<{
  id?: string;
  name: string;
  role: string;
  city: string;
  avatarUrl: string;
  content: string;
  meta: string;
}>>> = {
  zh: [
  {
    name: "王雅婷",
    role: "全职妈妈",
    city: "北京",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172065-UlbCpbdz.webp",
    content:
      "以前做饭完全靠外卖，有了孩子后想给他做点健康的。Recipe Zen 的食谱很适合我这种小白，步骤清楚还有语音朗读，手忙脚乱也不用一直看手机。上周做的番茄炖牛腩，老公夸了好久！",
    meta: "⭐⭐⭐⭐⭐ | 使用 3 个月 | 已做成 28 道菜",
  },
  {
    name: "李建国",
    role: "程序员",
    city: "深圳",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172080-MbORzZ4o.webp",
    content:
      "996 的生活，回家只想吃口热乎的。我用定制功能输入“快手菜 + 低油少盐”，很快推荐了适合的菜。最喜欢智能计时器，到点提醒，不用担心煮过头。",
    meta: "⭐⭐⭐⭐⭐ | 使用 2 个月 | 最爱功能：定制 + 计时",
  },
  {
    name: "张敏",
    role: "糖尿病患者",
    city: "上海",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172097-mXH5eYHf.webp",
    content:
      "确诊糖尿病后，饮食管理成了大问题。定制食谱能根据我的控糖需求生成方案，而且每道菜都有专业团队审核，不是随便拼凑的内容，吃得很放心。",
    meta: "⭐⭐⭐⭐⭐ | 使用 5 个月 | 血糖管理案例",
  },
  {
    name: "陈思远",
    role: "留学生",
    city: "美国加州",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172115-2ITSzc78.webp",
    content:
      "在国外特别想吃家乡菜，但又不会做。按地域分类的食谱帮了大忙，我是湖南人，网站上的川湘菜做法很地道。照着做剁椒鱼头时，真的特别感动。",
    meta: "⭐⭐⭐⭐⭐ | 使用 4 个月 | 已复刻 15 道家乡菜",
  },
  {
    name: "刘大爷",
    role: "退休教师",
    city: "成都",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172134-usPRQlR8.webp",
    content:
      "年纪大了眼神不好，但语音朗读功能特别方便，字也能调大。打印食谱更绝，贴厨房墙上做菜一抬头就看见。现在老伴儿都夸我手艺见长。",
    meta: "⭐⭐⭐⭐⭐ | 使用 6 个月 | 最爱功能：语音 + 打印",
  },
  {
    name: "小鹿美食记",
    role: "美食博主",
    city: "杭州",
    avatarUrl:
      "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172155-3oXy9doV.webp",
    content:
      "经常需要高清菜品图做封面，Recipe Zen 的图片库真实感很强，而且免费可商用！食谱内容也扎实，步骤能复现，我会推荐粉丝来学菜。",
    meta: "⭐⭐⭐⭐⭐ | 使用 8 个月 | 已下载 200+ 张图片",
  },
  ],
  en: [
    {
      name: "Yating Wang",
      role: "Full-time mom",
      city: "Beijing",
      avatarUrl:
        "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172065-UlbCpbdz.webp",
      content:
        "I relied on takeout before. Now the steps are so clear and voice guidance helps a lot. My tomato beef stew was a hit!",
      meta: "⭐⭐⭐⭐⭐ | 3 months | 28 dishes",
    },
    {
      name: "Jianguo Li",
      role: "Software engineer",
      city: "Shenzhen",
      avatarUrl:
        "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172080-MbORzZ4o.webp",
      content:
        "After a long day, I just want something warm. The AI custom and timers are perfect for quick, low-oil meals.",
      meta: "⭐⭐⭐⭐⭐ | 2 months | Favorite: Custom + Timer",
    },
    {
      name: "Min Zhang",
      role: "Health-conscious",
      city: "Shanghai",
      avatarUrl:
        "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172097-mXH5eYHf.webp",
      content:
        "The recipes feel trustworthy because they’re reviewed. It makes diet control much easier.",
      meta: "⭐⭐⭐⭐⭐ | 5 months | Verified result",
    },
    {
      name: "Siyuan Chen",
      role: "Overseas student",
      city: "California",
      avatarUrl:
        "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172115-2ITSzc78.webp",
      content:
        "Regional recipes bring back home flavors. Cooking them abroad feels comforting.",
      meta: "⭐⭐⭐⭐⭐ | 4 months | 15 home dishes",
    },
    {
      name: "Mr. Liu",
      role: "Retired teacher",
      city: "Chengdu",
      avatarUrl:
        "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172134-usPRQlR8.webp",
      content:
        "Voice playback and printed recipes are super helpful. I can cook without staring at my phone.",
      meta: "⭐⭐⭐⭐⭐ | 6 months | Favorite: Voice + Print",
    },
    {
      name: "Luna Foodie",
      role: "Food blogger",
      city: "Hangzhou",
      avatarUrl:
        "https://files.evolink.ai/0052ORORO24KLKPX69/raphael/2025/12/31/task-raphael-1767172155-3oXy9doV.webp",
      content:
        "The image library is amazing and free to use. The recipe steps are solid and easy to follow.",
      meta: "⭐⭐⭐⭐⭐ | 8 months | 200+ images",
    },
  ],
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
}

export function TestimonialsSection({
  items,
  locale = DEFAULT_LOCALE,
}: TestimonialsSectionProps) {
  const fallbackTestimonials =
    DEFAULT_TESTIMONIALS[locale] ?? DEFAULT_TESTIMONIALS[DEFAULT_LOCALE] ?? [];
  const testimonials = items && items.length > 0 ? items : fallbackTestimonials;
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {locale === "en" ? "Testimonials" : "用户证言"}
          </h2>
          <p className="text-textGray mt-2">
            {locale === "en"
              ? "Real voices, warmth and trust."
              : "来自真实用户的反馈，温度与专业并存。"}
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
