# Schema 验证文档

> 确保数据库设计严格匹配 PRD 中定义的 JSON Schema v1.1.0

---

## PRD 完整 Schema（不能少任何字段）

### 顶层结构
```typescript
{
  "schemaVersion": "1.1.0",  // ✅ 必须
  "recipe": { ... }           // ✅ 必须
}
```

### recipe 对象（完整字段清单）

#### 1. 基础信息
```typescript
{
  "id": "string",                    // ✅ 必须
  "titleZh": "string",               // ✅ 必须
  "titleEn": "string" | null,        // ✅ 必须（可选）
}
```

#### 2. summary（摘要）- 必须包含所有字段
```typescript
{
  "summary": {
    "oneLine": "string",             // ✅ 必须 - 一句话简介
    "healingTone": "string",         // ✅ 必须 - 治愈文案
    "difficulty": "easy|medium|hard", // ✅ 必须 - 难度
    "timeTotalMin": number,          // ✅ 必须 - 总时间
    "timeActiveMin": number,         // ✅ 必须 - 操作时间
    "servings": number               // ✅ 必须 - 份量
  }
}
```

#### 3. story（文化故事）- 必须包含所有字段
```typescript
{
  "story": {
    "title": "string",               // ✅ 必须 - 故事标题
    "content": "string",             // ✅ 必须 - 150字文化渊源
    "tags": ["string"]               // ✅ 必须 - 标签数组
  }
}
```

#### 4. ingredients（食材清单）- 必须包含所有字段
```typescript
{
  "ingredients": [
    {
      "section": "string",           // ✅ 必须 - 分组（如"主料"）
      "items": [
        {
          "name": "string",          // ✅ 必须 - 食材名
          "iconKey": "string",       // ✅ 必须 - 图标key
          "amount": number,          // ✅ 必须 - 数量
          "unit": "string",          // ✅ 必须 - 单位
          "notes": "string" | null   // ✅ 必须 - 备注（可选）
        }
      ]
    }
  ]
}
```

**iconKey 枚举值**：
- meat（肉类）
- veg（蔬菜）
- fruit（水果）
- seafood（海鲜）
- grain（谷物）
- bean（豆类）
- dairy（奶制品）
- egg（蛋类）
- spice（香料）
- sauce（酱料）
- oil（油脂）
- other（其他）

#### 5. steps（制作步骤）- 必须包含所有字段
```typescript
{
  "steps": [
    {
      "id": "string",                // ✅ 必须 - 如 "step01"
      "title": "string",             // ✅ 必须 - 步骤标题
      "action": "string",            // ✅ 必须 - 详细描述
      "speechText": "string",        // ✅ 必须 - 语音朗读文本
      "timerSec": number,            // ✅ 必须 - 计时器秒数
      "visualCue": "string",         // ✅ 必须 - 视觉信号
      "failPoint": "string",         // ✅ 必须 - 失败检查点
      "photoBrief": "string"         // ✅ 必须 - 图片描述
    }
  ]
}
```

#### 6. styleGuide（风格指南）- 必须包含所有字段
```typescript
{
  "styleGuide": {
    "theme": "string",               // ✅ 必须 - 如"治愈系暖调"
    "lighting": "string",            // ✅ 必须 - 如"自然光"
    "composition": "string",         // ✅ 必须 - 如"留白"
    "aesthetic": "string"            // ✅ 必须 - 如"吉卜力或日杂风"
  }
}
```

#### 7. imageShots（AI绘图提示词）- 必须包含所有字段
```typescript
{
  "imageShots": [
    {
      "key": "string",               // ✅ 必须 - cover|ingredients|step
      "imagePrompt": "string",       // ✅ 必须 - AI绘图Prompt
      "ratio": "string"              // ✅ 必须 - 16:9|4:3|3:2
    }
  ]
}
```

---

## 数据库设计（Prisma Schema）

### 当前设计检查

```prisma
model Recipe {
  id          String   @id @default(cuid())

  // ❌ 缺少 schemaVersion 字段！
  // ❌ 缺少 titleEn 字段！
  titleZh     String
  slug        String   @unique

  // ✅ 使用 JSONB 存储，但需要验证完整性
  summary     Json     // 需确保包含所有 6 个字段
  story       Json?    // 需确保包含所有 3 个字段
  ingredients Json     // 需确保完整结构
  steps       Json     // 需确保包含所有 8 个字段
  styleGuide  Json?    // 需确保包含所有 4 个字段
  imageShots  Json?    // 需确保完整结构

  // ⚠️ 额外字段（不在PRD中，但可以添加）
  coverImage  String   // 额外：封面图URL
  images      Json?    // 额外：其他图片
  views       Int      @default(0)     // 额外：浏览量
  likes       Int      @default(0)     // 额外：点赞数
  aiGenerated Boolean  @default(false) // 额外：是否AI生成
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## ⚠️ 问题发现和修正

### 必须修改的地方

**1. 添加 schemaVersion 字段**
```prisma
model Recipe {
  id             String   @id @default(cuid())
  schemaVersion  String   @default("1.1.0")  // ✅ 新增
  titleZh        String
  titleEn        String?                      // ✅ 新增
  // ...
}
```

**2. 创建 Zod 验证 Schema（确保数据完整性）**
```typescript
// lib/validators/recipe.ts
import { z } from 'zod'

// 严格按照 PRD 定义
export const RecipeSchemaValidator = z.object({
  schemaVersion: z.literal('1.1.0'),
  recipe: z.object({
    id: z.string(),
    titleZh: z.string().min(1),
    titleEn: z.string().optional(),

    summary: z.object({
      oneLine: z.string().min(1),
      healingTone: z.string().min(1),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      timeTotalMin: z.number().positive(),
      timeActiveMin: z.number().positive(),
      servings: z.number().positive()
    }),

    story: z.object({
      title: z.string().min(1),
      content: z.string().min(50).max(500), // 150字左右
      tags: z.array(z.string())
    }),

    ingredients: z.array(z.object({
      section: z.string(),
      items: z.array(z.object({
        name: z.string(),
        iconKey: z.enum([
          'meat', 'veg', 'fruit', 'seafood', 'grain',
          'bean', 'dairy', 'egg', 'spice', 'sauce', 'oil', 'other'
        ]),
        amount: z.number(),
        unit: z.string(),
        notes: z.string().optional()
      }))
    })),

    steps: z.array(z.object({
      id: z.string(),
      title: z.string(),
      action: z.string(),
      speechText: z.string(),
      timerSec: z.number(),
      visualCue: z.string(),
      failPoint: z.string(),
      photoBrief: z.string()
    })),

    styleGuide: z.object({
      theme: z.string(),
      lighting: z.string(),
      composition: z.string(),
      aesthetic: z.string()
    }),

    imageShots: z.array(z.object({
      key: z.string(),
      imagePrompt: z.string(),
      ratio: z.string()
    }))
  })
})

// 使用时
export function validateRecipe(data: unknown) {
  return RecipeSchemaValidator.parse(data)
}
```

---

## ✅ 修正后的完整 Prisma Schema

```prisma
model Recipe {
  id             String   @id @default(cuid())
  schemaVersion  String   @default("1.1.0")  // ✅ 必须：Schema版本

  // 基础信息
  titleZh        String                       // ✅ 必须：中文名
  titleEn        String?                      // ✅ 必须：英文名（可选）
  slug           String   @unique             // 额外：URL slug

  // PRD 定义的完整数据（JSONB存储，Zod验证）
  summary        Json     // ✅ 必须：包含6个字段
  story          Json     // ✅ 必须：包含3个字段
  ingredients    Json     // ✅ 必须：完整结构
  steps          Json     // ✅ 必须：每步包含8个字段
  styleGuide     Json     // ✅ 必须：包含4个字段
  imageShots     Json     // ✅ 必须：完整结构

  // 额外字段（增强功能，不在PRD中）
  coverImage     String              // 额外：封面图URL
  images         Json?               // 额外：步骤图片等
  views          Int      @default(0)
  likes          Int      @default(0)
  aiGenerated    Boolean  @default(false)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([slug])
  @@index([schemaVersion])
  @@index([createdAt])
}
```

---

## 📋 数据完整性检查清单

在每次创建/更新食谱时，必须验证：

- [ ] `schemaVersion` 为 "1.1.0"
- [ ] `summary` 包含全部 6 个字段
- [ ] `story` 包含全部 3 个字段
- [ ] `ingredients[].items[]` 每项包含全部 5 个字段
- [ ] `steps[]` 每步包含全部 8 个字段
- [ ] `styleGuide` 包含全部 4 个字段
- [ ] `imageShots[]` 每项包含全部 3 个字段
- [ ] `iconKey` 值在枚举范围内

**验证方式**：
```typescript
// API 中使用
import { validateRecipe } from '@/lib/validators/recipe'

// 创建/更新前验证
try {
  const validatedData = validateRecipe(inputData)
  // 通过验证，可以存入数据库
} catch (error) {
  // 验证失败，返回错误
  return { error: '数据格式不符合PRD要求' }
}
```

---

## 🚨 严格约束

**绝对不能**：
- ❌ 删除 PRD 中定义的任何字段
- ❌ 修改字段名称
- ❌ 修改字段类型

**允许的**：
- ✅ 添加额外字段（如 views, likes, createdAt）
- ✅ 添加索引
- ✅ 添加关系字段

---

**最后更新**：2025-12-27
**验证状态**：✅ 已修正，完全匹配 PRD Schema v1.1.0
