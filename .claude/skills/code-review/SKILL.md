---
name: code-review
description: Perform comprehensive code review for TypeScript/React projects. Use when user says "review code", "check code quality", "审查代码", "代码review", or wants to find bugs, security issues, and improvement opportunities.
allowed-tools: Read, Grep, Glob, Bash(npm run type-check:*), Bash(npm test:*)
---

# Code Review

## Overview

Comprehensive code review skill for TypeScript/React/Next.js projects. Analyzes code quality, security, performance, and best practices.

## When to Use

Use this skill when:
- User requests code review or quality check
- Before merging PRs or major features
- When investigating bugs or performance issues
- User mentions "代码审查", "review", "检查代码"

## Review Checklist

### 1. Code Quality
- [ ] Type safety (no `any` abuse)
- [ ] Proper error handling
- [ ] Clean function/variable naming
- [ ] DRY principle adherence
- [ ] Single responsibility principle

### 2. Security
- [ ] No hardcoded secrets
- [ ] Input validation
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Proper authentication checks

### 3. Performance
- [ ] Unnecessary re-renders
- [ ] Memory leaks (uncleared intervals, event listeners)
- [ ] Large bundle imports
- [ ] Database query optimization

### 4. React/Next.js Specific
- [ ] Proper use of `use client` / `use server`
- [ ] Correct hook dependencies
- [ ] Key props in lists
- [ ] Image optimization
- [ ] Metadata for SEO

## Instructions

### Step 1: Identify Files to Review
```bash
# Find recently modified files
git diff --name-only HEAD~5

# Or search for specific patterns
Glob("**/*.tsx")
```

### Step 2: Read and Analyze
Read each file and check against the review checklist above.

### Step 3: Generate Report
Provide a structured report with:
- Severity levels: 🔴 Critical | 🟡 Warning | 🟢 Suggestion
- File location and line numbers
- Problem description
- Suggested fix

## Output Format

```markdown
# Code Review Report

## Summary
- Total files reviewed: X
- Critical issues: X
- Warnings: X
- Suggestions: X

## Issues

### 🔴 [Critical] File: path/to/file.tsx:123
**Problem**: Description
**Fix**: Suggested solution

### 🟡 [Warning] File: path/to/file.tsx:456
**Problem**: Description
**Fix**: Suggested solution
```

## Examples

### Example: Review a component
User: "Review the RecipeCard component"

Response: Read the file, analyze against checklist, provide structured report.

### Example: Security audit
User: "Security check for API routes"

Response: Focus on authentication, input validation, and data exposure.
