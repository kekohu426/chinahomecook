---
name: content-ops
description: Content operations workflow (create, translate, review, publish) for Recipe Zen recipes and blog posts. Use when user says "发布流程", "审核", "排期", "运营", "内容管理", "上架".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*)
---

# Content Operations

## Goal
Provide a repeatable workflow for creating, translating, reviewing, and publishing recipes/blog posts.

## Workflow (Default)
1) **Create**: Generate or draft content (recipes/blog).
2) **Review**: Manual check for accuracy, tone, and completeness.
3) **Translate**: Use AI translation endpoints; mark `isApproved` when reviewed.
4) **Publish**: Set status and optional schedule time.
5) **Validate**: Check frontend display + sitemap update.

## Scheduling Template

```
Title:
Type: recipe | blog
Primary locale: zh
Secondary locale: en
Publish mode: now | schedule
Publish time (UTC+8):
Reviewer:
Approval status: pending | approved
Notes:
```

## Review Checklist

- Title/summary match the main keyword
- Steps are complete and reproducible
- Ingredients have units and quantities
- Story content is factual and non-misleading
- Images/alt text are appropriate
- SEO meta title/description present

## Quality QA (Quick)

- Tone: warm, professional, no exaggerated claims
- Safety: avoid unsafe cooking advice
- Links: internal links resolve; no dead links
- Locale: zh/en fields present if required; fallback ok

## Key Endpoints
- Blog list: `GET /api/admin/blog`
- Blog publish: `POST /api/admin/blog/{id}/publish`
- Blog translate: `POST /api/admin/blog/{id}/translate`
- Recipes list: `GET /api/recipes`
- Recipe publish: `PATCH /api/recipes/{id}`
- Recipe translate: `POST /api/admin/recipes/{id}/translate`

## Publishing Rules
- **Manual review required** by default.
- Use **slug** for SEO; avoid changes after publish unless necessary.
- If translation missing, **publish only zh** and queue en review.
