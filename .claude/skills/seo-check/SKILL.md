---
name: seo-check
description: Technical SEO audit for Next.js App Router (metadata, sitemap, robots, structured data, hreflang). Use when user says "SEO check", "检查SEO", "meta tags", "sitemap", "structured data", "hreflang".
allowed-tools: Read, Grep, Glob, Bash(curl:*), Bash(npx:*)
---

# SEO Check

## Overview

Comprehensive SEO audit for Next.js 15 App Router projects. Checks metadata, structured data, performance, accessibility, and technical SEO.

## When to Use

Use this skill when:
- Launching new pages/features
- SEO audit requested
- Checking meta tags and Open Graph
- Verifying sitemap and robots.txt
- Optimizing for search engines

## SEO Checklist

### 1. Metadata (必须)

- [ ] Title tag (50-60 chars)
- [ ] Meta description (150-160 chars)
- [ ] Canonical URL
- [ ] Language/locale tags
- [ ] Viewport meta

### 2. Open Graph (社交分享)

- [ ] og:title
- [ ] og:description
- [ ] og:image (1200x630px)
- [ ] og:url
- [ ] og:type
- [ ] og:site_name

### 3. Twitter Cards

- [ ] twitter:card
- [ ] twitter:title
- [ ] twitter:description
- [ ] twitter:image

### 4. Structured Data (JSON-LD)

- [ ] Recipe schema (for recipes)
- [ ] Article schema (for blog)
- [ ] Organization schema
- [ ] BreadcrumbList schema

### 5. Technical SEO

- [ ] sitemap.xml
- [ ] robots.txt
- [ ] Canonical URLs
- [ ] Hreflang tags (i18n)
- [ ] Locale-aware sitemap entries for `/[locale]` routes

## Recipe Zen Targets

- Home: `/[locale]`
- Recipes: `/[locale]/recipe` and `/[locale]/recipe/[id]`
- Blog: `/[locale]/blog` and `/[locale]/blog/[slug]`
- Gallery: `/[locale]/gallery` and `/[locale]/gallery/[id]`
- About: `/[locale]/about`
- [ ] 404/500 error pages

### 6. Performance (Core Web Vitals)

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

## Next.js 15 Metadata API

### Static Metadata (layout.tsx / page.tsx)

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '页面标题 | 网站名',
  description: '150-160字符的描述...',
  keywords: ['关键词1', '关键词2'],
  authors: [{ name: 'Author Name' }],
  creator: 'Creator Name',

  // Open Graph
  openGraph: {
    title: '分享标题',
    description: '分享描述',
    url: 'https://example.com/page',
    siteName: '网站名',
    images: [
      {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '图片描述',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter标题',
    description: 'Twitter描述',
    images: ['https://example.com/twitter-image.jpg'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Canonical
  alternates: {
    canonical: 'https://example.com/page',
    languages: {
      'en': 'https://example.com/en/page',
      'zh': 'https://example.com/zh/page',
    },
  },
};
```

### Dynamic Metadata (generateMetadata)

```typescript
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const recipe = await getRecipe(params.id);

  return {
    title: `${recipe.titleZh} | Recipe Zen`,
    description: recipe.summary.oneLine,
    openGraph: {
      title: recipe.titleZh,
      description: recipe.summary.oneLine,
      images: [recipe.coverImage],
    },
  };
}
```

## Structured Data (JSON-LD)

### Recipe Schema

```typescript
// components/seo/RecipeJsonLd.tsx
export function RecipeJsonLd({ recipe }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.titleZh,
    description: recipe.summary.oneLine,
    image: recipe.coverImage,
    author: {
      '@type': 'Organization',
      name: 'Recipe Zen',
    },
    prepTime: `PT${recipe.summary.timeActiveMin}M`,
    cookTime: `PT${recipe.summary.timeTotalMin - recipe.summary.timeActiveMin}M`,
    totalTime: `PT${recipe.summary.timeTotalMin}M`,
    recipeYield: `${recipe.summary.servings} servings`,
    recipeCategory: recipe.cuisine,
    recipeCuisine: 'Chinese',
    recipeIngredient: recipe.ingredients.flatMap(s =>
      s.items.map(i => `${i.amount}${i.unit} ${i.name}`)
    ),
    recipeInstructions: recipe.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.action,
      image: step.imageUrl,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### BreadcrumbList Schema

```typescript
export function BreadcrumbJsonLd({ items }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

## Key Files to Check

```bash
# Sitemap
app/sitemap.ts

# Robots
app/robots.ts

# Root layout (global metadata)
app/layout.tsx
app/[locale]/layout.tsx

# Page-specific metadata
app/[locale]/recipe/[id]/page.tsx
app/[locale]/blog/[slug]/page.tsx
```

## Audit Commands

### Check Sitemap
```bash
curl -s http://localhost:3000/sitemap.xml | head -50
```

### Check Robots
```bash
curl -s http://localhost:3000/robots.txt
```

### Check Page Metadata
```bash
curl -s http://localhost:3000/recipe/xxx | grep -E '<title>|<meta|application/ld\+json' | head -30
```

### Validate Structured Data
Use Google Rich Results Test:
https://search.google.com/test/rich-results

## Common Issues

### Missing Metadata
**Problem**: Pages without title/description
**Fix**: Add `metadata` export or `generateMetadata` function

### Duplicate Content
**Problem**: Same content accessible via multiple URLs
**Fix**: Set canonical URLs in metadata

### Missing Alt Text
**Problem**: Images without alt attributes
**Fix**: Add descriptive alt text to all images

### Slow LCP
**Problem**: Largest Contentful Paint > 2.5s
**Fix**:
- Optimize images (use next/image)
- Preload critical resources
- Reduce server response time

### Missing Hreflang
**Problem**: i18n pages without language alternates
**Fix**: Add `alternates.languages` in metadata

## Output Format

```markdown
# SEO Audit Report

## Summary
- Pages checked: X
- Critical issues: X
- Warnings: X
- Passed: X

## Critical Issues 🔴

### Missing metadata: /page-path
- No title tag
- No meta description

## Warnings 🟡

### Suboptimal: /page-path
- Title too long (65 chars, max 60)
- Missing og:image

## Passed ✅

- sitemap.xml exists
- robots.txt configured
- Structured data valid

## Recommendations

1. Add metadata to pages without it
2. Optimize images for faster LCP
3. Add JSON-LD for all recipe pages
```
