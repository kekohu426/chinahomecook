# P1 阶段代码审查清单

**日期**: 2026-01-10
**阶段**: P1 基础框架
**开发者**: Claude

---

## 核心口径复述

在编码前已确认以下口径：

1. **达标口径**: `publishedCount >= minRequired`（pending 不计入）
2. **进度计算**: `progress = publishedCount / targetCount * 100`
3. **规则优先级**: 组间 AND → 组内 logic → NOT；空组/空条件忽略
4. **缓存 vs 实时**: 列表用 `cached*` 字段，详情/测试用实时计算

---

## 新增文件

| 文件路径 | 说明 | 行数 |
|---------|------|------|
| `lib/types/collection.ts` | Collection 类型定义、枚举、计算函数 | ~250 |
| `lib/types/collection-api.ts` | API 请求/响应类型定义 | ~280 |

### lib/types/collection.ts

主要内容：
- `CollectionType` 枚举（cuisine/region/scene/method/taste/crowd/occasion/ingredient/theme）
- `CollectionStatus` 枚举（draft/published/archived）
- `RuleType` 枚举（auto/custom）
- `QualifiedStatus` 枚举（qualified/unqualified/near）
- `RuleConfig` 类型（AutoRuleConfig | CustomRuleConfig）
- `SeoConfig` 类型
- `calculateProgress()` 函数
- `calculateQualifiedStatus()` 函数
- `isAutoRule()` / `isCustomRule()` 类型守卫

### lib/types/collection-api.ts

主要内容：
- `PaginationParams` / `PaginationMeta` 分页类型
- `ApiResponse<T>` / `ApiError` 响应类型
- `CollectionListItem` 列表项类型（使用缓存字段）
- `CollectionDetail` 详情类型（使用实时统计）
- `CreateCollectionRequest` / `UpdateCollectionRequest` 请求类型
- `PublishCollectionRequest` / `PublishCollectionResponse` 发布类型
- 置顶/排除/AI/SEO 相关类型定义

---

## 修改文件

| 文件路径 | 说明 | 改动类型 |
|---------|------|---------|
| `prisma/schema.prisma` | Collection 模型扩展 | 增量修改 |
| `app/api/admin/collections/route.ts` | 列表/创建 API | 全量重写 |
| `app/api/admin/collections/[id]/route.ts` | 详情/更新/删除 API | 全量重写 |

### prisma/schema.prisma

新增字段：
```prisma
// 基本信息扩展
nameEn        String?
descriptionEn String?  @db.Text

// 状态管理
publishedAt   DateTime?
ruleType      String   @default("auto")

// 排序
sortOrder     Int      @default(0)

// 统计缓存
cachedMatchedCount   Int      @default(0)
cachedPublishedCount Int      @default(0)
cachedPendingCount   Int      @default(0)
cachedAt             DateTime?

// 新增关联
tagId         String?  @unique
tag           Tag?     @relation(...)

// 新增索引
@@index([status, cachedPublishedCount])
@@index([sortOrder])
```

### app/api/admin/collections/route.ts

改动要点：
- 添加权限检查（`auth()` + role === "ADMIN"）
- 使用新的类型定义（`CollectionListItem`, `ApiResponse`, `ApiError`）
- 列表使用缓存字段 `cached*`
- 计算 `progress` 和 `qualifiedStatus`
- 支持 `qualified` 筛选参数
- 创建时自动生成 slug 和 path
- 创建时自动设置 `ruleType` 和 `rules`

### app/api/admin/collections/[id]/route.ts

改动要点：
- 添加权限检查
- 详情使用实时统计（`countMatchedRecipesRealtime`）
- 返回 `CollectionDetail` 类型
- 包含 `linkedEntityName` / `linkedEntityType`
- 移除 PATCH 方法（同步功能待重新设计）
- 统一错误响应格式

---

## 文档更新

| 文件路径 | 说明 |
|---------|------|
| `docs/collection_spec.md` | 补充规则引擎伪代码、测试用例、API 示例 |
| `docs/collection_plan.md` | 实施计划（用户提供） |

---

## 验证结果

- [x] TypeScript 编译通过（`npx tsc --noEmit --skipLibCheck`）
- [x] Prisma 生成成功（`npx prisma generate`）
- [ ] 单元测试（待编写）
- [ ] API 集成测试（待数据库连接后测试）

---

## 已知风险/未完成项

1. **数据库迁移未执行**: 需要连接数据库后运行 `prisma migrate dev`
2. **规则引擎未完整实现**: Custom 规则的 Prisma 查询构建待 P2 实现
3. **缓存刷新接口未实现**: `refresh-counts` 接口待 P3 实现
4. **发布接口未实现**: `/api/admin/collections/[id]/publish` 待 P1.8 实现
5. **单元测试未编写**: 规则引擎、达标判定测试待补充

---

## 下一步

- P1.3: 列表页 UI（表格、Tab、筛选、分页）
- P1.5: 编辑页框架（左侧导航 + Tab 结构）
- P1.6: 基本信息 Tab（表单、封面上传、保存）
- P1.8: 发布/状态管理（发布接口、达标检查）
