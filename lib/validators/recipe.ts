/**
 * Recipe Schema 验证器
 *
 * Schema v2.0.0 - 完整版
 * 支持文化故事、营养信息、FAQ、SEO等完整字段
 */

import { z } from "zod";

// ==================== 枚举定义 ====================

const DifficultyEnum = z.enum(["easy", "medium", "hard"]);

const HeatEnum = z.enum([
  "low",
  "medium-low",
  "medium",
  "medium-high",
  "high",
]);

const IconKeyEnum = z.enum([
  "meat",     // 肉类
  "veg",      // 蔬菜
  "fruit",    // 水果
  "seafood",  // 海鲜
  "grain",    // 谷物
  "bean",     // 豆类
  "dairy",    // 奶制品
  "egg",      // 蛋类
  "spice",    // 香料
  "sauce",    // 酱料
  "oil",      // 油脂
  "tool",     // 工具（会自动转为other）
  "other",    // 其他
]);

const RatioEnum = z.enum(["16:9", "4:3", "3:2"]);

// ==================== Origin（产地信息）====================

const OriginSchema = z.object({
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).optional();

// ==================== Summary（摘要）====================

const SummarySchema = z.object({
  oneLine: z.string().min(1, "一句话简介不能为空"),
  healingTone: z.string().min(1, "治愈文案不能为空"),
  flavorTags: z.array(z.string()).optional(),
  difficulty: DifficultyEnum,
  timeTotalMin: z.number().positive("总时间必须大于0"),
  timeActiveMin: z.number().positive("操作时间必须大于0"),
  servings: z.number().positive("份量必须大于0"),
  scaleHint: z.string().optional(),
});

// ==================== Story（文化故事）====================

// 支持两种格式：对象格式（v1.1.0）和字符串格式（v2.0.0 culturalStory）
const StorySchema = z.union([
  // v1.1.0 对象格式
  z.object({
    title: z.string().min(1, "故事标题不能为空"),
    content: z.string().min(20, "故事内容至少20字"),
    tags: z.array(z.string()).optional(),
  }),
  // v2.0.0 字符串格式
  z.string().min(20, "文化故事至少20字"),
]);

// ==================== Nutrition（营养信息）====================

const NutritionPerServingSchema = z.object({
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(),
}).optional();

const NutritionSchema = z.union([
  // v2.0.0 完整格式
  z.object({
    perServing: NutritionPerServingSchema,
    dietaryLabels: z.array(z.string()).optional(),
    disclaimer: z.string().optional(),
  }),
  // v1.1.0 扁平格式
  z.object({
    calories: z.number().nonnegative().optional(),
    protein: z.number().nonnegative().optional(),
    fat: z.number().nonnegative().optional(),
    carbs: z.number().nonnegative().optional(),
    fiber: z.number().nonnegative().optional(),
    sodium: z.number().nonnegative().optional(),
  }),
]).optional();

// ==================== Equipment（设备清单）====================

const EquipmentItemSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

const EquipmentSchema = z.array(EquipmentItemSchema).optional();

// ==================== Ingredients（食材）====================

const IngredientItemSchema = z.object({
  name: z.string().min(1, "食材名称不能为空"),
  iconKey: IconKeyEnum.optional(),
  amount: z.number().positive("数量必须大于0"),
  unit: z.string().min(1, "单位不能为空"),
  prep: z.string().nullable().optional(),
  optional: z.boolean().optional(),
  substitutes: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

const IngredientSectionSchema = z.object({
  section: z.string().min(1, "分组名称不能为空"),
  items: z.array(IngredientItemSchema).min(1, "至少需要1个食材"),
});

const IngredientsSchema = z.array(IngredientSectionSchema).min(1, "至少需要1个食材分组");

// ==================== Steps（制作步骤）====================

const StepSchema = z.object({
  id: z.string().min(1, "步骤ID不能为空"),
  title: z.string().min(1, "步骤标题不能为空"),
  action: z.string().min(1, "步骤描述不能为空"),

  // v1.1.0 字段
  speechText: z.string().optional(),
  timerSec: z.number().nonnegative().optional().default(0),
  visualCue: z.string().optional(),
  failPoint: z.string().optional(),
  photoBrief: z.string().optional(),

  // v2.0.0 新增字段
  heat: HeatEnum.optional(),
  timeMin: z.number().nonnegative().optional(),
  timeMax: z.number().nonnegative().optional(),
  statusChecks: z.array(z.string()).optional(),
  failurePoints: z.array(z.string()).optional(),
  recovery: z.string().optional(),
  safeNote: z.string().nullable().optional(),

  // 图片相关
  imagePrompt: z.string().optional(),
  negativePrompt: z.string().optional(),

  // 关联
  ingredientRefs: z.array(z.string()).optional(),
  equipmentRefs: z.array(z.string()).optional(),
});

const StepsSchema = z.array(StepSchema).min(1, "至少需要1个步骤");

// ==================== FAQ（常见问题）====================

const FAQItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const FAQSchema = z.array(FAQItemSchema).optional();

// ==================== Troubleshooting（失败排查）====================

const TroubleshootingItemSchema = z.object({
  problem: z.string().min(1),
  cause: z.string().min(1),
  fix: z.string().min(1),
});

const TroubleshootingSchema = z.array(TroubleshootingItemSchema).optional();

// ==================== RelatedRecipes（相关推荐）====================

const RelatedRecipesSchema = z.object({
  similar: z.array(z.string()).optional(),
  pairing: z.array(z.string()).optional(),
}).optional();

// ==================== Pairing（搭配建议）====================

const PairingSchema = z.object({
  suggestions: z.array(z.string()).optional(),
  sauceOrSide: z.array(z.string()).optional(),
}).optional();

// ==================== StyleGuide（风格指南）====================

const StyleGuideSchema = z.object({
  // v1.1.0 字段
  theme: z.string().optional(),
  lighting: z.string().optional(),
  composition: z.string().optional(),
  aesthetic: z.string().optional(),

  // v2.0.0 新增字段
  visualTheme: z.string().optional(),
  palette: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  props: z.array(z.string()).optional(),
  compositionRules: z.array(z.string()).optional(),
  imageRatios: z.object({
    cover: z.string().optional(),
    step: z.string().optional(),
    ingredientsFlatlay: z.string().optional(),
  }).optional(),
});

// ==================== ImageShots（配图方案）====================

const ImageShotSchema = z.object({
  key: z.string().min(1, "图片key不能为空"),
  title: z.string().optional(),
  imagePrompt: z.string().min(1, "AI提示词不能为空"),
  negativePrompt: z.string().optional(),
  ratio: RatioEnum,
  imageUrl: z.string().optional(),
});

const ImageShotsSchema = z.array(ImageShotSchema);

// ==================== SEO ====================

const SEOSchema = z.object({
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
}).optional();

// ==================== Tags（标签信息）====================

const TagsSchema = z.object({
  scenes: z.array(z.string()).optional(),
  cookingMethods: z.array(z.string()).optional(),
  tastes: z.array(z.string()).optional(),
  crowds: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
}).optional();

// ==================== 完整 Recipe Schema ====================

export const RecipeSchema = z.object({
  // 版本 - 支持1.1.0和2.0.0
  schemaVersion: z.string().optional(),

  // 基本信息
  id: z.string().optional(),
  titleZh: z.string().min(1, "中文标题不能为空"),
  titleEn: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),

  // 产地
  origin: OriginSchema,

  // 核心内容
  summary: SummarySchema,
  story: StorySchema.optional(),
  culturalStory: z.string().optional(), // v2.0.0 别名

  // 营养信息
  nutrition: NutritionSchema,

  // 设备和食材
  equipment: EquipmentSchema,
  ingredients: IngredientsSchema,

  // 步骤
  steps: StepsSchema,

  // FAQ和问题排查
  faq: FAQSchema,
  tips: z.array(z.string()).optional(),
  troubleshooting: TroubleshootingSchema,

  // 推荐和搭配
  relatedRecipes: RelatedRecipesSchema,
  pairing: PairingSchema,

  // 视觉
  styleGuide: StyleGuideSchema,
  imageShots: ImageShotsSchema,

  // SEO
  seo: SEOSchema,

  // 标签
  tags: TagsSchema,

  // 备注
  notes: z.array(z.string()).optional(),
});

// ==================== 类型导出 ====================

export type RecipeData = z.infer<typeof RecipeSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type IngredientItem = z.infer<typeof IngredientItemSchema>;
export type IngredientSection = z.infer<typeof IngredientSectionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type StyleGuide = z.infer<typeof StyleGuideSchema>;
export type ImageShot = z.infer<typeof ImageShotSchema>;
export type Nutrition = z.infer<typeof NutritionSchema>;
export type FAQ = z.infer<typeof FAQItemSchema>;

// ==================== 验证函数 ====================

/**
 * 验证食谱数据是否符合 Schema
 */
export function validateRecipe(data: unknown): RecipeData {
  return RecipeSchema.parse(data);
}

/**
 * 安全验证（返回结果而非抛出异常）
 */
export function safeValidateRecipe(data: unknown) {
  return RecipeSchema.safeParse(data);
}

/**
 * 仅验证 Summary
 */
export function validateSummary(data: unknown) {
  return SummarySchema.parse(data);
}

/**
 * 仅验证 Ingredients
 */
export function validateIngredients(data: unknown) {
  return IngredientsSchema.parse(data);
}

/**
 * 仅验证 Steps
 */
export function validateSteps(data: unknown) {
  return StepsSchema.parse(data);
}
