---
name: content-seo
description: Content creation and SEO optimization for Recipe Zen blog/recipes. Use when user says "内容创作", "content marketing", "SEO优化", "关键词", "写文章", "博客", or needs content strategy for recipes/blog posts.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*)
---

# Content SEO - 内容创作与 SEO 优化

## Overview

独立站内容营销和 SEO 优化指南，从关键词研究到内容发布的完整工作流。

## Content Strategy

### 1. 内容金字塔

```
          ┌─────────────┐
          │  支柱内容   │  ← 核心主题，深度长文
          │  (Pillar)   │     3000-5000字
          └─────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌───────┐
│集群内容│ │集群内容│ │集群内容│  ← 细分主题
│(Cluster)│(Cluster)│(Cluster)│     1500-2500字
└───────┘ └───────┘ └───────┘
    │          │          │
    ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌───────┐
│支持内容│ │支持内容│ │支持内容│  ← 问答、教程
│(Support)│(Support)│(Support)│     500-1000字
└───────┘ └───────┘ └───────┘
```

### 2. 内容类型

| 类型 | 目的 | 字数 | 更新频率 |
|------|------|------|----------|
| 教程 | 流量获取 | 2000+ | 每周 |
| 食谱 | 核心内容 | 1000+ | 每周 |
| 技巧 | 用户留存 | 500+ | 每日 |
| 故事 | 品牌建设 | 1500+ | 每月 |

---

## Keyword Research

### 关键词分类

```markdown
## 主关键词 (Head Keywords)
- 搜索量: 10000+
- 竞争度: 高
- 示例: "红烧肉", "家常菜"

## 中尾关键词 (Body Keywords)
- 搜索量: 1000-10000
- 竞争度: 中
- 示例: "红烧肉的做法", "简单家常菜食谱"

## 长尾关键词 (Long-tail Keywords)
- 搜索量: < 1000
- 竞争度: 低
- 示例: "新手怎么做红烧肉不腥", "15分钟快手家常菜"
```

### 关键词研究工具

1. **Google 搜索建议**
   - 输入关键词查看自动补全
   - 查看"相关搜索"

2. **百度指数**
   - 趋势分析
   - 地域分布

3. **5118 / Ahrefs**
   - 关键词难度
   - 搜索量数据

### 关键词布局

```markdown
## 页面关键词布局

| 位置 | 关键词类型 | 密度 |
|------|------------|------|
| Title | 主关键词 | 1次 |
| H1 | 主关键词 | 1次 |
| H2 | 次关键词 | 2-3次 |
| 首段 | 主关键词 | 1次 |
| 正文 | 长尾关键词 | 自然分布 |
| Meta Description | 主+次关键词 | 各1次 |
| URL | 主关键词 | 1次 |
| Alt Text | 相关关键词 | 每图1次 |
```

---

## Bilingual Strategy (zh/en)

- **Primary language**: zh is canonical; en is translated with locale routes.
- **Avoid AI emphasis** on public-facing copy; highlight “专业团队审核/可靠” instead of “AI生成”.
- **Localized titles**: keep main keyword in each locale; do not translate proper nouns/菜名 if it hurts search intent.
- **URL strategy**: locale prefix + slug; keep slug stable across locales when possible.
- **Metadata**: each locale has its own Title/Description; use hreflang links.

## Content Template

### 食谱文章模板

```markdown
# [菜名] - [吸引词]的做法

> [一句话描述，包含长尾关键词]

## 为什么这道菜值得尝试
[故事或价值点，100-150字]

## 食材准备
[食材清单，可调整份量]

## 详细步骤
[步骤配图]

## 小贴士
- [技巧1]
- [技巧2]
- [技巧3]

## 常见问题 FAQ

### Q: [问题1]
A: [答案，包含关键词]

### Q: [问题2]
A: [答案，包含关键词]

## 相关推荐
- [内链1]
- [内链2]
- [内链3]
```

### 博客文章模板

```markdown
# [标题 - 包含主关键词]

![封面图](/images/cover.jpg)

## 引言
[引入话题，提出问题，100-150字]

## [H2 - 包含次关键词]
[内容段落，300-500字]

### [H3 - 细分点]
[详细说明]

## [H2 - 另一个次关键词]
[内容段落]

## 总结
[要点回顾，行动号召]

## 参考资料
[如有外部引用]
```

---

## On-Page SEO Checklist

### 技术 SEO

- [ ] **Title Tag**: 50-60 字符，主关键词靠前
- [ ] **Meta Description**: 150-160 字符，含 CTA
- [ ] **URL**: 短而描述性，含关键词
- [ ] **H1**: 每页仅一个，含主关键词
- [ ] **H2-H6**: 逻辑层次，含次关键词
- [ ] **图片 Alt**: 描述性，含相关关键词
- [ ] **内链**: 3-5 个相关页面链接
- [ ] **外链**: 1-2 个权威来源

### 内容 SEO

- [ ] **首段**: 100 字内出现主关键词
- [ ] **关键词密度**: 1-2%，自然分布
- [ ] **内容长度**: 符合类型要求
- [ ] **可读性**: 短段落，列表，子标题
- [ ] **多媒体**: 图片、视频、图表
- [ ] **FAQ**: 3-5 个常见问题

### 用户体验

- [ ] **加载速度**: < 3 秒
- [ ] **移动友好**: 响应式设计
- [ ] **CTA 明确**: 每页有明确行动号召
- [ ] **面包屑**: 清晰的导航路径

---

## Content Calendar

### 发布节奏

```markdown
| 周几 | 内容类型 | 数量 |
|------|----------|------|
| 周一 | 食谱 | 1篇 |
| 周三 | 技巧/问答 | 1篇 |
| 周五 | 食谱 | 1篇 |
| 周日 | 博客/故事 | 1篇 |
```

### 季节性内容规划

```markdown
## Q1 (1-3月)
- 春节年夜饭
- 元宵节汤圆
- 春季养生

## Q2 (4-6月)
- 清明节青团
- 端午节粽子
- 夏季清凉菜

## Q3 (7-9月)
- 暑期快手菜
- 中秋节月饼
- 烧烤季

## Q4 (10-12月)
- 秋季滋补
- 冬至饺子
- 圣诞/元旦大餐
```

---

## Structured Data

### Recipe Schema

```typescript
const recipeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "红烧肉",
  "description": "经典红烧肉做法...",
  "image": ["https://example.com/image.jpg"],
  "author": {
    "@type": "Organization",
    "name": "Recipe Zen"
  },
  "datePublished": "2024-01-01",
  "prepTime": "PT20M",
  "cookTime": "PT60M",
  "totalTime": "PT80M",
  "recipeYield": "4 servings",
  "recipeCategory": "Main Course",
  "recipeCuisine": "Chinese",
  "keywords": "红烧肉, 家常菜, 猪肉",
  "recipeIngredient": [
    "500g 五花肉",
    "2勺 生抽"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": "五花肉切块..."
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "120"
  }
};
```

### FAQ Schema

```typescript
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "红烧肉怎么做不腥？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "焯水时加入料酒和姜片..."
      }
    }
  ]
};
```

---

## Performance Tracking

### 核心指标

| 指标 | 目标 | 工具 |
|------|------|------|
| 有机流量 | 月增 10% | Google Analytics |
| 关键词排名 | Top 10 | Search Console |
| 点击率 CTR | > 3% | Search Console |
| 跳出率 | < 60% | Google Analytics |
| 平均阅读时间 | > 2 分钟 | Google Analytics |

### 定期审计

- **每周**: 检查新内容排名
- **每月**: 分析流量来源变化
- **每季度**: 完整 SEO 审计
- **每年**: 内容更新和清理
