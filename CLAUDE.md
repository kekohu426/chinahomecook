# Recipe Zen 项目指南

> 中国家常菜食谱平台，治愈系美食内容创作

## 快速概览

| 项目 | 说明 |
|------|------|
| 名称 | Recipe Zen（食谱禅） |
| 定位 | 中国家常菜食谱平台 |
| 技术栈 | Next.js 15 + React 19 + TypeScript + Prisma + TailwindCSS |
| 数据库 | PostgreSQL (Neon Serverless) |
| AI 服务 | GLM（文本）、Evolink（图片）、DeepSeek（备用） |

---

## 技术栈详情

### 核心框架
- **Next.js 15.1.0** - App Router 架构
- **React 19.0.0** - 最新并发特性
- **TypeScript 5** - 全覆盖类型安全

### 数据层
- **Prisma 7.2.0** - ORM
- **PostgreSQL** - Neon Serverless
- **Cloudflare R2** - 文件存储

### 认证
- **NextAuth v5.0.0-beta.30** - 身份验证
- **@auth/prisma-adapter** - Prisma 适配器

### UI
- **TailwindCSS 3.4** - 原子化 CSS
- **Radix UI** - 无障碍组件
- **TipTap 3.14** - 富文本编辑器
- **Lucide React** - 图标库

### AI 服务配置
```env
# 文本生成（GLM - 智谱AI）
AI_TEXT_PROVIDER="glm"
GLM_API_KEY=xxx
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4

# 图片生成（Evolink）
AI_IMAGE_PROVIDER="evolink"
EVOLINK_API_KEY=xxx
EVOLINK_API_URL=https://api.evolink.ai/v1

# 备用（DeepSeek）
DEEPSEEK_API_KEY=xxx
```

---

## 目录结构

```
chinahomecook-main/
├── app/                    # Next.js App Router
│   ├── [locale]/          # 多语言路由
│   ├── admin/             # 管理后台页面
│   ├── api/               # API 路由
│   └── login/             # 登录页
├── components/            # React 组件
│   ├── admin/            # 后台组件
│   ├── recipe/           # 菜谱组件
│   ├── blog/             # 博客组件
│   └── ui/               # 通用 UI
├── lib/                   # 核心业务逻辑
│   ├── ai/               # AI 服务 ⭐
│   ├── auth/             # 认证逻辑
│   ├── db/               # 数据库工具
│   ├── i18n/             # 国际化
│   └── seo/              # SEO 优化
├── prisma/               # 数据库
│   ├── schema.prisma     # 数据模型（36个表）
│   └── migrations/       # 迁移记录
├── public/               # 静态资源
├── scripts/              # 脚本工具
└── tests/                # 测试文件
```

---

## 数据模型（36个表）

### 菜谱模块
| 模型 | 说明 |
|------|------|
| `Recipe` | 菜谱主表（title, slug, ingredients, steps, coverImage） |
| `RecipeTranslation` | 菜谱翻译（locale, title, description, steps） |
| `RecipeTag` | 菜谱-标签关联（多对多） |

### 博客模块
| 模型 | 说明 |
|------|------|
| `BlogPost` | 博客主表（title, slug, content, coverImage, status） |
| `BlogPostTranslation` | 博客翻译 |

### 分类体系
| 模型 | 说明 |
|------|------|
| `Cuisine` / `CuisineTranslation` | 菜系（川菜、粤菜等） |
| `Location` / `LocationTranslation` | 地域（四川、广东等） |
| `Tag` / `TagTranslation` | 标签（多类型：口味、场景、人群等） |
| `Ingredient` / `IngredientTranslation` | 食材库 |

### 集合模块
| 模型 | 说明 |
|------|------|
| `Collection` | 集合/专题（规则配置、置顶、排除） |
| `CollectionTranslation` | 集合翻译 |

### AI 模块
| 模型 | 说明 |
|------|------|
| `AIConfig` | AI 全局配置（单例，API Key、模型配置） |
| `AIPrompt` | 提示词库（可自定义覆盖默认提示词） |
| `GenerateJob` | 菜谱生成任务 |
| `TranslationJob` | 翻译任务队列 |
| `ImageGenTask` | 图片生成任务（步骤图、成品图、封面） |
| `AIGenerationLog` | AI 生成详细日志 |
| `AIConversation` | AI 对话记录 |

### 首页配置
| 模型 | 说明 |
|------|------|
| `HomeConfig` | 首页区块配置 |
| `HomeBrowseItem` | 浏览卡片 |
| `HomeThemeCard` | 主题卡片 |
| `HomeTestimonial` | 用户证言 |

### 其他
| 模型 | 说明 |
|------|------|
| `User` | 用户账户 |
| `TeamMember` | 团队成员（探索者、审核者） |
| `AboutSection` | 关于页面区块 |
| `SiteConfig` | 站点全局配置 |

### 多语言设计模式
```
主表（Recipe） ←→ 翻译表（RecipeTranslation）
                    ├── locale: "zh-CN" | "en" | "ja" ...
                    ├── title, description, steps...
                    └── transMethod: "ai" | "human"
```

---

## 核心业务流程

### 1. 菜谱生成流程
```
用户输入菜名 → POST /api/ai/generate-recipe
    → AI Provider (GLM) 生成 JSON
    → 验证数据结构
    → 保存到 Recipe 表
    → 记录 AIGenerationLog
```

**关键文件**：
- `lib/ai/generate-recipe.ts` - 生成逻辑
- `lib/ai/default-prompts.ts` - 提示词（key: `recipe_generate`）

### 2. 博客生成流程
```
输入关键词 → POST /api/admin/blog/[id]/generate-all
    → AI 生成标题、大纲、正文、SEO
    → 生成封面图（Evolink，1792x1024）
    → 生成插图（并发，1024x768）
    → 替换正文占位符 [IMAGE_N] → ![alt](url)
    → 保存到 BlogPost 表
```

**关键文件**：
- `app/api/admin/blog/[id]/generate-all/route.ts`
- `lib/ai/default-prompts.ts`（key: `blog_generate_full`）
- `lib/ai/evolink.ts` - 图片生成

### 3. 图片生成流程
```
创建任务 → POST /api/admin/ai/image-tasks
    → 生成提示词（治愈美学风格）
    → 调用 Evolink API
    → 轮询任务结果
    → 保存图片 URL
```

**关键文件**：
- `lib/ai/evolink.ts` - Evolink 客户端
- `lib/ai/image-task-executor.ts` - 任务执行器

### 4. 翻译流程
```
触发翻译 → POST /api/admin/recipes/[id]/translate
    → AI 翻译（保持 JSON 结构）
    → 保存到 XxxTranslation 表
    → 更新主表 transStatus
```

**关键文件**：
- `lib/ai/translate.ts`
- `lib/ai/default-prompts.ts`（key: `translate_recipe`）

---

## AI 服务架构

### Provider 模式
```
lib/ai/
├── provider.ts          # 统一接口 + 工厂方法
├── glm.ts              # GLM（智谱AI）- 默认文本
├── deepseek.ts         # DeepSeek - 备用
├── openai.ts           # OpenAI 兼容
└── evolink.ts          # Evolink - 图片生成
```

### 提示词管理
```
lib/ai/
├── default-prompts.ts   # 默认提示词定义
├── prompt-manager.ts    # 提示词管理器（支持数据库覆盖）
└── prompt-generator/    # 智能提示词生成
    ├── healing-prompt-generator.ts  # 治愈系风格
    └── libraries.json               # 提示词库
```

### 日志记录
```typescript
// 使用示例
const logger = new AIGenerationLogger(undefined, {
  metadata: { recipeId, locale }
});

logger.logSuccess("recipe_generate", modelName, {
  prompt, result, tokenUsage, cost, durationMs
});

logger.logFailure("recipe_generate", modelName, error, {
  prompt, durationMs
});
```

---

## 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 数据库
pnpm prisma:generate  # 生成 Prisma Client
pnpm prisma:push      # 推送 Schema 到数据库
pnpm prisma:migrate   # 创建迁移
pnpm prisma:studio    # 打开数据库管理界面

# 测试
pnpm test             # 运行测试
pnpm test:watch       # 监听模式

# 国际化
pnpm i18n:audit       # 审计翻译缺失
pnpm i18n:fix         # 自动修复翻译

# 类型检查
pnpm typecheck        # TypeScript 类型检查
pnpm lint             # ESLint 检查
```

---

## 关键文件路径

### API 路由
| 功能 | 路径 |
|------|------|
| 菜谱 CRUD | `app/api/admin/recipes/` |
| 博客 CRUD | `app/api/admin/blog/` |
| 博客一键生成 | `app/api/admin/blog/[id]/generate-all/route.ts` |
| 图片任务 | `app/api/admin/ai/image-tasks/` |
| AI 配置 | `app/api/admin/config/ai/` |
| 翻译 | `app/api/admin/translations/` |

### AI 服务
| 功能 | 路径 |
|------|------|
| Provider 工厂 | `lib/ai/provider.ts` |
| 菜谱生成 | `lib/ai/generate-recipe.ts` |
| 翻译服务 | `lib/ai/translate.ts` |
| 图片生成 | `lib/ai/evolink.ts` |
| 提示词配置 | `lib/ai/default-prompts.ts` |
| 生成日志 | `lib/ai/generation-logger.ts` |

### 管理后台页面
| 功能 | 路径 |
|------|------|
| 菜谱管理 | `app/admin/recipes/` |
| 博客管理 | `app/admin/blog/` |
| 集合管理 | `app/admin/collections/` |
| AI 配置 | `app/admin/config/ai/` |
| 首页配置 | `app/admin/config/home/` |

### 组件
| 功能 | 路径 |
|------|------|
| 富文本编辑器 | `components/admin/RichTextEditor.tsx` |
| 菜谱卡片 | `components/recipe/RecipeCard.tsx` |
| 博客编辑器 | `app/admin/blog/[id]/page.tsx` |

---

## 设计规范

### 色彩系统（TailwindCSS）
```
主色调：
- cream (#F5F1E8)     - 奶油白背景
- brownWarm (#C6996B) - 温暖棕按钮
- brownDark (#5C4A37) - 深棕次要

辅助色：
- sage (50-800)       - 绿灰色阶
- matchaGreen         - 抹茶绿
- clayRed             - 陶土红
```

### 圆角规范
```
card: 16px      - 卡片
button: 28px    - 按钮（全圆角）
image: 16px     - 图片
```

### 间距规范
```
card-padding: 40px   - 卡片内边距
section: 80px        - 区块间距
section-lg: 120px    - 大区块间距
```

---

## 注意事项

1. **多语言**：所有内容模型都有对应的 Translation 表，使用 `locale` 字段区分
2. **AI 日志**：所有 AI 调用都应记录到 `AIGenerationLog`，方便追溯和成本统计
3. **提示词**：优先使用 `getAppliedPrompt()` 获取提示词（支持数据库覆盖）
4. **图片生成**：Evolink 支持同步/异步两种模式，使用轮询获取异步结果
5. **翻译状态**：主表的 `transStatus` JSON 字段记录各语言翻译状态
