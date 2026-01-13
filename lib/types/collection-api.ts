/**
 * Collection API 类型定义
 *
 * 核心口径复述：
 * 1. 达标：publishedCount >= minRequired（pending 不计入）
 * 2. 进度：progress = publishedCount / targetCount * 100
 * 3. 规则优先级：组间 AND → 组内 logic → NOT；空组/空条件忽略
 * 4. 缓存 vs 实时：列表用 cached*，详情/测试用实时
 */

import type {
  CollectionType,
  CollectionStatus,
  RuleConfig,
  SeoConfig,
  QualifiedStatus,
} from './collection';

// ==================== 通用类型 ====================

/** 分页参数 */
export interface PaginationParams {
  page?: number;              // 页码，从 1 开始，默认 1
  pageSize?: number;          // 每页数量，默认 20，最大 100
}

/** 分页响应 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** API 成功响应 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/** API 错误响应 */
export interface ApiError {
  success: false;
  error: {
    code: string;             // 错误码
    message: string;          // 用户可读的错误信息
    details?: Record<string, string[]>;  // 字段级错误详情
  };
}

/** API 响应联合类型 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** 错误码枚举 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RULE_INVALID: 'RULE_INVALID',
  PUBLISH_BLOCKED: 'PUBLISH_BLOCKED',
  AI_TASK_FAILED: 'AI_TASK_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ==================== Collection 列表 ====================

/** 列表查询参数 */
export interface CollectionListParams extends PaginationParams {
  type?: CollectionType | string;  // 按类型筛选
  status?: CollectionStatus | string;  // 按状态筛选
  qualified?: boolean;        // 按达标状态筛选
  search?: string;            // 搜索名称/slug
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'cachedPublishedCount' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

/** 列表项（精简版，使用缓存字段） */
export interface CollectionListItem {
  id: string;
  type: CollectionType | string;
  name: string;
  nameEn: string | null;
  slug: string;
  path: string;
  status: CollectionStatus | string;
  coverImage: string | null;

  // 数量统计（缓存）
  minRequired: number;
  targetCount: number;
  cachedMatchedCount: number;
  cachedPublishedCount: number;
  cachedPendingCount: number;
  cachedAt: string | null;

  // 计算字段
  progress: number;           // 进度百分比 (publishedCount / targetCount * 100)
  qualifiedStatus: QualifiedStatus | string;

  createdAt: string;
  updatedAt: string;
}

/** 列表响应 */
export type CollectionListResponse = ApiResponse<CollectionListItem[]>;

// ==================== Collection 详情 ====================

/** 详情（完整版，使用实时计算） */
export interface CollectionDetail extends Omit<CollectionListItem, 'cachedMatchedCount' | 'cachedPublishedCount' | 'cachedPendingCount' | 'cachedAt'> {
  description: string | null;
  descriptionEn: string | null;
  ruleType: 'auto' | 'custom';
  rules: RuleConfig;
  seo: SeoConfig;
  pinnedRecipeIds: string[];
  excludedRecipeIds: string[];
  sortOrder: number;
  isFeatured: boolean;
  publishedAt: string | null;
  transStatus: Record<string, string>;

  // 实时统计（详情页用实时计算）
  matchedCount: number;
  publishedCount: number;
  pendingCount: number;
  draftCount: number;

  // 关联信息（单标签模式）
  cuisineId: string | null;
  locationId: string | null;
  tagId: string | null;

  // 关联实体名称（方便展示）
  linkedEntityName?: string;  // 如 "川菜"、"减脂" 等
  linkedEntityType?: string;  // cuisine/location/tag
}

export type CollectionDetailResponse = ApiResponse<CollectionDetail>;

// ==================== Collection 创建/更新 ====================

/** 创建请求 */
export interface CreateCollectionRequest {
  type: CollectionType | string;
  name: string;
  nameEn?: string;
  slug?: string;              // 可选，不填则自动生成
  description?: string;
  descriptionEn?: string;
  coverImage?: string;
  ruleType?: 'auto' | 'custom';
  minRequired?: number;
  targetCount?: number;
  sortOrder?: number;

  // 单标签模式关联（三选一）
  cuisineId?: string;
  locationId?: string;
  tagId?: string;
}

/** 更新请求（部分更新） */
export interface UpdateCollectionRequest {
  name?: string;
  nameEn?: string;
  slug?: string;
  description?: string;
  descriptionEn?: string;
  coverImage?: string;
  minRequired?: number;
  targetCount?: number;
  sortOrder?: number;
  isFeatured?: boolean;
  seo?: Partial<SeoConfig>;  // SEO 配置
}

/** 发布请求 */
export interface PublishCollectionRequest {
  force?: boolean;            // 是否强制发布（即使未达标）
}

/** 发布响应 */
export interface PublishCollectionResponse {
  published: boolean;
  qualifiedStatus: QualifiedStatus | string;
  message: string;
  publishedCount: number;
  minRequired: number;
}

// ==================== 规则 API ====================

/** 更新规则请求 */
export interface UpdateRulesRequest {
  ruleType: 'auto' | 'custom';
  rules: RuleConfig;

  // 单标签模式需要的关联ID
  cuisineId?: string | null;
  locationId?: string | null;
  tagId?: string | null;
}

/** 测试规则请求 */
export interface TestRulesRequest {
  rules: RuleConfig;
  excludedRecipeIds?: string[];
}

/** 测试规则响应 */
export interface TestRulesResponse {
  matchedCount: number;
  publishedCount: number;
  pendingCount: number;
  draftCount: number;
  sampleRecipes: Array<{
    id: string;
    title: string;
    coverImage: string | null;
    status: string;
  }>;
}

/** 匹配食谱列表参数 */
export interface MatchedRecipesParams extends PaginationParams {
  status?: 'published' | 'pending' | 'draft' | 'all';
  sortBy?: 'createdAt' | 'viewCount' | 'title';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/** 匹配食谱项 */
export interface MatchedRecipeItem {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  coverImage: string | null;
  status: string;
  reviewStatus: string;
  viewCount: number;
  createdAt: string;
  isPinned: boolean;
  isExcluded: boolean;
  tags: Array<{ id: string; name: string; type: string }>;
}

// ==================== 置顶/排除 API ====================

/** 置顶请求 */
export interface PinRecipesRequest {
  recipeIds: string[];        // 要置顶的食谱ID列表
  position?: 'start' | 'end'; // 插入位置，默认 'end'
}

/** 取消置顶请求 */
export interface UnpinRecipesRequest {
  recipeIds: string[];
}

/** 重排序请求 */
export interface ReorderPinnedRequest {
  recipeIds: string[];        // 完整的置顶ID列表，按新顺序排列
}

/** 排除请求 */
export interface ExcludeRecipesRequest {
  recipeIds: string[];
}

/** 取消排除请求 */
export interface UnexcludeRecipesRequest {
  recipeIds: string[];
}

/** 置顶/排除操作响应 */
export interface PinExcludeResponse {
  pinnedRecipeIds: string[];
  excludedRecipeIds: string[];
  message: string;
}

// ==================== AI API ====================

/** AI 推荐请求 */
export interface AiRecommendRequest {
  count?: number;             // 推荐数量，默认 10
  excludeExisting?: boolean;  // 排除已有食谱，默认 true
}

/** AI 推荐响应 */
export interface AiRecommendResponse {
  recommendations: Array<{
    name: string;             // 推荐的菜名
    reason: string;           // 推荐理由
    estimatedTags: string[];  // 预估标签
  }>;
}

/** AI 生成请求 */
export interface AiGenerateRequest {
  recipeNames: string[];      // 要生成的菜名列表
  qualityLevel?: 'standard' | 'high';
  reviewMode?: 'manual' | 'auto';  // manual=生成为待审核，auto=直接发布
}

/** AI 生成响应 */
export interface AiGenerateResponse {
  jobId: string;              // 生成任务ID
  status: 'pending' | 'running';
  totalCount: number;
  message: string;
}

/** AI 生成状态响应 */
export interface AiGenerateStatusResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  totalCount: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    name: string;
    recipeId: string | null;
    status: 'success' | 'failed' | 'duplicate' | 'pending';
    error?: string;
  }>;
  startedAt: string | null;
  completedAt: string | null;
}

// ==================== SEO API ====================

/** 更新 SEO 请求 */
export interface UpdateSeoRequest {
  seo: Partial<SeoConfig>;
}

/** AI 生成 SEO 请求 */
export interface AiGenerateSeoRequest {
  fields: Array<'title' | 'description' | 'keywords' | 'h1' | 'subtitle' | 'footerText'>;
  locale?: 'zh' | 'en' | 'both';
}

/** AI 生成 SEO 响应 */
export interface AiGenerateSeoResponse {
  generated: Partial<SeoConfig>;
}

// ==================== 统计 API ====================

/** 刷新统计请求 */
export interface RefreshStatsRequest {
  collectionIds?: string[];   // 不填则刷新全部
}

/** 刷新统计响应 */
export interface RefreshStatsResponse {
  refreshedCount: number;
  collections: Array<{
    id: string;
    cachedMatchedCount: number;
    cachedPublishedCount: number;
    cachedPendingCount: number;
  }>;
}

/** 全局统计响应 */
export interface GlobalStatsResponse {
  totalCollections: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  qualifiedCount: number;
  unqualifiedCount: number;
}
