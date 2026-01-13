import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const STEPS: Partial<Record<Locale, {
  title: string;
  description: string;
  example: string;
  icon: string;
}[]>> = {
  zh: [
    {
      title: "告诉我们你想做什么",
      description: "输入需求或浏览分类，快速给出方向。",
      example: "例如：我有鸡蛋和西红柿",
      icon: "1️⃣",
    },
    {
      title: "获得详细食谱",
      description: "智能推荐 + 团队审核，把关可复现。",
      example: "番茄炒蛋完整步骤",
      icon: "2️⃣",
    },
    {
      title: "工具辅助烹饪",
      description: "语音朗读 + 计时提醒，做饭更轻松。",
      example: "烹饪模式界面预览",
      icon: "3️⃣",
    },
    {
      title: "做出家的味道",
      description: "完成后可分享给家人朋友。",
      example: "真实用户成品",
      icon: "4️⃣",
    },
  ],
  en: [
    {
      title: "Tell us what you want",
      description: "Type your needs or browse categories.",
      example: "Example: eggs and tomatoes",
      icon: "1️⃣",
    },
    {
      title: "Get detailed recipes",
      description: "Smart recommendations + expert review.",
      example: "Tomato scrambled eggs steps",
      icon: "2️⃣",
    },
    {
      title: "Cook with tools",
      description: "Voice + timers keep it easy.",
      example: "Cooking mode preview",
      icon: "3️⃣",
    },
    {
      title: "Serve the comfort",
      description: "Share results with family and friends.",
      example: "Real user dishes",
      icon: "4️⃣",
    },
  ],
};

export function ValueLoopSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const steps = STEPS[locale] ?? STEPS[DEFAULT_LOCALE] ?? [];
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {locale === "en" ? "From idea to plate in 4 steps" : "从想法到成品，4 步搞定"}
          </h2>
          <p className="text-textGray mt-2">
            {locale === "en"
              ? "Clear steps that make cooking feel easy."
              : "把做饭拆成清晰步骤，每一步都更安心。"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl border border-cream shadow-card p-6 flex flex-col gap-3"
            >
              <div className="text-2xl">{step.icon}</div>
              <h3 className="text-lg font-medium text-textDark">{step.title}</h3>
              <p className="text-sm text-textGray">{step.description}</p>
              <p className="text-xs text-textGray/80">{step.example}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <LocalizedLink
            href="/ai-custom"
            className="px-6 py-3 bg-brownWarm text-white rounded-full font-medium hover:bg-brownDark transition-colors"
          >
            {locale === "en" ? "Get Started" : "立即开始"}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
