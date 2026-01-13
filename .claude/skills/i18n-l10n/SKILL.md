---
name: i18n-l10n
description: Internationalization and localization for Recipe Zen (Next.js App Router). Use when user says "多语言", "i18n", "locale", "翻译", "hreflang", "语言路由", or needs to add/extend languages.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx prisma:*), Bash(curl:*)
---

# i18n / L10n

## Scope
Locale routing, translation tables, fallback logic, and SEO alternates.

## Quick Checklist
1) **Locales**: update `lib/i18n/config.ts` (SUPPORTED_LOCALES, LOCALE_LABELS, CONTENT_LOCALE_FALLBACKS).
2) **Routing**: ensure middleware redirects to `/<locale>` and uses `localizePath`.
3) **DB translations**: use translation tables (RecipeTranslation, BlogPostTranslation, LocationTranslation, CuisineTranslation).
4) **Fetch**: use `getContentLocales(locale)` + `pickTranslation` for content.
5) **SEO**: add `hreflang` alternates and localized metadata.

## Locale Expansion Checklist (8-10 languages)
- Add locale codes + labels in `lib/i18n/config.ts`
- Seed translations for home/about config
- Ensure `sitemap.xml` includes new locales
- Add `hreflang` alternates for new locales
- Verify admin translation endpoints support new locales
- Validate fallback order and default zh

## Key Endpoints
- Recipes translate: `POST /api/admin/recipes/{id}/translate`
- Blog translate: `POST /api/admin/blog/{id}/translate`
- Home config translate: `POST /api/admin/config/home/translate`
- Locations translate: `POST /api/admin/config/locations/{id}/translate`
- Cuisines translate: `POST /api/admin/config/cuisines/{id}/translate`

## Notes
- Prefer **slug** in URLs and filters; keep translated labels only for display.
- Fallback order: target locale → fallback locales → default zh.

## Hreflang (Guideline)

- Add `<link rel="alternate" hreflang="x">` for each supported locale.
- Canonical points to the current locale URL.
- Use base URL from env + `localizePath`.
