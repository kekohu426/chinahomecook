---
name: analytics
description: Analytics setup and data analysis for indie websites. Use when user says "数据分析", "analytics", "埋点", "追踪", "GA", "统计", or needs to set up tracking and analyze user behavior.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*)
---

# Analytics - 数据分析

## Overview

独立站数据追踪和分析指南，涵盖 Google Analytics 4、自定义事件追踪和数据可视化。

## Analytics Stack

| 工具 | 用途 | 免费额度 |
|------|------|----------|
| Google Analytics 4 | 流量分析 | 免费 |
| Google Search Console | SEO 分析 | 免费 |
| Vercel Analytics | 性能监控 | 免费 (基础) |
| Plausible / Umami | 隐私友好分析 | 自托管免费 |

---

## i18n Considerations

- Track `locale` as a dimension (URL prefix or custom property).
- Keep localized landing pages in the sitemap for indexing.

## Google Analytics 4 Setup

### 1. 安装

```bash
npm install @next/third-parties
```

### 2. 配置

```typescript
// app/layout.tsx
import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  );
}
```

### 3. 环境变量

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Event Tracking

### 核心事件定义

```typescript
// lib/analytics/events.ts

// 事件类型
export type AnalyticsEvent =
  | { name: "page_view"; params: { page_path: string; page_title: string } }
  | { name: "search"; params: { search_term: string; results_count: number } }
  | { name: "recipe_view"; params: { recipe_id: string; recipe_name: string } }
  | { name: "recipe_save"; params: { recipe_id: string } }
  | { name: "recipe_share"; params: { recipe_id: string; method: string } }
  | { name: "cook_mode_start"; params: { recipe_id: string } }
  | { name: "cook_mode_complete"; params: { recipe_id: string; duration_sec: number } }
  | { name: "signup"; params: { method: string } }
  | { name: "login"; params: { method: string } };

// 发送事件
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event.name, event.params);
  }
}
```

## Event Naming (Project)

Use consistent names with locale dimension:

- `page_view` (props: `page_path`, `page_title`, `locale`)
- `recipe_view` (props: `recipe_id`, `recipe_name`, `locale`, `source`)
- `blog_view` (props: `post_id`, `locale`)
- `search` (props: `search_term`, `results_count`, `locale`)
- `ai_generate_recipe` (props: `prompt`, `locale`)
- `download_image` (props: `image_id`, `locale`)

Notes:
- Avoid PII in events; truncate or hash free-text prompts if needed.

### 事件追踪 Hook

```typescript
// hooks/use-analytics.ts
"use client";

import { useCallback } from "react";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics/events";

export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent) => {
    trackEvent(event);
  }, []);

  return { track };
}

// 使用
function RecipeCard({ recipe }) {
  const { track } = useAnalytics();

  const handleClick = () => {
    track({
      name: "recipe_view",
      params: { recipe_id: recipe.id, recipe_name: recipe.title },
    });
  };

  return <div onClick={handleClick}>...</div>;
}
```

### 页面浏览追踪

```typescript
// components/analytics/PageView.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");

    trackEvent({
      name: "page_view",
      params: {
        page_path: url,
        page_title: document.title,
      },
    });
  }, [pathname, searchParams]);

  return null;
}
```

---

## Key Metrics Dashboard

### 流量指标

```markdown
## 日常监控

| 指标 | 定义 | 目标 |
|------|------|------|
| DAU | 日活跃用户 | 持续增长 |
| 页面浏览量 | 总 PV | 持续增长 |
| 平均会话时长 | 用户停留时间 | > 2 分钟 |
| 跳出率 | 单页访问占比 | < 60% |
| 每会话页面数 | 用户浏览深度 | > 2 页 |
```

### 转化指标

```markdown
## 转化漏斗

1. **访问** → 100%
2. **搜索/浏览食谱** → 70%
3. **查看食谱详情** → 40%
4. **开始烹饪模式** → 15%
5. **完成烹饪** → 8%
6. **收藏/分享** → 5%
```

### 内容指标

```markdown
## 内容效果

| 指标 | 说明 |
|------|------|
| 热门食谱 Top 10 | 按浏览量排序 |
| 搜索词 Top 20 | 用户实际搜索 |
| 烹饪完成率 | 开始 vs 完成 |
| 分享率 | 分享数 / 浏览数 |
```

---

## GA4 Reports

### 自定义报告

```markdown
## 报告 1: 食谱表现

维度:
- recipe_name
- recipe_id

指标:
- 事件数 (recipe_view)
- 唯一用户数
- 烹饪模式启动率
- 收藏率

## 报告 2: 搜索分析

维度:
- search_term

指标:
- 搜索次数
- 结果点击率
- 无结果搜索占比

## 报告 3: 用户旅程

维度:
- 用户来源 (source/medium)
- 落地页

指标:
- 转化率
- 平均会话时长
- 每会话收入
```

### 探索报告配置

```markdown
## 漏斗分析配置

步骤:
1. page_view (首页)
2. search OR recipe_list_view
3. recipe_view
4. cook_mode_start
5. cook_mode_complete

细分:
- 新用户 vs 回访用户
- 移动端 vs 桌面端
- 流量来源
```

---

## Search Console Integration

### 关键指标

```markdown
| 指标 | 说明 | 目标 |
|------|------|------|
| 总点击次数 | 从搜索结果的点击 | 月增 10% |
| 总展示次数 | 搜索结果出现次数 | 月增 15% |
| 平均 CTR | 点击率 | > 3% |
| 平均排名 | 关键词平均位置 | < 20 |
```

### 分析维度

```markdown
## 查询分析
- 排名 Top 10 关键词
- CTR 最高关键词
- 潜力关键词 (高展示低点击)

## 页面分析
- 流量最高页面
- 排名上升/下降页面
- 需要优化页面

## 设备分析
- 移动端 vs 桌面端表现
- 不同设备 CTR 对比
```

---

## Privacy-Friendly Alternative

### Umami (自托管)

```typescript
// 安装 Umami
// 参考: https://umami.is/docs/getting-started

// 添加追踪脚本
// app/layout.tsx
<script
  async
  src="https://your-umami-instance.com/script.js"
  data-website-id="your-website-id"
/>
```

### Plausible

```typescript
// 使用 Plausible
// 参考: https://plausible.io/docs

// app/layout.tsx
<script
  defer
  data-domain="your-domain.com"
  src="https://plausible.io/js/script.js"
/>
```

---

## Automated Reporting

### 周报模板

```markdown
# 周数据报告 - Week [X]

## 流量概览
- 本周 UV: [X] (vs 上周 [X], 变化 [X]%)
- 本周 PV: [X] (vs 上周 [X], 变化 [X]%)
- 平均会话时长: [X] 分钟

## 内容表现
### 热门食谱 Top 5
1. [食谱名] - [X] 次浏览
2. ...

### 热门搜索词 Top 5
1. [搜索词] - [X] 次
2. ...

## 转化数据
- 新注册用户: [X]
- 烹饪模式使用: [X] 次
- 食谱收藏: [X] 次

## 待改进
- [问题1]
- [问题2]

## 下周计划
- [计划1]
- [计划2]
```

---

## Checklist

数据分析检查清单：

- [ ] GA4 正确安装并验证
- [ ] Search Console 已关联
- [ ] 核心事件已埋点
- [ ] 转化目标已设置
- [ ] 自定义报告已创建
- [ ] 周报模板已准备
- [ ] 隐私政策已更新
- [ ] Cookie 同意已实现
