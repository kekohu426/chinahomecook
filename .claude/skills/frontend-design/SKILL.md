---
name: frontend-design
description: Professional frontend design guidance for React/Next.js/Tailwind projects. Use when user says "design", "UI", "界面设计", "样式", "美化", or wants to improve visual aesthetics and avoid generic AI-generated look.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Frontend Design - 前端设计指南

## Overview

专业的前端设计指导，帮助避免"AI味"设计，创建高质量的用户界面。适用于 React + Tailwind CSS 项目。

## Recipe Zen Style Notes

- Warm, food-first palette: beige/light neutral base, orange as primary accent.
- Favor clean photography; avoid heavy gradients and purple-heavy schemes.
- Typography: readable, calm; keep headings with stronger weight but not oversized.

## Design Principles

### 1. 避免"AI味"设计

**常见问题**:
- 过度使用渐变和阴影
- 颜色过于鲜艳饱和
- 间距不一致
- 过多装饰元素
- 通用的蓝紫配色

**解决方案**:
- 使用克制的色彩
- 保持一致的间距系统
- 减少不必要的装饰
- 注重内容层次

### 2. 色彩系统

```css
/* 推荐的中性色基础 */
--gray-50: #fafafa;
--gray-100: #f5f5f5;
--gray-200: #e5e5e5;
--gray-300: #d4d4d4;
--gray-400: #a3a3a3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;

/* 品牌色使用原则 */
- 主色只用于关键操作（CTA按钮、链接）
- 辅助色用于状态提示
- 大面积使用中性色
```

### 3. 间距系统 (8px Grid)

```css
/* Tailwind 间距映射 */
space-1: 4px   /* 紧凑元素内部 */
space-2: 8px   /* 相关元素间 */
space-3: 12px  /* 小组件内部 */
space-4: 16px  /* 标准间距 */
space-6: 24px  /* 区块内部 */
space-8: 32px  /* 区块之间 */
space-12: 48px /* 大区块分隔 */
space-16: 64px /* 页面级分隔 */
```

### 4. 字体层次

```css
/* 推荐的字号系统 */
text-xs: 12px   /* 辅助信息、标签 */
text-sm: 14px   /* 正文、次要内容 */
text-base: 16px /* 主要正文 */
text-lg: 18px   /* 强调正文 */
text-xl: 20px   /* 小标题 */
text-2xl: 24px  /* 区块标题 */
text-3xl: 30px  /* 页面标题 */
text-4xl: 36px  /* 大标题 */

/* 字重使用 */
font-normal: 正文
font-medium: 小标题、强调
font-semibold: 标题
font-bold: 极少使用
```

---

## Component Patterns

### Card 组件

```tsx
// ✅ Good - 简洁克制
<div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
  <p className="mt-2 text-sm text-gray-600">{description}</p>
</div>

// ❌ Bad - 过度设计
<div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 transform hover:scale-105">
  <h3 className="text-2xl font-bold text-white drop-shadow-lg">{title}</h3>
</div>
```

### Button 组件

```tsx
// Primary Button
<button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
  确认
</button>

// Secondary Button
<button className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
  取消
</button>

// Ghost Button
<button className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
  了解更多
</button>
```

### Input 组件

```tsx
<input
  type="text"
  className="w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none transition-colors"
  placeholder="请输入..."
/>
```

---

## Layout Patterns

### 响应式容器

```tsx
// 标准容器
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {children}
</div>

// 窄容器（文章、表单）
<div className="max-w-2xl mx-auto px-4">
  {children}
</div>
```

### Grid 布局

```tsx
// 卡片网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// 不等宽两栏
<div className="flex flex-col lg:flex-row gap-8">
  <main className="flex-1">{content}</main>
  <aside className="lg:w-80">{sidebar}</aside>
</div>
```

---

## Visual Hierarchy

### 层次分明的页面结构

```tsx
// 页面标题区
<header className="border-b border-gray-100 pb-6 mb-8">
  <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
  <p className="mt-2 text-gray-600">{subtitle}</p>
</header>

// 内容区块
<section className="mb-12">
  <h2 className="text-lg font-medium text-gray-900 mb-4">{sectionTitle}</h2>
  <div>{content}</div>
</section>
```

### 状态反馈

```tsx
// Success
<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
  操作成功
</div>

// Error
<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
  操作失败
</div>

// Warning
<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
  请注意
</div>

// Info
<div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
  提示信息
</div>
```

---

## Animation Guidelines

### 推荐的过渡

```css
/* 基础过渡 */
transition-colors: 颜色变化
transition-opacity: 透明度变化
transition-shadow: 阴影变化
transition-transform: 位移/缩放

/* 时长 */
duration-150: 快速反馈（hover）
duration-200: 标准过渡
duration-300: 较慢过渡（模态框）
```

### 避免的动画

- 过度的缩放效果 (scale > 1.05)
- 长时间的动画 (> 500ms)
- 同时触发多个动画
- 无意义的装饰性动画

---

## Checklist

设计审查清单：

- [ ] 颜色饱和度适中，不刺眼
- [ ] 间距使用 8px 网格系统
- [ ] 字体层次清晰（最多3-4种大小）
- [ ] 圆角统一（推荐 8px/12px/16px）
- [ ] 阴影克制使用
- [ ] 响应式适配完整
- [ ] 交互反馈明确但不夸张
- [ ] 无障碍色彩对比度达标
