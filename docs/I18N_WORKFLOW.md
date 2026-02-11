# 多语言开发工作流

> 本文档定义了 Recipe Zen 项目的多语言开发规范和必须执行的工作流程。

---

## 一、核心原则

| 原则 | 说明 |
|------|------|
| **翻译是数据问题** | 代码只负责"读取翻译"，不负责"定义翻译" |
| **单一数据源** | 所有 UI 文本来自 `lib/i18n/translations.ts` 或数据库翻译表 |
| **防御性编程** | 每个数据查询都要 `include translations` |
| **自动化验证** | ESLint + 审计脚本 + E2E 测试保证质量 |

---

## 二、禁止的写法 ❌

```tsx
// ❌ 禁止：硬编码三元表达式
{isEn ? "Start Cooking" : "开始烹饪"}
{locale === "en" ? "min" : "分钟"}

// ❌ 禁止：直接使用数据库中文字段
{recipe.cuisine?.name}
{collection.name}
```

## 三、正确的写法 ✅

```tsx
// ✅ 正确：使用 t() 函数
import { t } from "@/lib/i18n/translations";
{t("recipe.startCooking", locale)}
{t("recipe.min", locale)}

// ✅ 正确：使用翻译后的数据
const cuisineTrans = recipe.cuisine?.translations?.find(t => t.locale === locale);
{cuisineTrans?.name || recipe.cuisine?.name}
```

---

## 四、开发工作流

### 阶段 1：开发前（必须）

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 运行多语言审计，了解当前状态
pnpm i18n:audit
```

### 阶段 2：开发中（必须）

#### 添加新的 UI 文本时：

1. **先添加翻译键** 到 `lib/i18n/translations.ts`
   ```typescript
   // zh 部分
   recipe: {
     newFeature: "新功能",
   }
   // en 部分
   recipe: {
     newFeature: "New Feature",
   }
   ```

2. **在组件中使用 t() 函数**
   ```tsx
   import { t } from "@/lib/i18n/translations";
   <span>{t("recipe.newFeature", locale)}</span>
   ```

#### 添加新的数据表/字段时：

1. **创建对应的 Translation 表**
   ```prisma
   model NewFeature {
     id           String @id
     name         String
     translations NewFeatureTranslation[]
   }

   model NewFeatureTranslation {
     id        String @id
     featureId String
     locale    String
     name      String
     feature   NewFeature @relation(...)
   }
   ```

2. **查询时包含翻译**
   ```typescript
   const data = await prisma.newFeature.findMany({
     include: {
       translations: { where: { locale: { in: locales } } }
     }
   });
   ```

3. **使用翻译后的值**
   ```typescript
   const trans = data.translations.find(t => t.locale === locale);
   const displayName = trans?.name || data.name;
   ```

#### 后台创建内容时：

1. **中英文都要填写**（后台表单应有英文必填字段）
2. **如果是批量导入，同时生成翻译数据**

### 阶段 3：提交前（必须）

```bash
# 1. 运行多语言审计
pnpm i18n:audit

# 2. 如果有警告/错误，修复后再提交
# 3. 本地启动并用浏览器检查英文页面
pnpm dev
# 访问 http://localhost:3000/en/ 检查

# 4. 运行 E2E 测试（可选但推荐）
pnpm test:i18n
```

### 阶段 4：Code Review（必须）

**Reviewer 检查清单：**

- [ ] 是否有 `isEn ?` 或 `locale === "en" ?` 硬编码？
- [ ] 新增 UI 文本是否使用了 `t()` 函数？
- [ ] 数据库查询是否包含了 `translations`？
- [ ] 是否同时添加了中英文翻译键？
- [ ] 新建的数据表是否有对应的 Translation 表？

---

## 五、命令速查

| 命令 | 说明 |
|------|------|
| `pnpm i18n:audit` | 运行多语言审计（检查数据库+代码） |
| `pnpm i18n:audit --ci` | CI 模式，有错误时返回非零退出码 |
| `pnpm test:i18n` | 运行 E2E 多语言测试 |
| `pnpm i18n:fix` | 自动修复缺失翻译（如果有脚本） |

---

## 六、常见场景处理

### 场景 1：新增页面组件

```tsx
// 1. 导入翻译函数
import { t } from "@/lib/i18n/translations";
import { useLocale } from "@/components/i18n/LocaleProvider";

// 2. 获取 locale
const locale = useLocale();

// 3. 使用翻译
<h1>{t("page.title", locale)}</h1>
<p>{t("page.description", locale)}</p>
```

### 场景 2：显示数据库内容（菜系、标签等）

```tsx
// 查询时
const cuisines = await prisma.cuisine.findMany({
  include: {
    translations: { where: { locale: { in: getContentLocales(locale) } } }
  }
});

// 显示时
const trans = cuisine.translations.find(t => t.locale === locale);
const displayName = trans?.name || cuisine.name;
```

### 场景 3：批量生成内容后

```bash
# 生成内容后，立即运行翻译脚本
npx tsx scripts/translate-collections.ts
npx tsx scripts/translate-tags.ts

# 验证
pnpm i18n:audit
```

---

## 七、翻译表对照

| 主表 | 翻译表 | 主要字段 |
|------|--------|----------|
| Recipe | RecipeTranslation | title, description, steps |
| Cuisine | CuisineTranslation | name, slug, description |
| Location | LocationTranslation | name, slug, description |
| Tag | TagTranslation | name, slug |
| Collection | CollectionTranslation | name, slug, description |
| HomeBrowseItem | HomeBrowseItemTranslation | name, description |
| BlogPost | BlogPostTranslation | title, content, excerpt |

---

## 八、问题排查

### 英文页面显示中文？

1. **运行审计**: `pnpm i18n:audit`
2. **检查数据库**: 对应的 Translation 表是否有英文记录
3. **检查代码**: 是否正确使用了翻译逻辑
4. **清除缓存**: 删除 `.next` 目录重启

### 翻译键不存在？

1. 检查 `lib/i18n/translations.ts` 中是否添加了该键
2. 确保 zh 和 en 两个语言都添加了
3. 检查键名拼写是否正确

---

## 九、CI/CD 集成

```yaml
# .github/workflows/i18n.yml
name: i18n Check

on: [push, pull_request]

jobs:
  i18n-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm i18n:audit --ci

  i18n-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm build && pnpm start &
      - run: pnpm test:i18n
```

---

**最后更新**: 2026-02-05
**维护者**: Recipe Zen 团队
