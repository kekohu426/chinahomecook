import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { CheckCircle, Target, Clock, Users } from "lucide-react";

// 图标映射
const ICON_MAP: Record<string, React.ReactNode> = {
  check: <CheckCircle className="w-12 h-12 text-brownWarm" />,
  target: <Target className="w-12 h-12 text-brownWarm" />,
  clock: <Clock className="w-12 h-12 text-brownWarm" />,
  users: <Users className="w-12 h-12 text-brownWarm" />,
};

// 默认配置（作为 fallback）
const DEFAULT_FEATURES = [
  { icon: "check", title: "专业审核", description: "每道菜谱都经过人工审核，保证质量。" },
  { icon: "target", title: "步骤清晰", description: "语音+计时辅助，不怕出错，操作更顺畅。" },
  { icon: "clock", title: "节省时间", description: "3分钟找到今天要做的菜，简化决策流程。" },
  { icon: "users", title: "家庭友好", description: "家常口味，适合孩子和长辈的需求。" },
];

const DEFAULT_TITLE = "为什么选择 Recipe Zen";

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
  const displayTitle = title ?? DEFAULT_TITLE;
  const displayFeatures = features ?? DEFAULT_FEATURES;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-textDark">
            {displayTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayFeatures.map((feature) => (
            <div
              key={feature.title}
              className="text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                {ICON_MAP[feature.icon] ?? ICON_MAP.check}
              </div>
              <h3 className="text-xl font-medium text-textDark">{feature.title}</h3>
              <p className="text-sm text-textGray leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
