/**
 * Collection 类型定义
 *
 * 核心口径复述：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 进度：progress = publishedCount / targetCount * 100
 * 3. 规则优先级：组间 AND → 组内 logic → NOT；空组/空条件忽略
 * 4. 缓存 vs 实时：列表用 cached*，详情/测试用实时
 */

// ==================== 枚举 ====================

/** 集合类型 */
export const CollectionType = {
  CUISINE: 'cuisine',       // 菜系
  REGION: 'region',         // 区域/地域
  SCENE: 'scene',           // 场景
  METHOD: 'method',         // 烹饪方法
  TASTE: 'taste',           // 口味
  CROWD: 'crowd',           // 人群/饮食方式
  OCCASION: 'occasion',     // 场合
  INGREDIENT: 'ingredient', // 食材
  THEME: 'theme',           // 主题（自定义规则）
} as const;

export type CollectionType = typeof CollectionType[keyof typeof CollectionType];

/** 集合类型到 URL 路径的映射 */
export const CollectionTypePath: Record<CollectionType, string> = {
  cuisine: '/recipe/cuisine',
  region: '/recipe/region',
  scene: '/recipe/scene',
  method: '/recipe/method',
  taste: '/recipe/taste',
  crowd: '/recipe/dietary',
  occasion: '/recipe/occasion',
  ingredient: '/recipe/ingredient',
  theme: '/recipe/theme',
};

/** 集合类型中文名 */
export const CollectionTypeLabel: Record<CollectionType, string> = {
  cuisine: '菜系',
  region: '区域',
  scene: '场景',
  method: '烹饪方法',
  taste: '口味',
  crowd: '人群',
  occasion: '场合',
  ingredient: '食材',
  theme: '主题',
};

/** 集合状态 */
export const CollectionStatus = {
  DRAFT: 'draft',           // 草稿
  PUBLISHED: 'published',   // 已发布
  ARCHIVED: 'archived',     // 已归档
} as const;

export type CollectionStatus = typeof CollectionStatus[keyof typeof CollectionStatus];

/** 集合状态中文名 */
export const CollectionStatusLabel: Record<CollectionStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

/** 规则类型 */
export const RuleType = {
  AUTO: 'auto',             // 单标签自动匹配
  CUSTOM: 'custom',         // 主题自定义规则
} as const;

export type RuleType = typeof RuleType[keyof typeof RuleType];

/** 达标状态（计算得出，非存储） */
export const QualifiedStatus = {
  QUALIFIED: 'qualified',       // 已达标 (publishedCount >= minRequired)
  UNQUALIFIED: 'unqualified',   // 未达标
  NEAR: 'near',                 // 接近达标 (80% <= progress < 100%)
} as const;

export type QualifiedStatus = typeof QualifiedStatus[keyof typeof QualifiedStatus];

// ==================== 规则结构 ====================

/** 规则字段类型 */
export const RuleField = {
  CUISINE_ID: 'cuisineId',
  LOCATION_ID: 'locationId',
  TAG_ID: 'tagId',
  TAG: 'tag',                 // 需配合 tagType
  COOK_TIME: 'cookTime',
  PREP_TIME: 'prepTime',
  DIFFICULTY: 'difficulty',
  SERVINGS: 'servings',
} as const;

export type RuleField = typeof RuleField[keyof typeof RuleField];

/** 标签类型（用于 tag 字段） */
export const TagType = {
  SCENE: 'scene',
  TASTE: 'taste',
  METHOD: 'method',
  CROWD: 'crowd',
  OCCASION: 'occasion',
  INGREDIENT: 'ingredient',
} as const;

export type TagType = typeof TagType[keyof typeof TagType];

/** 操作符 */
export const RuleOperator = {
  EQ: 'eq',       // 等于
  NEQ: 'neq',     // 不等于
  IN: 'in',       // 在列表中
  NIN: 'nin',     // 不在列表中
  LT: 'lt',       // 小于
  LTE: 'lte',     // 小于等于
  GT: 'gt',       // 大于
  GTE: 'gte',     // 大于等于
} as const;

export type RuleOperator = typeof RuleOperator[keyof typeof RuleOperator];

/** 单个条件 */
export interface RuleCondition {
  field: RuleField | string;
  operator: RuleOperator | string;
  value: string | number | string[];
  tagType?: TagType | string;  // 当 field='tag' 时必填
}

/** 规则组（组内条件的逻辑关系） */
export interface RuleGroup {
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

/** 单标签模式规则 */
export interface AutoRuleConfig {
  mode: 'auto';
  field: 'cuisineId' | 'locationId' | 'tagId';
  value: string;              // 关联的 ID
  tagType?: TagType | string; // 当 field='tagId' 时，标签的类型
}

/** 主题模式规则 */
export interface CustomRuleConfig {
  mode: 'custom';
  groups: RuleGroup[];        // 规则组列表，组间为 AND 关系
  exclude: RuleCondition[];   // 排除条件（NOT）
}

/** 规则配置（联合类型） */
export type RuleConfig = AutoRuleConfig | CustomRuleConfig;

/** 空规则（默认值） */
export const EMPTY_RULE: CustomRuleConfig = {
  mode: 'custom',
  groups: [],
  exclude: [],
};

/** 判断是否为 Auto 规则 */
export function isAutoRule(rule: RuleConfig): rule is AutoRuleConfig {
  return rule.mode === 'auto';
}

/** 判断是否为 Custom 规则 */
export function isCustomRule(rule: RuleConfig): rule is CustomRuleConfig {
  return rule.mode === 'custom';
}

// ==================== SEO 结构 ====================

/** SEO 配置 */
export interface SeoConfig {
  // 元数据
  titleZh?: string;           // SEO标题（中文），建议 ≤60 字符
  titleEn?: string;           // SEO标题（英文）
  descriptionZh?: string;     // Meta描述（中文），建议 ≤160 字符
  descriptionEn?: string;     // Meta描述（英文）
  keywords?: string[];        // 关键词列表

  // 页面标题
  h1Zh?: string;              // H1标题（中文）
  h1En?: string;              // H1标题（英文）
  subtitleZh?: string;        // 副标题（中文）
  subtitleEn?: string;        // 副标题（英文）

  // 底部文案
  footerTextZh?: string;      // 底部收口文案（中文）
  footerTextEn?: string;      // 底部收口文案（英文）

  // 结构化数据
  schemaType?: 'CollectionPage' | 'ItemList' | 'WebPage';
  autoJsonLd?: boolean;       // 是否自动生成 JSON-LD，默认 true

  // 索引设置
  noIndex?: boolean;          // 是否禁止索引，默认 false
  sitemapPriority?: number;   // Sitemap 优先级 0-1，默认 0.7
  changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

/** SEO 默认值 */
export const DEFAULT_SEO: SeoConfig = {
  schemaType: 'CollectionPage',
  autoJsonLd: true,
  noIndex: false,
  sitemapPriority: 0.7,
  changeFreq: 'weekly',
};

/** SEO 字段限制 */
export const SEO_LIMITS = {
  TITLE_MAX: 60,
  TITLE_WARN: 50,
  DESC_MAX: 160,
  DESC_WARN: 120,
  KEYWORDS_MAX: 10,
  FOOTER_MAX: 500,
};

// ==================== 计算函数 ====================

/**
 * 计算进度百分比
 * 口径：progress = publishedCount / targetCount * 100
 */
export function calculateProgress(publishedCount: number, targetCount: number): number {
  if (targetCount <= 0) return 0;
  return Math.round((publishedCount / targetCount) * 100);
}

/**
 * 计算达标状态
 * 口径：
 * - qualified: publishedCount >= minRequired
 * - near: 80% <= progress < 100% 且未达标
 * - unqualified: 其他
 */
export function calculateQualifiedStatus(
  publishedCount: number,
  minRequired: number,
  targetCount: number
): QualifiedStatus {
  // 达标判定：仅看 publishedCount，pending 不计入
  if (publishedCount >= minRequired) {
    return QualifiedStatus.QUALIFIED;
  }

  // 接近达标：80% <= progress < 100%
  const progress = calculateProgress(publishedCount, targetCount);
  if (progress >= 80) {
    return QualifiedStatus.NEAR;
  }

  return QualifiedStatus.UNQUALIFIED;
}

/**
 * 获取达标状态的显示信息
 */
export function getQualifiedStatusInfo(status: QualifiedStatus): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case QualifiedStatus.QUALIFIED:
      return { label: '已达标', color: 'green', icon: '✓' };
    case QualifiedStatus.NEAR:
      return { label: '接近达标', color: 'yellow', icon: '⚠' };
    case QualifiedStatus.UNQUALIFIED:
      return { label: '未达标', color: 'red', icon: '✗' };
  }
}
