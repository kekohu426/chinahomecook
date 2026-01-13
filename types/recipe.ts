/**
 * 食谱数据类型定义
 *
 * Schema v2.0.0 - 完整版
 * 支持文化故事、营养信息、FAQ、SEO等完整字段
 */

// ==================== 枚举类型 ====================

// 难度枚举
export type Difficulty = "easy" | "medium" | "hard";

// 火候枚举
export type Heat = "low" | "medium-low" | "medium" | "medium-high" | "high";

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
  | "tool"      // 工具
  | "other";    // 其他

// 图片比例枚举
export type ImageRatio = "16:9" | "4:3" | "3:2";

// ==================== 食谱主结构 ====================

export interface Recipe {
  // Schema版本
  schemaVersion?: string;

  // 基本信息
  id?: string;
  titleZh: string;
  titleEn?: string | null;
  aliases?: string[];

  // 产地信息
  origin?: RecipeOrigin;

  // 摘要信息
  summary: RecipeSummary;

  // 文化故事（支持对象或字符串）
  story?: RecipeStory | string;
  culturalStory?: string;

  // 营养信息
  nutrition?: RecipeNutrition;

  // 设备清单
  equipment?: EquipmentItem[];

  // 食材清单
  ingredients: IngredientSection[];

  // 制作步骤
  steps: RecipeStep[];

  // FAQ
  faq?: FAQItem[];

  // 烹饪小贴士
  tips?: string[];

  // 失败排查
  troubleshooting?: TroubleshootingItem[];

  // 相关推荐
  relatedRecipes?: RelatedRecipes;

  // 搭配建议
  pairing?: PairingInfo;

  // 风格指南
  styleGuide: StyleGuide;

  // 配图方案
  imageShots: ImageShot[];

  // SEO
  seo?: RecipeSEO;

  // 标签信息
  tags?: RecipeTags;

  // 备注
  notes?: string[];
}

// ==================== 产地信息 ====================

export interface RecipeOrigin {
  country?: string | null;
  region?: string | null;
  notes?: string | null;
}

// ==================== 摘要信息 ====================

export interface RecipeSummary {
  oneLine: string;
  healingTone: string;
  flavorTags?: string[];
  difficulty: Difficulty;
  timeTotalMin: number;
  timeActiveMin: number;
  servings: number;
  scaleHint?: string;
}

// ==================== 文化故事 ====================

export interface RecipeStory {
  title: string;
  content: string;
  tags?: string[];
}

// ==================== 营养信息 ====================

export interface NutritionPerServing {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
}

export interface RecipeNutrition {
  // v2.0.0 格式
  perServing?: NutritionPerServing;
  dietaryLabels?: string[];
  disclaimer?: string;
  // v1.1.0 扁平格式（向后兼容）
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sodium?: number;
}

// ==================== 设备清单 ====================

export interface EquipmentItem {
  name: string;
  required?: boolean;
  notes?: string | null;
}

// ==================== 食材清单 ====================

export interface IngredientSection {
  section: string;
  items: IngredientItem[];
}

export interface IngredientItem {
  name: string;
  iconKey?: IconKey;
  amount: number;
  unit: string;
  prep?: string | null;
  optional?: boolean;
  substitutes?: string[];
  allergens?: string[];
  notes?: string | null;
}

// ==================== 制作步骤 ====================

export interface RecipeStep {
  id: string;
  title: string;
  action: string;

  // v1.1.0 字段
  speechText?: string;
  timerSec?: number;
  visualCue?: string;
  failPoint?: string;
  photoBrief?: string;

  // v2.0.0 新增字段
  heat?: Heat;
  timeMin?: number;
  timeMax?: number;
  statusChecks?: string[];
  failurePoints?: string[];
  recovery?: string;
  safeNote?: string | null;

  // 图片相关
  imagePrompt?: string;
  negativePrompt?: string;

  // 关联
  ingredientRefs?: string[];
  equipmentRefs?: string[];
}

// ==================== FAQ ====================

export interface FAQItem {
  question: string;
  answer: string;
}

// ==================== 失败排查 ====================

export interface TroubleshootingItem {
  problem: string;
  cause: string;
  fix: string;
}

// ==================== 相关推荐 ====================

export interface RelatedRecipes {
  similar?: string[];
  pairing?: string[];
}

// ==================== 搭配建议 ====================

export interface PairingInfo {
  suggestions?: string[];
  sauceOrSide?: string[];
}

// ==================== 风格指南 ====================

export interface StyleGuide {
  // v1.1.0 字段
  theme?: string;
  lighting?: string;
  composition?: string;
  aesthetic?: string;

  // v2.0.0 新增字段
  visualTheme?: string;
  palette?: string[];
  materials?: string[];
  props?: string[];
  compositionRules?: string[];
  imageRatios?: {
    cover?: string;
    step?: string;
    ingredientsFlatlay?: string;
  };
}

// ==================== 配图方案 ====================

export interface ImageShot {
  key: string;
  title?: string;
  imagePrompt: string;
  negativePrompt?: string;
  ratio: ImageRatio;
  imageUrl?: string;
}

// ==================== SEO ====================

export interface RecipeSEO {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

// ==================== 标签信息 ====================

export interface RecipeTags {
  scenes?: string[];
  cookingMethods?: string[];
  tastes?: string[];
  crowds?: string[];
  occasions?: string[];
}

// ==================== UI 相关类型 ====================

// 计时器状态
export interface TimerState {
  isActive: boolean;
  timeLeft: number;
  stepId: string;
  label: string;
}

// 全屏烹饪模式状态
export interface CookModeState {
  isFullscreen: boolean;
  currentStepIndex: number;
  timer: TimerState | null;
}

// AI主厨对话
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ==================== 数据库模型类型（扩展字段） ====================

export interface RecipeDB extends Recipe {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  isPublished: boolean;
  viewCount: number;
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
  tool: "🔧",
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
  tool: "bg-slate-100",
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

// ==================== 火候映射配置 ====================

export const HEAT_TO_LABEL: Record<Heat, string> = {
  low: "小火",
  "medium-low": "中小火",
  medium: "中火",
  "medium-high": "中大火",
  high: "大火"
};

// ==================== 比例映射配置 ====================

export const RATIO_TO_ASPECT: Record<ImageRatio, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "3:2": "aspect-[3/2]"
};
