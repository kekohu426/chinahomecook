---
name: devops-deploy
description: DevOps and deployment automation for Next.js projects. Use when user says "部署", "deploy", "上线", "CI/CD", "发布", "Vercel", "Docker", or needs deployment and infrastructure guidance.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(npm:*), Bash(npx:*), Bash(docker:*), Bash(vercel:*)
---

# DevOps Deploy - 部署运维指南

## Overview

Next.js 项目的部署、CI/CD、监控和运维最佳实践。

## Deployment Options

| 平台 | 适用场景 | 优点 |
|------|----------|------|
| **Vercel** | 快速上线、个人项目 | 零配置、自动 CI/CD |
| **Docker** | 自主可控、企业部署 | 可移植、环境一致 |
| **Cloudflare Pages** | 静态为主、全球加速 | 免费额度大、边缘计算 |

---

## Vercel Deployment

### 快速部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署（首次会创建项目）
vercel

# 部署到生产
vercel --prod
```

### 环境变量配置

```bash
# 添加环境变量
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production

# 拉取环境变量到本地
vercel env pull .env.local
```

### vercel.json 配置

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

---

## Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 构建和运行

```bash
# 构建镜像
docker build -t my-app .

# 运行容器
docker run -p 3000:3000 --env-file .env.production my-app

# 使用 docker-compose
docker-compose up -d
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm i -g vercel

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Pre-deployment Checklist

### 代码检查

```bash
# 类型检查
npm run type-check

# Lint 检查
npm run lint

# 单元测试
npm test

# E2E 测试
npx playwright test

# 构建检查
npm run build
```

### 环境变量检查

```typescript
// scripts/check-env.ts
const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing environment variables:", missing);
  process.exit(1);
}

console.log("✅ All required environment variables are set");
```

### 数据库迁移

```bash
# 检查待迁移
npx prisma migrate status

# 应用迁移（生产）
npx prisma migrate deploy
```

---

## Monitoring

### 健康检查端点

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // 数据库连接检查
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
```

### 基础监控脚本

```bash
#!/bin/bash
# scripts/health-check.sh

URL="${1:-https://your-site.com/api/health}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed (HTTP $RESPONSE)"
  exit 1
fi
```

---

## Rollback

### Vercel 回滚

```bash
# 列出部署历史
vercel ls

# 回滚到特定部署
vercel rollback [deployment-url]
```

### Docker 回滚

```bash
# 查看镜像历史
docker images my-app

# 运行旧版本
docker run -p 3000:3000 my-app:previous-tag
```

---

## Checklist

部署前检查清单：

- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码通过 ESLint 检查
- [ ] 所有测试通过
- [ ] 构建成功无报错
- [ ] 环境变量已配置
- [ ] 数据库迁移已准备
- [ ] 健康检查端点正常
- [ ] SSL 证书有效
- [ ] 备份策略已就绪
- [ ] 监控告警已配置
