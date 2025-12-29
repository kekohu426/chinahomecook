# 开发执行计划（当前版）

**更新时间**: 2025-12-29  
**目标**: 以 PRD v1.1.0 为硬约束，完成“详情页 100% 还原 + 首页瀑布流 + 后台编辑体验 + 搜索无感生成体验”的核心闭环。

---

## 执行原则
- 所有任务必须有“验收标准 + 关联路径”。
- UI 必须逐像素对照 `docs/prd-images/` 验收。
- 任务完成后更新 `docs/TODO.md` 与 `docs/PROJECT_STATE.md`。

---

## 里程碑与任务

### M0 文档整理（已完成）
**目标**: 形成单一入口，减少重复文档。
**产出**: `docs/README.md`、更新 `docs/TODO.md`、完善 `docs/PLAN.md`、`docs/TEST_PLAN.md`。

---

### M1 详情页 100% 还原（P0）
**范围**:
- 头部大图与信息卡片还原（image1）
- 文化故事 + 食材清单 + 步骤卡片还原（image2-3）
- AI 主厨卡片与底部工具栏（image4-5）
- COOK NOW 全屏模式（image6-9）

**关键产出**:
- 使用真实封面图（`coverImage`）与步骤图（`imageShots`/后续字段）
- 设计稿色值/字体/圆角/间距一致

**验收标准**:
- 与 `docs/prd-images/` 对照无明显差异
- 详情页不再出现占位图

**关联路径**:
- `app/recipe/[id]/page.tsx`
- `components/recipe/RecipeHeader.tsx`
- `components/recipe/IngredientSidebar.tsx`
- `components/recipe/StepCard.tsx`
- `components/recipe/AIChefCard.tsx`

---

### M2 首页瀑布流 + 封面图（P0）
**范围**:
- 首页改为瀑布流布局
- 使用 `coverImage` 渲染真实图片

**验收标准**:
- 不再使用 emoji/渐变占位
- PC/移动端均正常瀑布流

**关联路径**:
- `app/page.tsx`

---

### M3 后台编辑体验重构（P0）
**范围**:
- 食材/步骤/图片管理改为表单化编辑
- 顶部发布按钮 + 草稿/发布状态明确
- 图片上传/重生成/预览入口完整

**验收标准**:
- 不需要手写 JSON
- PRD v1.1.0 字段全部可编辑
- 发布/下架操作清晰

**关联路径**:
- `components/admin/RecipeForm.tsx`
- `components/admin/ImageUploader.tsx`
- `components/admin/ImageGenerator.tsx`
- `app/admin/recipes/page.tsx`

---

### M4 搜索无感体验完善（P0）
**范围**:
- 修正搜索结果路由
- 加载中提示与 AI 生成提示
- 生成失败有友好提示

**验收标准**:
- 搜索流程顺畅、无路由错误
- AI 生成提示清晰

**关联路径**:
- `app/search/page.tsx`
- `app/api/search/route.ts`

---

### M5 配置管理完善（P1）
**范围**:
- 新增/编辑地点与菜系

**验收标准**:
- 后台无需直连数据库即可维护配置

**关联路径**:
- `app/admin/config/page.tsx`
- `app/api/config/*`

---

### M6 AI JSON 稳定性与兜底（P1）
**范围**:
- 解析失败重试（可选二次 prompt）
- 清洗策略增强（数字/逗号/非法字符）
- 失败时返回可读错误

**验收标准**:
- 生成失败率显著下降
- 失败返回可定位信息

**关联路径**:
- `lib/ai/generate-recipe.ts`

---

### M7 批量生成进度（P1）
**范围**:
- 前端实时进度显示
- 失败项可定位

**关联路径**:
- `app/admin/generate/page.tsx`

---

## 交付节奏建议
1. M1 + M2：先完成前台展示闭环
2. M3 + M4：后台与搜索体验落地
3. M5 + M6 + M7：稳定性与效率提升
4. 按 `docs/TEST_PLAN.md` 执行 P0 测试

---

## 文档同步要求
- 每完成一个里程碑，更新 `docs/PROJECT_STATE.md`
