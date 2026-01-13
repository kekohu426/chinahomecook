---
name: page-config
description: Manage homepage/about page configuration in Recipe Zen. Use when user says "首页配置", "About配置", "文案调整", "首页数据", "用户证言", or needs admin config workflow.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(curl:*)
---

# Page Configuration (Home/About)

## Scope
Admin configuration for **Home** and **About** pages, including localized content.

## Home Config (Admin)
- Entry: `/admin/config/home`
- Data areas: **Hero**, **Stats**, **Browse**, **Testimonials**, **Themes**
- APIs:
  - `GET/POST /api/config/home`
  - `GET/PUT/DELETE /api/config/home/browse/[id]`
  - `GET/PUT/DELETE /api/config/home/testimonials/[id]`
  - `GET /api/config/themes`
  - `POST /api/admin/config/home/translate`
  - `POST /api/admin/config/home/browse/[id]/translate`
  - `POST /api/admin/config/home/testimonials/[id]/translate`

## About Config (Admin)
- Entry: `/admin/config/about`
- APIs:
  - `GET/POST /api/config/about`
  - `GET/PUT/DELETE /api/config/about/[id]`
  - `POST /api/admin/config/about/translate`

## Workflow
1) Load current locale data.
2) Edit text/images + sort/order + active flags.
3) Save and verify frontend.
4) Run translation endpoints for en, then review.
5) Confirm sitemap/metadata for SEO pages if relevant.

## Notes
- Keep **zh as canonical**, en via locale route.
- Avoid mentioning “AI 生成” in public-facing hero copy; emphasize **专业审核/可信**.
