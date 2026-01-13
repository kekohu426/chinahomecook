---
name: fullstack-process
description: End-to-end fullstack development process for indie projects (idea → build → launch → iterate). Use when user says "全栈流程", "开发过程", "从0到1", "上线流程", or wants a step-by-step delivery playbook.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(git:*), Bash(curl:*)
---

# Fullstack Process (Idea → Launch)

## 0) Scope & Success
- Define target user, core job-to-be-done, and success metric.
- Write a one-page brief: problem, audience, solution, MVP scope.

## 1) Product & UX
- Map user journey (entry → activation → retention).
- Draft key screens, key states, and empty states.
- Decide content strategy (SEO, blog, landing pages).

## 2) Data & Architecture
- Draft data models and relationships.
- Define API contracts (list/detail/create/update).
- Decide caching and pagination.

## 3) Build
- Implement DB schema + migrations.
- Implement API routes + validation.
- Build UI components + pages.
- Wire i18n and SEO metadata.

## 4) QA
- Manual smoke tests for key flows.
- API tests for critical endpoints.
- Lighthouse/Performance checks for main pages.

## 5) Launch
- Configure env vars and production build.
- Run migrations and seed baseline data.
- Verify sitemap/robots/hreflang.

## 6) Growth & Ops
- Publish initial content batch.
- Set up analytics dashboards.
- Add feedback loop and support flow.

## 7) Iterate
- Review metrics weekly.
- Ship small improvements and new content.

## Deliverables Checklist
- PRD or one-pager
- Schema + API map
- Core UI screens
- SEO & analytics ready
- Release checklist and rollback plan
