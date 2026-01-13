---
name: recipe-zen-process
description: Recipe Zen end-to-end delivery playbook (idea → build → launch → ops). Use when user says "专用流程", "Recipe Zen 流程", "项目闭环", "上线到运营".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(git:*), Bash(curl:*)
---

# Recipe Zen Fullstack Process

## 0) Goals & Positioning
- 定义定位：专业/有温度/可信赖的中国美食网站。
- 明确关键卖点：专业审核、易上手、工具完整。
- 设定北极星：完成烹饪次数 / 食谱详情页转化率。

## 1) Product & UX
- 首页结构：Hero → 信任背书 → 快速浏览 → AI 定制 → 精选 → 工具 → 图片库 → 博客 → 证言。
- 入口：食谱库、AI 定制、美食图片、博客、关于。
- i18n：默认 zh，en 作为翻译版本。

## 2) Data & Content
- 核心模型：Recipe、BlogPost、Location、Cuisine、HomeConfig、Translations。
- 运营配置：`/admin/config/home` + `/admin/config/about`。
- 规则：公开文案避免强调“AI生成”，强调“专业审核/可信度”。

## 3) Build
- 先做 API + DB，再做 UI。
- 过滤用 slug，展示用翻译。
- 关键页补 SEO 元数据 + hreflang + sitemap。

## 4) QA
- 核心链路：搜索 → 食谱详情 → 烹饪模式 → 分享。
- API 检查：recipes/blog/config/translate。

## 5) Launch
- 配置 env + migrations + seed。
- 生成 sitemap / robots。
- 上线后复查关键页面渲染与多语言。

## 6) Growth & Ops
- 初始内容批量上架（精选 + AI 定制）。
- 每周内容更新计划 + 证言更新。
- 监控指标：搜索量、详情转化、完成烹饪数。
