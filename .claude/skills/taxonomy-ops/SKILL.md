---
name: taxonomy-ops
description: Manage Recipe Zen taxonomies (locations/cuisines/ingredients) including slug consistency, translation, sorting, and batch updates. Use when user says "地点", "菜系", "分类", "标签", "slug", "筛选", or needs taxonomy operations.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsx:*), Bash(curl:*)
---

# Taxonomy Operations

## Scope
Locations, cuisines, and ingredient taxonomy management.

## Workflow
1) **Audit**: check missing slug/translation.
2) **Fix**: generate slug, update rows, preserve existing URLs.
3) **Translate**: call admin translate endpoints.
4) **Validate**: ensure filters use slug values and display uses translations.

## Key Endpoints
- `GET /api/config/locations?active=true&locale=xx`
- `GET /api/config/cuisines?active=true&locale=xx`
- `POST /api/admin/config/locations/{id}/translate`
- `POST /api/admin/config/cuisines/{id}/translate`

## Notes
- **URL params should use slug**, not translated labels.
- Keep backward compatibility for old Chinese query params if needed.
- Recipe filters: `/[locale]/recipe?location=slug&cuisine=slug&ingredient=xx,yy`.
- Ensure `mainIngredients` values align with ingredient filter tokens.

## Browse Types (Home)
- `REGION` / `CUISINE` / `INGREDIENT` / `SCENE` are used for quick browse cards.
- Links should resolve to recipe list filters or search results.

## Slug Rules
- lowercase + hyphen; avoid spaces/underscores
- keep existing slugs stable after publish
- resolve conflicts with numeric suffix: `sichuan`, `sichuan-2`
- maintain a redirect map if a slug must change

## Batch Slug Fix (Template)

1) Export current locations/cuisines.
2) Generate slug if missing.
3) Update records with `PATCH` or SQL.

Example pseudo:
```
for item in locations:
  if !item.slug:
    item.slug = slugify(item.name)
  update(item.id, item.slug)
```
