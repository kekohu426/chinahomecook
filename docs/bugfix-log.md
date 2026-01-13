# Bugfix Log

## 2026-01-13

### Bug 1: 一级聚合页食材区块不显示
**文件**: `lib/aggregation/qualified-collections.ts`
**根因**: DEFAULT_BLOCKS 中 ingredient 的 `enabled: false`, `collapsed: true`
**修复**:
- 改为 `enabled: true`, `collapsed: false`
- 在 `getAggregationBlocksConfig` 中添加强制启用 ingredient 的逻辑

### Bug 2: 二级聚合页置顶食谱不显示在最前面
**文件**:
- `app/[locale]/recipe/cuisine/[slug]/page.tsx`
- `app/[locale]/recipe/ingredient/[slug]/page.tsx`
**根因**: 页面没有查询 Collection 的 pinnedRecipeIds，直接按 viewCount/createdAt 排序
**修复**:
- 添加 Collection 查询获取 pinnedRecipeIds
- 第一页时先获取置顶食谱，再获取剩余食谱
- 合并时置顶食谱在前

### Bug 3: SEO 一键生成功能缺失
**文件**:
- `prisma/schema.prisma` - 添加 seoPrompt 字段
- `app/api/admin/collections/[id]/ai/seo/route.ts` - 新建 API
- `app/api/admin/config/ai/route.ts` - 添加 seoPrompt 处理
- `app/admin/config/ai/page.tsx` - 添加 seoPrompt 配置 UI
- `app/admin/collections/[id]/page.tsx` - 添加一键生成按钮和处理函数
**根因**: 功能未实现
**修复**: 完整实现 SEO 一键生成功能

### Bug 4: 聚合页编辑器 UI 优化（已完成）
**文件**: `app/admin/collections/[id]/page.tsx`
**需求**:
- [x] "AI 生成" tab 改名为 "AI生成菜谱"
- [x] 描述字段从基本信息 Tab 移到 SEO Tab
- [x] SEO Tab 添加页面描述区块（中文/英文）
**修复**:
- Tab 标签已改为 "AI生成菜谱"
- 在 SEO Tab 中添加了"页面描述"区块，包含中文和英文描述字段
- AI 一键生成功能已包含描述生成

---

## 注意事项
- 代码多次被回滚，疑似 VSCode/Linter 自动格式化导致
- 每次修复后需及时 git commit 并 push
