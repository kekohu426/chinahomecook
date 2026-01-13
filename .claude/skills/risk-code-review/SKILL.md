---
name: risk-code-review
description: Risk-focused code review that enumerates all risk points with precise file/line locations and suggested fixes. Use when the user asks for code review/代码审查/审查/检查风险/安全/质量 review, or when validating completed features for bugs, regressions, security, or SEO/ops risks.
---

# Risk Code Review

## Overview
Identify and list every risk point in the reviewed code, with exact file/line references and concrete fixes, prioritizing severity.

## Workflow

### 1) Define scope
- Confirm target files or features.
- If unclear, review only the files related to the requested functionality.

### 2) Inspect by risk domains
Scan for issues across:
- **Security**: authz/authn, public API exposure, input validation, secret leakage.
- **Data integrity**: incorrect queries, missing constraints, race conditions, unsafe updates.
- **Behavior**: edge cases, pagination/filters, locale fallbacks, status gating.
- **SEO**: metadata, canonical/noindex, sitemap coverage.
- **Performance**: N+1 queries, heavy renders, missing pagination, cache misuse.
- **DX/ops**: admin routes protection, logging, error handling.

### 3) Produce a risk register
- Must list **all** risks found, ordered by severity.
- Each entry includes **severity**, **file path**, **line number**, **problem**, and **fix**.
- If no issues, explicitly state “未发现风险点”，并补充残留风险（如未运行测试）。

## Output Format (mandatory)

```
# Code Review Report

## Summary
- Files reviewed: X
- 🔴 Critical: X
- 🟡 Warning: X
- 🟢 Suggestion: X

## Issues

### 🔴 [Critical] path/to/file.ts:123
Problem: ...
Fix: ...
```
