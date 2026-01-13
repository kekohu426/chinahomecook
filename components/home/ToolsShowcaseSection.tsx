import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

// 默认配置
const DEFAULT_CONFIG = {
  title: "让做饭更轻松的智能工具",
  subtitle: "从烹饪模式到语音提醒，让每一步都更从容。",
  cookMode: {
    title: "烹饪模式",
    features: [
      "大字体步骤显示，远距离也能看清",
      "单步骤智能计时，声音提醒不忘记",
      "语音朗读步骤，解放双手边听边做",
      "支持中英文语音朗读",
    ],
    ctaLabel: "立即体验 →",
    ctaHref: "/recipe",
  },
  toolkit: {
    title: "实用工具集",
    features: [
      "图文打印：完整步骤+配图，贴在厨房也方便",
      "语音朗读：手上有面粉也能跟着做",
      "智能计时：精准提醒，不怕错过火候",
      "背景音乐：内置轻音乐，烹饪氛围更轻松",
      "一键分享：和家人朋友一起学做菜",
    ],
    ctaLabel: "查看所有功能 →",
    ctaHref: "/recipe",
  },
};

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
  const displayTitle = title ?? DEFAULT_CONFIG.title;
  const displaySubtitle = subtitle ?? DEFAULT_CONFIG.subtitle;
  const displayCookMode = cookMode ?? DEFAULT_CONFIG.cookMode;
  const displayToolkit = toolkit ?? DEFAULT_CONFIG.toolkit;

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-8 space-y-12">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {displayTitle}
          </h2>
          <p className="text-textGray mt-2">{displaySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="rounded-3xl border border-cream bg-white p-6 shadow-card">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
              <div className="text-center">
                <div className="text-4xl mb-2">🍳</div>
                <p className="text-sm">
                  {locale === "en" ? "Cook mode preview" : "烹饪模式预览"}
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
                <li key={index}>• {feature}</li>
              ))}
            </ul>
            <LocalizedLink href={displayCookMode.ctaHref} className="text-brownWarm font-medium">
              {displayCookMode.ctaLabel}
            </LocalizedLink>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="order-2 lg:order-1 space-y-4">
            <h3 className="text-xl font-medium text-textDark">
              {displayToolkit.title}
            </h3>
            <ul className="space-y-2 text-sm text-textGray">
              {displayToolkit.features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
            <LocalizedLink href={displayToolkit.ctaHref} className="text-brownWarm font-medium">
              {displayToolkit.ctaLabel}
            </LocalizedLink>
          </div>

          <div className="order-1 lg:order-2 rounded-3xl border border-cream bg-white p-6 shadow-card">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cream via-white to-orangeAccent/20 flex items-center justify-center text-textGray">
              <div className="text-center">
                <div className="text-4xl mb-2">🛠️</div>
                <p className="text-sm">
                  {locale === "en" ? "Toolkit preview" : "工具界面预览"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
