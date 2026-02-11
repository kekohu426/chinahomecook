// 定制食谱进度伪装文案
// 不暴露AI，伪装成专业团队在制作

export type TaskStatus =
  | "pending"
  | "recipe_generating"
  | "recipe_done"
  | "prompts_generating"
  | "images_generating"
  | "reviewing"
  | "completed"
  | "failed";

export interface PhaseInfo {
  phase: number;
  status: TaskStatus;
  title: {
    zh: string;
    en: string;
  };
  detail: {
    zh: string;
    en: string;
  };
  icon: string;
}

// 阶段配置
export const PHASE_CONFIG: Record<TaskStatus, PhaseInfo> = {
  pending: {
    phase: 0,
    status: "pending",
    title: {
      zh: "任务已提交",
      en: "Task Submitted",
    },
    detail: {
      zh: "正在排队等待处理...",
      en: "Waiting in queue...",
    },
    icon: "⏳",
  },
  recipe_generating: {
    phase: 1,
    status: "recipe_generating",
    title: {
      zh: "食谱研发中",
      en: "Recipe Development",
    },
    detail: {
      zh: "资深厨师正在研发您的专属食谱...",
      en: "Our senior chef is developing your exclusive recipe...",
    },
    icon: "👨‍🍳",
  },
  recipe_done: {
    phase: 2,
    status: "recipe_done",
    title: {
      zh: "配方已完成",
      en: "Formula Completed",
    },
    detail: {
      zh: "食谱配方已完成，正在安排摄影团队...",
      en: "Recipe formula completed, arranging photography team...",
    },
    icon: "📝",
  },
  prompts_generating: {
    phase: 3,
    status: "prompts_generating",
    title: {
      zh: "构思拍摄方案",
      en: "Planning Photo Shoot",
    },
    detail: {
      zh: "美食摄影师正在构思拍摄方案...",
      en: "Food photographer is planning the shoot...",
    },
    icon: "🎬",
  },
  images_generating: {
    phase: 4,
    status: "images_generating",
    title: {
      zh: "拍摄进行中",
      en: "Photo Shoot in Progress",
    },
    detail: {
      zh: "摄影团队正在为您拍摄精美图片...",
      en: "Photography team is capturing beautiful images...",
    },
    icon: "📸",
  },
  reviewing: {
    phase: 5,
    status: "reviewing",
    title: {
      zh: "质量审核",
      en: "Quality Review",
    },
    detail: {
      zh: "主编正在审核食谱质量...",
      en: "Chief editor is reviewing recipe quality...",
    },
    icon: "✅",
  },
  completed: {
    phase: 6,
    status: "completed",
    title: {
      zh: "制作完成",
      en: "Completed",
    },
    detail: {
      zh: "排版设计师已完成最终呈现！",
      en: "Layout designer has finalized the presentation!",
    },
    icon: "🎉",
  },
  failed: {
    phase: -1,
    status: "failed",
    title: {
      zh: "制作遇到问题",
      en: "Issue Encountered",
    },
    detail: {
      zh: "很抱歉，制作过程中遇到了问题，请重试",
      en: "Sorry, we encountered an issue. Please try again.",
    },
    icon: "⚠️",
  },
};

// 阶段内细节文案（用于动态展示）
export const PHASE_DETAILS = {
  recipe_generating: {
    zh: [
      "正在分析您的需求...",
      "挑选最佳食材搭配...",
      "调配调料比例...",
      "记录烹饪步骤...",
      "添加独家烹饪技巧...",
    ],
    en: [
      "Analyzing your requirements...",
      "Selecting the best ingredients...",
      "Adjusting seasoning ratios...",
      "Recording cooking steps...",
      "Adding exclusive cooking tips...",
    ],
  },
  images_generating: {
    zh: [
      "调整灯光和场景...",
      "布置拍摄道具...",
      "拍摄步骤图...",
      "捕捉最美角度...",
      "拍摄成品封面照...",
    ],
    en: [
      "Adjusting lighting and scene...",
      "Setting up props...",
      "Capturing step photos...",
      "Finding the perfect angle...",
      "Taking cover photo...",
    ],
  },
  reviewing: {
    zh: ["检查食材描述...", "核对步骤完整性...", "优化文案表达..."],
    en: [
      "Checking ingredient descriptions...",
      "Verifying step completeness...",
      "Optimizing text presentation...",
    ],
  },
};

// 时间线展示配置
export const TIMELINE_PHASES = [
  { status: "recipe_generating" as const, label: { zh: "食谱研发", en: "Recipe Development" } },
  { status: "prompts_generating" as const, label: { zh: "拍摄准备", en: "Photo Preparation" } },
  { status: "images_generating" as const, label: { zh: "拍摄中", en: "Photo Shoot" } },
  { status: "reviewing" as const, label: { zh: "质量审核", en: "Quality Review" } },
  { status: "completed" as const, label: { zh: "最终呈现", en: "Final Presentation" } },
];

// 进度权重配置（用于计算总体百分比）
export const PHASE_WEIGHTS: Record<number, number> = {
  0: 0,   // pending
  1: 20,  // recipe_generating
  2: 25,  // recipe_done
  3: 35,  // prompts_generating
  4: 85,  // images_generating (主要耗时)
  5: 95,  // reviewing
  6: 100, // completed
};

// 计算总体进度百分比
export function calculateOverallProgress(
  currentPhase: number,
  phaseProgress: number,
  totalImages: number,
  imagesDone: number
): number {
  const baseProgress = PHASE_WEIGHTS[currentPhase - 1] || 0;
  const nextProgress = PHASE_WEIGHTS[currentPhase] || 100;
  const phaseRange = nextProgress - baseProgress;

  // 图片生成阶段使用实际图片进度
  let actualPhaseProgress = phaseProgress;
  if (currentPhase === 4 && totalImages > 0) {
    actualPhaseProgress = Math.round((imagesDone / totalImages) * 100);
  }

  return Math.round(baseProgress + (phaseRange * actualPhaseProgress) / 100);
}

// 获取图片进度文案
export function getImageProgressText(
  imagesDone: number,
  totalImages: number,
  locale: "zh" | "en"
): string {
  if (totalImages === 0) {
    return locale === "zh" ? "准备中..." : "Preparing...";
  }
  return locale === "zh"
    ? `第 ${imagesDone}/${totalImages} 张`
    : `${imagesDone} of ${totalImages}`;
}

// 预估剩余时间
export function getEstimatedTime(
  currentPhase: number,
  totalImages: number,
  imagesDone: number,
  locale: "zh" | "en"
): string {
  // 每张图片约15秒
  const remainingImages = totalImages - imagesDone;
  const imageTime = remainingImages * 15;

  // 其他阶段时间
  let otherTime = 0;
  if (currentPhase <= 1) otherTime += 30; // 食谱生成
  if (currentPhase <= 3) otherTime += 15; // 提示词生成
  if (currentPhase <= 5) otherTime += 5; // 审核

  const totalSeconds = imageTime + otherTime;

  if (totalSeconds < 60) {
    return locale === "zh" ? "即将完成" : "Almost done";
  }

  const minutes = Math.ceil(totalSeconds / 60);
  return locale === "zh" ? `约 ${minutes} 分钟` : `About ${minutes} min`;
}
