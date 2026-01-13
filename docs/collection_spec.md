## 一级 / 二级聚合页技术规范 v1.0

### 1. 范围
- 二级聚合页（Collections）是一级聚合卡片的数据源；一级仅展示“已发布且达标”的集合。
- 支持 zh/en，多语言字段分开存储，API 可透传 locale。
- 计数、达标、规则优先级、SEO 口径需前后端一致。

### 2. 数据模型（Collection 关键字段）
- 基本：`type`，`name`，`nameEn?`，`slug@unique`，`path`，`description/descriptionEn`，`coverImage?`。
- 状态：`status`(draft/published/archived)，`publishedAt?`。
- 规则：`ruleType`(auto/custom)，`rules` Json。
- 数量：`minRequired`，`targetCount`。
- 内容：`pinnedRecipeIds`[]（有序），`excludedRecipeIds`[]。
- SEO：`seo` Json（见第 5 节）。
- 排序：`sortOrder`（同类型内排序），`isFeatured`（一级页推荐开关）。
- 缓存：`cachedMatchedCount` / `cachedPublishedCount` / `cachedPendingCount` / `cachedAt`（列表/进度条用）。
- 关联（auto）：`cuisineId?` / `locationId?` / `tagId?` + 外键（Tag 适用于 crowd/occasion/scene/method/taste/ingredient…）。
- 索引：`type+status`，`status+cachedPublishedCount`，`slug`，`sortOrder`。
- 迁移：`ruleType` 默认 auto；旧数据按关联字段推断；缓存初始 0，需刷新接口/按钮。

#### 2.1 Prisma Schema 参考
```prisma
model Collection {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  type          String
  name          String
  nameEn        String?
  slug          String   @unique
  path          String
  description   String?
  descriptionEn String?
  coverImage    String?
  status        String   @default("draft")
  publishedAt   DateTime?
  ruleType      String   @default("auto")
  rules         Json     @default("{}")
  minRequired   Int      @default(20)
  targetCount   Int      @default(60)
  pinnedRecipeIds   String[]  @default([])
  excludedRecipeIds String[]  @default([])
  seo           Json     @default("{}")
  sortOrder     Int      @default(0)
  isFeatured    Boolean  @default(false)
  cachedMatchedCount   Int      @default(0)
  cachedPublishedCount Int      @default(0)
  cachedPendingCount   Int      @default(0)
  cachedAt             DateTime?
  transStatus   Json     @default("{}")
  cuisineId     String?  @unique
  cuisine       Cuisine? @relation(fields: [cuisineId], references: [id])
  locationId    String?  @unique
  location      Location? @relation(fields: [locationId], references: [id])
  tagId         String?  @unique
  tag           Tag?     @relation(fields: [tagId], references: [id])
  recipes       Recipe[]
  translations  CollectionTranslation[]
  @@index([type, status])
  @@index([status, cachedPublishedCount])
  @@index([slug])
  @@index([sortOrder])
}
```

#### 2.2 迁移与兼容
- 新增字段时带默认值，避免破坏性变更；旧数据 ruleType 默认为 auto。
- 外键：tagId/cuisineId/locationId 建议 ON DELETE SET NULL。
- 索引：type+status；status+cachedPublishedCount；slug；sortOrder。
- 缓存初始为 0，需要手动或定时刷新。
- 兼容：nameEn/descriptionEn/tagId 默认 NULL；ruleType 按关联推断；缓存首次刷新后准确。

### 3. 枚举与路径
- CollectionType: `cuisine` | `region` | `crowd` | `occasion` | `scene` | `ingredient` | `theme` | `method` | `taste`
- CollectionStatus: `draft` | `published` | `archived`
- RuleType: `auto` | `custom`
- QualifiedStatus(计算): `qualified` / `unqualified` / `near`(80%~<100%)
- 类型到路径映射示例：`cuisine -> /recipe/cuisine/{slug}`，`region -> /recipe/region/{slug}`，`crowd -> /recipe/dietary/{slug}`，`ingredient -> /recipe/ingredient/{slug}`，`theme -> /recipe/theme/{slug}` …

### 4. 规则结构与引擎

#### 4.1 规则 JSON 结构
- Auto 规则（单标签模式）：
  ```json
  { "mode": "auto", "field": "cuisineId" | "locationId" | "tagId", "value": "<id>", "tagType": "<tagType?>" }
  ```
- Custom 规则（主题模式）：
  ```json
  {
    "mode": "custom",
    "groups": [ { "logic": "AND"|"OR", "conditions": [RuleCondition] } ], // 组间 AND
    "exclude": [ RuleCondition ] // NOT
  }
  RuleCondition = { field, operator, value, tagType? }
  field 支持 tag(crowd/occasion/scene/method/taste/ingredient…) / cookTime / prepTime / difficulty / servings …
  operator: eq/neq/in/nin/lt/lte/gt/gte
  ```

#### 4.2 引擎优先级
- 组间 AND → 组内 logic → NOT
- 空组/空条件忽略
- 规则测试返回：`matchedCount` / `publishedCount` / `pendingCount` / `draftCount` + `sampleRecipes`

#### 4.3 规则引擎伪代码
```typescript
function buildWhereClause(rules: RuleConfig, excludedIds: string[]): PrismaWhere {
  const where: PrismaWhere = {};

  // 排除的食谱
  if (excludedIds.length > 0) {
    where.id = { notIn: excludedIds };
  }

  if (rules.mode === 'auto') {
    // 单标签：直接匹配关联字段
    if (rules.field === 'tagId') {
      where.tags = { some: { tagId: rules.value } };
    } else {
      where[rules.field] = rules.value;
    }
    return where;
  }

  // 主题模式：组间 AND
  if (rules.groups.length > 0) {
    const groupConditions = rules.groups
      .map(group => {
        if (group.conditions.length === 0) return null; // 空组忽略
        const conditions = group.conditions.map(c => buildCondition(c));
        return group.logic === 'OR' ? { OR: conditions } : { AND: conditions };
      })
      .filter(Boolean);

    if (groupConditions.length > 0) {
      where.AND = groupConditions;
    }
  }

  // 排除条件：NOT
  if (rules.exclude.length > 0) {
    where.NOT = rules.exclude.map(c => buildCondition(c));
  }

  return where;
}

function buildCondition(c: RuleCondition): PrismaWhere {
  if (c.field === 'tag') {
    // 标签通过关联表查询
    return {
      tags: {
        some: {
          tag: {
            type: c.tagType,
            OR: [{ slug: c.value }, { name: c.value }]
          }
        }
      }
    };
  }

  // 数值字段映射
  const operatorMap = {
    eq: 'equals', neq: 'not',
    lt: 'lt', lte: 'lte', gt: 'gt', gte: 'gte',
    in: 'in', nin: 'notIn'
  };
  return { [c.field]: { [operatorMap[c.operator]]: c.value } };
}
```

### 5. 达标 / 计数口径
- `progress = publishedCount / targetCount`。
- 达标：`publishedCount >= minRequired`（若需包含 pending，请前后端一致；默认不含）。
- 未达标发布：默认允许但提示 warning；如需禁止需发布接口校验。
- 缓存 vs 实时：列表/进度用 `cached*`；详情/测试用实时；提供 `refresh-counts` 接口。

### 6. SEO 结构
```json
{
  "titleZh": "", "titleEn": "", "descriptionZh": "", "descriptionEn": "",
  "keywords": [],
  "h1Zh": "", "h1En": "", "subtitleZh": "", "subtitleEn": "",
  "footerTextZh": "", "footerTextEn": "",
  "schemaType": "CollectionPage" | "ItemList" | "WebPage",
  "autoJsonLd": true, "noIndex": false,
  "sitemapPriority": 0.7, "changeFreq": "weekly"
}
```
- 字数：Title≤60(警50)，Desc≤160(警120)，Keywords≤10，Footer≤500。
- locale 透传：未提供默认 zh。

### 7. API 契约（关键）

#### 7.1 通用规范
- 分页：`page`/`pageSize`（默认 1/20，最大 100）。
- 响应：`ApiResponse<T>` / `ApiError {code/message/details}`。

#### 7.2 CRUD 接口
- 列表 GET `/api/admin/collections`：筛选 type/status/qualified?/search/sortBy/sortOrder，返回精简项含 progress/qualifiedStatus。
- 详情 GET `/api/admin/collections/[id]`：完整版（规则、SEO、置顶/排除、关联名）。
- 创建/更新：slug 可自动生成；部分更新。
- 发布 POST `/api/admin/collections/[id]/publish {force?}`：返回 published/qualifiedStatus/message。

#### 7.3 规则接口
- 规则：GET/PUT rules；POST rules/test；GET matched-recipes（分页、状态/排序/搜索）。

#### 7.4 置顶/排除接口示例
```typescript
// 置顶食谱
POST /api/admin/collections/{id}/pin
Request:  { "recipeIds": ["r1", "r2"], "position": "start" | "end" }
Response: { "success": true, "pinnedRecipeIds": ["r1", "r2", "r3"], "message": "已置顶 2 个食谱" }

// 取消置顶
DELETE /api/admin/collections/{id}/pin
Request:  { "recipeIds": ["r1"] }
Response: { "success": true, "pinnedRecipeIds": ["r2", "r3"], "message": "已取消置顶 1 个食谱" }

// 重排序（提交完整有序数组）
PUT /api/admin/collections/{id}/pin/reorder
Request:  { "recipeIds": ["r3", "r1", "r2"] }
Response: { "success": true, "pinnedRecipeIds": ["r3", "r1", "r2"], "message": "排序已更新" }

// 排除食谱
POST /api/admin/collections/{id}/exclude
Request:  { "recipeIds": ["r4", "r5"] }
Response: { "success": true, "excludedRecipeIds": ["r4", "r5"], "message": "已排除 2 个食谱" }

// 取消排除
DELETE /api/admin/collections/{id}/exclude
Request:  { "recipeIds": ["r4"] }
Response: { "success": true, "excludedRecipeIds": ["r5"], "message": "已取消排除 1 个食谱" }

// 并发冲突处理
Response: { "success": false, "error": { "code": "CONFLICT", "message": "排序已被其他用户修改，请刷新后重试" } }
```

#### 7.5 AI 接口
- recommend（去重已有/排除）、generate(jobId/status)、status 查询。

#### 7.6 SEO/统计接口
- SEO：GET/PUT seo；AI 生成 SEO。
- 统计：全局 stats；refresh-counts（可选指定集合）。

### 7A. AI 生成状态流

#### 状态流转图
```
[开始生成] → pending → running → completed / partial / failed
                ↓
           (前端轮询 status)
                ↓
         ┌──────┴──────┐
         ↓             ↓
    completed      partial/failed
    (全部成功)    (部分失败/全失败)
         ↓             ↓
    刷新列表      显示失败详情
                 可重试失败项
```

#### 生成后食谱状态
- `reviewMode: 'manual'` → 生成的食谱状态为 `pending`（待审核）
- `reviewMode: 'auto'` → 生成的食谱状态为 `published`（直接发布）

#### 去重策略
- **推荐时**：排除已有食谱（按标题相似度 >80%）、已排除的食谱
- **生成时**：标题完全相同则跳过，返回 `status: 'duplicate'`

#### 失败兜底
```typescript
// 生成状态响应
{
  "jobId": "job_xxx",
  "status": "partial",  // pending | running | completed | partial | failed
  "totalCount": 5,
  "successCount": 3,
  "failedCount": 2,
  "results": [
    { "name": "麻婆豆腐", "recipeId": "r1", "status": "success" },
    { "name": "回锅肉", "recipeId": "r2", "status": "success" },
    { "name": "水煮鱼", "recipeId": null, "status": "duplicate", "error": "已存在同名食谱" },
    { "name": "宫保鸡丁", "recipeId": null, "status": "failed", "error": "AI 生成超时" },
    { "name": "鱼香肉丝", "recipeId": "r3", "status": "success" }
  ],
  "startedAt": "2026-01-10T10:00:00Z",
  "completedAt": "2026-01-10T10:05:00Z"
}
```

### 8. 前后端行为约束
- 一级页卡片来源：仅 status=published 且达标的集合。
- 置顶顺序影响前台顺序；区块/卡片排序需持久化。
- 规则保存前支持“测试规则”；空规则需提示。
- 校验：slug 唯一；必填与数值范围；图片上传可选/必填按需；AI 失败兜底提示。
- 拖拽排序失败回滚；批量操作需确认。

### 9. 测试用例（至少覆盖）

#### 9.1 规则引擎测试
```typescript
describe('CollectionRuleEngine', () => {
  // OR 逻辑
  test('OR: 满足任一条件即匹配', () => {
    // 规则: tag=减脂 OR tag=清淡
    // 食谱A有减脂标签 → 匹配
    // 食谱B有清淡标签 → 匹配
    // 食谱C无这两个标签 → 不匹配
  });

  test('OR: 全不满足则不匹配', () => {});

  // AND 逻辑
  test('AND: 必须满足所有条件', () => {
    // 规则: tag=川菜 AND cookTime<=30
    // 食谱A: 川菜+20分钟 → 匹配
    // 食谱B: 川菜+60分钟 → 不匹配
  });

  test('AND: 缺一不匹配', () => {});

  // NOT 逻辑
  test('NOT: 排除指定标签的食谱', () => {
    // 规则: tag=减脂, exclude: tag=重口味
    // 食谱A: 减脂+清淡 → 匹配
    // 食谱B: 减脂+重口味 → 不匹配
  });

  test('NOT: 多个排除条件同时生效', () => {});

  // 组合
  test('组间 AND + 组内 OR', () => {
    // groups: [
    //   { logic: 'OR', conditions: [tag=减脂, tag=清淡] },
    //   { logic: 'AND', conditions: [cookTime<=30] }
    // ]
    // 必须满足: (减脂或清淡) 且 (时间<=30)
  });

  test('空组被忽略', () => {
    // groups: [{ logic: 'OR', conditions: [] }]
    // 应返回所有食谱（无过滤）
  });

  test('空条件被忽略', () => {});

  // 数值条件
  test('cookTime lte 30 匹配', () => {});
  test('cookTime gt 60 匹配', () => {});
  test('servings in [2,4] 匹配', () => {});
});
```

#### 9.2 达标判定测试
```typescript
describe('QualifiedStatus', () => {
  test('publishedCount >= minRequired → qualified', () => {
    // minRequired=20, publishedCount=25 → qualified
  });

  test('publishedCount < minRequired → unqualified', () => {
    // minRequired=20, publishedCount=15 → unqualified
  });

  test('80% <= progress < 100% → near', () => {
    // targetCount=60, publishedCount=50 (83%) → near
  });

  test('pending 不计入达标（默认）', () => {
    // minRequired=20, publishedCount=18, pendingCount=5
    // 达标判定只看 publishedCount → unqualified
  });

  test('progress 计算正确', () => {
    // targetCount=60, publishedCount=45
    // progress = 45/60 = 75%
  });
});
```

#### 9.3 API 测试
- 列表：筛选 type/status/qualified、搜索 name/slug、分页、排序
- 发布：达标允许、未达标 warning、force=true 强制发布
- 置顶：pin/unpin 幂等、reorder 顺序正确、并发冲突返回 CONFLICT
- 排除：exclude/unexclude 生效、排除后不出现在匹配列表
- AI：recommend 去重已有食谱、generate 返回 jobId
- SEO：字数超限返回 warning、保存成功

#### 9.4 缓存刷新测试
- 刷新前后 cachedPublishedCount 变化
- 刷新后 progress/qualifiedStatus 重新计算
- cachedAt 更新为当前时间

### 10. 一级聚合页配置要点
- 区块：启用/排序/默认展开/卡片数；数据来源=达标集合。
- 卡片：仅已发布且达标的集合；按后台置顶/排序；支持最小数量门槛过滤。
- 前台：严格按后台排序/折叠状态渲染；点击跳转 `/[locale]/recipe/{type}/{slug}`。

### 11. API 类型参考（可选）
- 分页：`PaginationParams { page?, pageSize? }`，`PaginationMeta { page,pageSize,total,totalPages }`
- 响应：`ApiResponse<T>` / `ApiError { code,message,details? }`
- 列表项：`CollectionListItem` 含 progress/qualifiedStatus + cached* 字段
- 详情：`CollectionDetail` = 列表项 + description/descriptionEn/ruleType/rules/seo/pinned/excluded/sortOrder/isFeatured/publishedAt/transStatus/关联名称
- 创建/更新/发布/规则/匹配列表/置顶/排除/AI/SEO/统计 请求响应结构可直接采用 Claude 版本中 `collection-api.ts` 定义，保持一致性。

### 12. 前端交互细化（Tab 级）
- 基本信息：slug 冲突校验；封面上传/AI 生成；最少/目标数实时进度条；状态切换（草稿/已发布）；保存后刷新详情。
- 匹配规则：单标签模式只读展示关联标签和匹配统计；主题模式可视化规则编辑（OR/AND/NOT），空条件提示；“测试规则”返回实时计数/样本/缺口。
- 内容管理：置顶卡片可拖拽排序；匹配列表支持筛选/搜索/排序/批量操作（置顶、审核、移除/排除）；操作后刷新计数或调用刷新缓存。
- AI 生成中心：显示缺口/规则摘要；推荐列表去重；生成设置（数量、质量、审核模式、服务商）；生成后任务轮询状态；失败提示。
- SEO 设置：字段字数提示/超限警告；AI 生成部分字段；预览前台入口；noIndex/sitemapPriority/changeFreq 设置。
- 一级聚合配置：区块拖拽排序/启用/默认折叠/卡片数；卡片来源筛选仅达标集合，可搜索；前台渲染顺序与折叠状态一致。

### 13. 错误码与提示（示例，前后端一致）
- `VALIDATION_ERROR`：字段校验失败（details 含字段错误）。
- `NOT_FOUND`：集合或资源不存在。
- `CONFLICT`：slug 唯一冲突 / 排序并发冲突。
- `RULE_INVALID`：规则为空或字段/操作符不合法。
- `PUBLISH_BLOCKED`：未达标且不允许发布（如配置）。
- `AI_TASK_FAILED`：AI 生成/推荐任务失败（附 error）。

### 14. 权限与审计（最少要求）
- 管理端操作需 ADMIN；敏感操作（发布、删除、AI 生成、排序变更）记录日志（操作者、时间、变更摘要）。

### 15. 缓存刷新策略
- 列表/进度使用缓存字段；提供 `refresh-counts` 接口/按钮，支持指定集合或全部。
- 刷新后更新 cached* 与 cachedAt；前端需展示缓存时间。

### 16. 非功能约束
- 兼容分页上限（pageSize 最大 100）；接口响应时间可控（规则测试/匹配列表可分页）。
- 防重复：置顶/排除/AI 推荐/生成需去重已有/已排除/已置顶的 ID。
