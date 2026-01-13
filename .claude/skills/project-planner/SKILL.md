---
name: project-planner
description: Project planning and documentation for indie developers. Use when user says "规划项目", "project plan", "PRD", "需求文档", "架构设计", or needs to create project documentation from requirements.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Project Planner - 项目规划

## Overview

从需求到技术方案的完整项目规划工具，生成 PRD、技术设计文档和实施计划。

## Document Types

### 1. PRD (产品需求文档)

```markdown
# 产品需求文档: [项目名称]

## 文档信息
- 版本: 1.0
- 日期: YYYY-MM-DD
- 作者: [作者]

---

## 1. 项目背景

### 1.1 问题陈述
[描述当前存在的问题或痛点]

### 1.2 目标用户
| 用户类型 | 描述 | 核心需求 |
|----------|------|----------|
| 用户A | ... | ... |
| 用户B | ... | ... |

### 1.3 项目目标
- 目标1: [可量化的目标]
- 目标2: [可量化的目标]

---

## 2. 功能需求

### 2.1 功能概览

| 功能模块 | 优先级 | 状态 |
|----------|--------|------|
| 功能A | P0 | 待开发 |
| 功能B | P1 | 待开发 |

### 2.2 详细需求

#### FR-001: [功能名称]
- **描述**: [功能描述]
- **用户故事**: 作为[角色]，我希望[功能]，以便[价值]
- **验收标准**:
  - [ ] AC-1: [验收条件]
  - [ ] AC-2: [验收条件]
- **优先级**: P0/P1/P2
- **依赖**: [依赖项]

---

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间 < 3s
- API 响应时间 < 500ms
- 支持 1000 并发用户

### 3.2 安全要求
- HTTPS 加密
- 用户认证
- 数据脱敏

### 3.3 兼容性
- 浏览器: Chrome, Safari, Firefox (最新2个版本)
- 设备: Desktop, Tablet, Mobile

---

## 4. 界面原型
[链接或截图]

---

## 5. 发布计划

### MVP (Phase 1)
- 功能范围: [...]
- 目标日期: YYYY-MM-DD

### Phase 2
- 功能范围: [...]
- 目标日期: YYYY-MM-DD
```

---

### 2. 技术设计文档

```markdown
# 技术设计文档: [项目名称]

## 1. 技术选型

### 1.1 技术栈
| 层级 | 技术 | 版本 | 选择理由 |
|------|------|------|----------|
| Frontend | Next.js | 15.x | SSR/SSG、App Router |
| Styling | Tailwind CSS | 4.x | 快速开发、可维护 |
| Database | PostgreSQL | 15.x | 关系型、JSON 支持 |
| ORM | Prisma | 6.x | 类型安全、迁移 |
| Auth | NextAuth.js | 5.x | OAuth、JWT |

### 1.2 基础设施
| 服务 | 提供商 | 用途 |
|------|--------|------|
| Hosting | Vercel | 应用部署 |
| Database | Neon | PostgreSQL |
| Storage | Cloudflare R2 | 图片存储 |
| CDN | Cloudflare | 静态资源加速 |

---

## 2. 系统架构

### 2.1 架构图
```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                  Vercel Edge Network                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Static    │  │   SSR/ISR   │  │  API Routes │  │
│  │   Assets    │  │   Pages     │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  Neon DB  │   │    R2     │   │  External │
    │(PostgreSQL)│   │ (Storage) │   │   APIs    │
    └───────────┘   └───────────┘   └───────────┘
```

### 2.2 目录结构
[项目目录结构]

---

## 3. 数据模型

### 3.1 ER 图
[实体关系图]

### 3.2 核心模型
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // ...
}
```

---

## 4. API 设计

### 4.1 RESTful 接口

| Method | Path | 描述 | Auth |
|--------|------|------|------|
| GET | /api/resources | 列表 | No |
| GET | /api/resources/:id | 详情 | No |
| POST | /api/resources | 创建 | Yes |
| PUT | /api/resources/:id | 更新 | Yes |
| DELETE | /api/resources/:id | 删除 | Yes |

### 4.2 请求/响应格式
[示例]

---

## 5. 安全设计

### 5.1 认证
- NextAuth.js + OAuth (Google)
- JWT Session

### 5.2 授权
- Role-based Access Control (RBAC)
- Admin / User 角色

### 5.3 数据安全
- 敏感数据加密存储
- API Rate Limiting
- Input Validation (Zod)

---

## 6. 部署架构

### 6.1 环境
| 环境 | 用途 | URL |
|------|------|-----|
| Development | 本地开发 | localhost:3000 |
| Preview | PR 预览 | *.vercel.app |
| Production | 生产环境 | your-domain.com |

### 6.2 CI/CD
[GitHub Actions 流程]
```

---

### 3. 任务分解

```markdown
# 任务分解: [项目名称]

## Epic 1: 用户认证

### Task 1.1: NextAuth 配置
- **描述**: 配置 NextAuth.js 和 Google OAuth
- **验收标准**:
  - [ ] 用户可以通过 Google 登录
  - [ ] 登录状态持久化
  - [ ] 未登录用户访问保护路由时重定向
- **技术要点**:
  - 配置 `lib/auth/config.ts`
  - 创建 `app/api/auth/[...nextauth]/route.ts`
  - 添加 AuthProvider
- **依赖**: 无
- **预估**: 2h

### Task 1.2: 用户信息存储
- **描述**: 用户首次登录时保存到数据库
- **验收标准**:
  - [ ] 新用户自动创建记录
  - [ ] 返回用户包含 id 和 role
- **技术要点**:
  - Prisma User model
  - NextAuth callbacks
- **依赖**: Task 1.1
- **预估**: 1h

---

## Epic 2: 核心功能

### Task 2.1: ...
```

---

## Workflow

### 从零开始规划项目

1. **收集需求** → 生成 PRD
2. **技术设计** → 生成技术设计文档
3. **任务分解** → 生成任务列表
4. **开始执行** → 使用 superpowers 的 /execute-plan

### 触发词

- "帮我规划这个项目"
- "写一个 PRD"
- "做技术设计"
- "分解任务"
- "生成需求文档"

---

## Templates Location

模板文件保存位置：
- `docs/PRD.md`
- `docs/TECHNICAL_DESIGN.md`
- `docs/TASKS.md`

建议将文档提交到 Git 进行版本管理。
