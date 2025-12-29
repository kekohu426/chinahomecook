# 项目现状快照

**更新时间**: 2025-12-29  
**范围**: 代码现状 + 改进诉求快照

---

## 已实现（可用）

### 数据与后端
- Prisma Schema：`Recipe` 使用 PRD v1.1.0 JSONB 字段，含扩展字段（location/cuisine/mainIngredients/coverImage 等）
- API 路由：recipes CRUD、search（无结果自动生成）、config（地点/菜系）、upload、images/generate、AI chef、AI generate 单个/批量

### AI 生成
- 生成提示词 + JSON 清理 + Zod 校验：`lib/ai/generate-recipe.ts`
- Evolink 图像生成 API 已接入：`lib/ai/evolink.ts`

### 前台
- 首页：瀑布流布局 + 封面图卡片
- 搜索页：结果卡片 + AI 生成提示（路由已修复）
- 详情页：头部、食材侧栏、步骤卡片、AI 主厨卡片（基础版）
- COOK NOW 全屏模式：已接入（图片仍为占位）

### 后台
- 食谱列表/创建/编辑（编辑仍为 JSON 文本）
- AI 单个/批量生成页面（无实时进度）
- 配置管理列表（无新增/编辑表单）

### 测试
- Schema 验证测试、AI 生成与 API 参数类测试已有基础覆盖（`tests/`）

---

## 主要缺口（与 PRD/问题对照）
- 详情页未 100% 还原设计稿，仍有占位图与样式差异
- 后台编辑体验差（需表单化、图片管理、发布按钮）
- 发布流程不清晰（缺一键发布/下架入口）
- AI JSON 解析偶发失败，缺重试/降级
- Evolink 图片生成未形成可控流程（超时/失败提示不足）
- 批量生成无进度可视化
- 图片管理缺失（上传/重生成/预览）
- 数据验证错误提示不友好（面向运营）

---

## 下一步优先级（执行入口）
- 参考 `docs/TODO.md` 与 `docs/PLAN.md`

---

## 快速入口（关键路径）
- 详情页：`app/recipe/[id]/page.tsx`、`components/recipe/*`
- 首页：`app/page.tsx`
- 搜索：`app/search/page.tsx`、`app/api/search/route.ts`
- 后台编辑：`components/admin/RecipeForm.tsx`
- AI 生成：`lib/ai/generate-recipe.ts`
- 图片生成：`app/api/images/generate/route.ts`、`lib/ai/evolink.ts`
