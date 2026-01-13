---
name: ai-generate
description: Generate AI content for recipes, images, and blog posts. Use when user says "generate recipe", "生成食谱", "AI生成", "create content", or needs AI-powered content creation.
allowed-tools: Read, Write, Edit, Bash(curl:*), Bash(npx tsx:*)
---

# AI Content Generation

## Overview

Generate AI-powered content including recipes, images, and blog posts using GLM, DeepSeek, and Evolink APIs.

## When to Use

Use this skill when:
- Creating new recipes with AI
- Generating images for recipes/blog
- Creating blog post content
- Testing AI generation APIs

## Project Endpoints

- `POST /api/ai/generate-recipe`
- `POST /api/ai/generate-recipes-batch`
- `POST /api/ai/chef`
- `POST /api/images/generate`

## Ops Notes

- Generated content should be reviewed before publish by default.
- Use `aiGenerated` flag for filtering and QA sampling.
- If bilingual is required, run translate endpoints after draft generation and review before publish.
- Avoid exposing “AI生成” in public-facing copy; emphasize “专业审核/可信度”.

## API Providers

| Provider | Purpose | Model |
|----------|---------|-------|
| GLM (智谱AI) | Text generation | glm-4-flash |
| DeepSeek | Text generation (backup) | deepseek-chat |
| Evolink | Image generation | z-image-turbo |

## Recipe Generation

### API Endpoint
```
POST /api/ai/generate-recipe
```

### Request
```json
{
  "prompt": "红烧肉",
  "style": "家常",
  "difficulty": "medium",
  "servings": 4
}
```

### cURL Test
```bash
curl -s -X POST http://localhost:3000/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{"prompt": "红烧肉"}' | jq
```

## Image Generation

### Direct API Call
```bash
curl -s -X POST https://api.evolink.ai/v1/images/generations \
  -H "Authorization: Bearer $EVOLINK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "z-image-turbo",
    "prompt": "A delicious bowl of red braised pork, Chinese cuisine, food photography, professional lighting",
    "size": "1024x1024"
  }' | jq
```

### Image Prompt Template
```
A delicious {dish_name}, {cuisine_type} cuisine, food photography style,
professional lighting, high resolution, appetizing presentation,
garnished with fresh herbs, on a beautiful ceramic plate,
warm color palette, restaurant quality
```

## Text Generation (GLM)

### Direct API Call
```bash
curl -s -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer $GLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-4-flash",
    "messages": [
      {"role": "system", "content": "You are a professional Chinese chef."},
      {"role": "user", "content": "Write a recipe for 红烧肉"}
    ],
    "temperature": 0.7
  }' | jq
```

## Blog Post Generation

### Workflow
1. Generate outline from keywords
2. Expand each section
3. Generate images for sections
4. Compile final post

### Outline Prompt
```
根据关键词"{keyword}"，生成一篇SEO优化的博客文章大纲。
包含：
- 吸引人的标题
- 5-7个主要章节
- 每个章节的关键点
- FAQ问题
```

## Recipe Schema (v1.1.0)

Generated recipes must follow this structure:

```typescript
interface Recipe {
  schemaVersion: "1.1.0";
  titleZh: string;
  titleEn?: string;
  summary: {
    oneLine: string;
    healingTone: string;
    difficulty: "easy" | "medium" | "hard";
    timeTotalMin: number;
    timeActiveMin: number;
    servings: number;
  };
  story: {
    content: string;
    tags: string[];
  };
  ingredients: {
    section: string;
    items: {
      name: string;
      amount: number;
      unit: string;
      notes?: string;
    }[];
  }[];
  steps: {
    id: string;
    title: string;
    action: string;
    timerSec: number;
    visualCue?: string;
    failPoint?: string;
  }[];
  imageShots: {
    key: string;
    prompt: string;
    imageUrl?: string;
  }[];
}
```

## Error Handling

### Rate Limiting
- GLM: 60 requests/min
- Evolink: 10 images/min

### Retry Strategy
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    return await generateContent();
  } catch (error) {
    if (i === MAX_RETRIES - 1) throw error;
    await sleep(RETRY_DELAY * (i + 1));
  }
}
```

## Quality Checklist

- [ ] Recipe has all required fields
- [ ] Images are high quality (1024x1024)
- [ ] Text is coherent and accurate
- [ ] Steps are clear and actionable
- [ ] Ingredients have proper amounts
