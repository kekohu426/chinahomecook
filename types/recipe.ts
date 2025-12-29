/**
 * 食谱数据类型定义
 *
 * 🚨 重要：严格遵循 PRD Schema v1.1.0
 * 与 lib/validators/recipe.ts 的 Zod Schema 保持完全一致
 *
 * 参考文档：docs/SCHEMA_VALIDATION.md
 */

// ==================== PRD Schema v1.1.0 ====================

// 难度枚举
export type Difficulty = "easy" | "medium" | "hard";

// 图标键枚举（用于食材分类）
export type IconKey =
  | "meat"      // 肉类
  | "veg"       // 蔬菜
  | "fruit"     // 水果
  | "seafood"   // 海鲜
  | "grain"     // 谷物
  | "bean"      // 豆类
  | "dairy"     // 乳制品
  | "egg"       // 蛋类
  | "spice"     // 香料
  | "sauce"     // 酱料
  | "oil"       // 油脂
  | "other";    // 其他

// 图片比例枚举
export type ImageRatio = "16:9" | "4:3" | "3:2";

// ==================== 食谱主结构 ====================

export interface Recipe {
  // Schema版本（必填）
  schemaVersion: "1.1.0";

  // 标题（必填）
  titleZh: string;        // 中文标题（例：啤酒鸭）
  titleEn?: string;       // 英文标题（可选，例：Beer Braised Duck）

  // 摘要信息（PRD v1.1.0）
  summary: RecipeSummary;

  // 文化故事（PRD v1.1.0）
  story: RecipeStory;

  // 食材清单（PRD v1.1.0）
  ingredients: IngredientSection[];

  // 制作步骤（PRD v1.1.0）
  steps: RecipeStep[];

  // 风格指南（PRD v1.1.0）
  styleGuide: StyleGuide;

  // 配图方案（PRD v1.1.0）
  imageShots: ImageShot[];
}

// ==================== 摘要信息 ====================

export interface RecipeSummary {
  oneLine: string;         // 一句话描述（例：麦香与肉脂的微醺共舞）
  healingTone: string;     // 治愈文案（例：家的味道，总在啤酒香里藏着）
  difficulty: Difficulty;  // 难度（easy/medium/hard）
  timeTotalMin: number;    // 总耗时（分钟）
  timeActiveMin: number;   // 操作时间（分钟）
  servings: number;        // 基准份量（例：3）
}

// ==================== 文化故事 ====================

export interface RecipeStory {
  title: string;           // 故事标题（例：啤酒鸭的前世今生）
  content: string;         // 故事正文
  tags: string[];          // 标签（例：["川菜", "家常菜", "肉类"]）
}

// ==================== 食材清单 ====================

export interface IngredientSection {
  section: string;         // 分组名称（例：主料、配料）
  items: IngredientItem[]; // 食材列表
}

export interface IngredientItem {
  name: string;            // 食材名称（例：鸭肉）
  iconKey: IconKey;        // 图标键（例：meat）
  amount: number;          // 数量（例：750）
  unit: string;            // 单位（例：克）
  notes?: string;          // 备注（可选，例：半只）
}

// ==================== 制作步骤 ====================

export interface RecipeStep {
  id: string;              // 步骤ID（例：step01）
  title: string;           // 步骤标题（例：冷水焯鸭去腥）
  action: string;          // 详细操作描述
  speechText: string;      // 语音朗读文本（用于 COOK NOW 模式）
  timerSec: number;        // 计时器时长（秒，0表示无计时器）
  visualCue: string;       // 视觉状态检查提示（例：水面浮起灰色浮沫）
  failPoint: string;       // 失败点提示（例：煮太久肉质变老）
  photoBrief: string;      // 配图简述（用于AI生图）
}

// ==================== 风格指南 ====================

export interface StyleGuide {
  theme: string;           // 主题风格（例：治愈系暖调）
  lighting: string;        // 光线要求（例：自然光）
  composition: string;     // 构图风格（例：留白构图）
  aesthetic: string;       // 美学风格（例：吉卜力风格）
}

// ==================== 配图方案 ====================

export interface ImageShot {
  key: string;             // 图片键（例：cover, step01, final）
  imagePrompt: string;     // AI生图提示词
  ratio: ImageRatio;       // 图片比例（16:9, 4:3, 3:2）
  imageUrl?: string;       // AI生成的图片URL (扩展字段)
}

// ==================== UI 相关类型 ====================

// 计时器状态
export interface TimerState {
  isActive: boolean;       // 是否运行中
  timeLeft: number;        // 剩余时间（秒）
  stepId: string;          // 所属步骤ID
  label: string;           // 显示标签
}

// 全屏烹饪模式状态
export interface CookModeState {
  isFullscreen: boolean;   // 是否全屏
  currentStepIndex: number; // 当前步骤索引
  timer: TimerState | null; // 计时器状态
}

// AI主厨对话
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ==================== 数据库模型类型（扩展字段） ====================

export interface RecipeDB extends Recipe {
  id: string;              // 数据库ID
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
  author?: string;         // 作者
  isPublished: boolean;    // 是否发布
  viewCount: number;       // 浏览次数
}

// ==================== 图标映射配置 ====================

export const ICON_KEY_TO_EMOJI: Record<IconKey, string> = {
  meat: "🍖",
  veg: "🥬",
  fruit: "🍎",
  seafood: "🦐",
  grain: "🌾",
  bean: "🫘",
  dairy: "🥛",
  egg: "🥚",
  spice: "🌶️",
  sauce: "🍯",
  oil: "🫒",
  other: "📦"
};

export const ICON_KEY_TO_BG_COLOR: Record<IconKey, string> = {
  meat: "bg-rose-100",
  veg: "bg-green-100",
  fruit: "bg-orange-100",
  seafood: "bg-blue-100",
  grain: "bg-amber-100",
  bean: "bg-lime-100",
  dairy: "bg-indigo-100",
  egg: "bg-yellow-100",
  spice: "bg-red-100",
  sauce: "bg-purple-100",
  oil: "bg-emerald-100",
  other: "bg-gray-100"
};

// ==================== 难度映射配置 ====================

export const DIFFICULTY_TO_LABEL: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难"
};

export const DIFFICULTY_TO_COLOR: Record<Difficulty, string> = {
  easy: "text-green-600",
  medium: "text-yellow-600",
  hard: "text-red-600"
};

// ==================== 比例映射配置 ====================

export const RATIO_TO_ASPECT: Record<ImageRatio, string> = {
  "16:9": "aspect-video",      // Tailwind: aspect-video
  "4:3": "aspect-[4/3]",       // Tailwind: aspect-[4/3]
  "3:2": "aspect-[3/2]"        // Tailwind: aspect-[3/2]
};
