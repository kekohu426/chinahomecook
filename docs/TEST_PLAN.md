# 单元测试编写计划（执行版）

**版本**: v3.0  
**更新时间**: 2025-12-29  
**目标**: 覆盖 PRD Schema 校验、AI JSON 解析、核心 API 路由与关键 UI 组件。

---

## 现状评估
- `tests/validators/recipe.test.ts`：有基础覆盖，但仍缺 story/tags、imageShots、styleGuide 等细分场景。
- `tests/ai/generate.test.ts`：主要是字符串断言，未覆盖真实清洗/规范化函数。
- `tests/api/recipes.test.ts`：仅参数拼接测试，未覆盖 API 路由逻辑。

---

## 测试策略
1. **纯函数单测优先**：Schema 校验、JSON 清洗、数字字段规范化。
2. **API 路由测试**：使用 `vi.mock` mock Prisma 与 AI Provider，避免真实数据库与外部调用。
3. **组件测试最小化**：仅覆盖关键交互（计时器、渲染关键字段）。

---

## P0（必须完成）

### 1) PRD Schema 校验（`lib/validators/recipe.ts`）
**新增覆盖点**:
- story.tags 必填与数量
- imageShots ratio 枚举
- styleGuide 四字段完整性

**目标文件**: `tests/validators/recipe.test.ts`

**验收**:
- 至少新增 8 条测试
- 失败信息可定位字段路径

---

### 2) AI JSON 清洗与解析（`lib/ai/generate-recipe.ts`）
**动作**:
- 将 `cleanAIResponse` 与 `normalizeRecipeData` 明确导出（仅测试用）
- 增加脏 JSON 样例（注释、尾逗号、分数字段）

**目标文件**: `tests/ai/generate.test.ts`

**验收**:
- 能清理并解析 3 类脏 JSON
- 数字字段被规范化为 number

---

### 3) 食谱 API 校验（`app/api/recipes/*`）
**覆盖点**:
- POST/PUT 合法数据通过
- 非法数据返回 400 且包含 `details`

**目标文件**: `tests/api/recipes.test.ts`

**验收**:
- mock Prisma 后完成路由逻辑测试
- 失败响应包含字段路径

---

### 4) 搜索无感生成（`app/api/search/route.ts`）
**覆盖点**:
- 命中数据库：`source=database`
- 未命中且 `autoGenerate=false`：不触发 AI
- 未命中且 `autoGenerate=true`：触发生成并保存

**目标文件**: `tests/api/search.test.ts`

---

## P1（重要）

### 5) 批量生成结果汇总
**覆盖点**: 成功/失败计数、失败列表结构

### 6) 图片生成与上传 API
**覆盖点**: content-type、尺寸限制、Evolink 失败兜底

### 7) 配置管理 CRUD
**覆盖点**: 地点/菜系增删改查与 active 查询

---

## P2（可延期）
- 详情页组件渲染与计时器交互
- 后台表单组件交互（新增食材/步骤）

---

## Mock 与测试基础设施
- 使用 `vi.mock` mock `@/lib/db/prisma` 与 AI Provider
- API 路由测试可直接调用 `GET/POST` handler
- 避免真实网络与数据库依赖

---

## 运行与验收
```bash
npm run test
```

**最低验收**:
- P0 全通过
- P1 允许最多 2 个失败项（必须有原因记录）
