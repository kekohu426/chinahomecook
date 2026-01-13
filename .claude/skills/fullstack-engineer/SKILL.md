---
name: fullstack-engineer
description: Full-stack development patterns for Next.js 15 App Router projects. Use when user says "全栈", "fullstack", "开发功能", "实现", "写代码", or needs end-to-end feature implementation guidance.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(git:*)
---

# Fullstack Engineer - 全栈开发指南

## Overview

Next.js 15 App Router + TypeScript + Prisma + Tailwind CSS 全栈开发最佳实践。

## Tech Stack

| 层级 | 技术 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth.js |
| State | React hooks / Zustand |
| Validation | Zod |

---

## Project Structure

```
app/
├── [locale]/              # 国际化路由
│   ├── layout.tsx
│   ├── page.tsx
│   └── (routes)/
├── api/                   # API 路由
│   ├── auth/
│   └── [resource]/
├── layout.tsx             # 根布局
└── globals.css

components/
├── ui/                    # 基础 UI 组件
├── layout/                # 布局组件
├── [feature]/             # 功能组件
└── providers/             # Context Providers

lib/
├── db/                    # 数据库相关
│   └── prisma.ts
├── auth/                  # 认证相关
├── utils.ts               # 工具函数
└── validations/           # Zod schemas

## Project-Specific Notes

- Locale routing is required: use `localizePath` and `/[locale]` routes.
- Content uses translation tables with fallback (`getContentLocales`).
- Admin endpoints require auth; user-facing routes are localized.

prisma/
├── schema.prisma
└── migrations/

types/
└── index.ts               # TypeScript 类型定义
```

---

## Feature Implementation Flow

### 1. 定义数据模型

```prisma
// prisma/schema.prisma
model Feature {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  name      String
  status    Status   @default(DRAFT)
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}

enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### 2. 生成 Prisma Client

```bash
npx prisma generate
npx prisma db push  # 开发环境
```

### 3. 创建 Zod Schema

```typescript
// lib/validations/feature.ts
import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial();

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
```

### 4. 创建 API 路由

```typescript
// app/api/features/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createFeatureSchema } from "@/lib/validations/feature";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// GET /api/features
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const [features, total] = await Promise.all([
      prisma.feature.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.feature.count(),
    ]);

    return NextResponse.json({
      data: features,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/features error:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}

// POST /api/features
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createFeatureSchema.parse(body);

    const feature = await prisma.feature.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/features error:", error);
    return NextResponse.json(
      { error: "Failed to create feature" },
      { status: 500 }
    );
  }
}
```

### 5. 创建 Server Component

```typescript
// app/[locale]/features/page.tsx
import { prisma } from "@/lib/db/prisma";
import { FeatureList } from "@/components/feature/FeatureList";

export default async function FeaturesPage() {
  const features = await prisma.feature.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Features</h1>
      <FeatureList features={features} />
    </div>
  );
}
```

### 6. 创建 Client Component

```typescript
// components/feature/FeatureList.tsx
"use client";

import { useState } from "react";
import type { Feature } from "@prisma/client";

interface FeatureListProps {
  features: Feature[];
}

export function FeatureList({ features: initialFeatures }: FeatureListProps) {
  const [features, setFeatures] = useState(initialFeatures);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/features/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFeatures(features.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      {features.map((feature) => (
        <div
          key={feature.id}
          className="p-4 bg-white rounded-lg border border-gray-200"
        >
          <h3 className="font-medium">{feature.name}</h3>
          <button
            onClick={() => handleDelete(feature.id)}
            className="text-red-600 text-sm mt-2"
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Common Patterns

### Error Handling

```typescript
// lib/utils/api.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  console.error("Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

### Data Fetching Hook

```typescript
// hooks/use-features.ts
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useFeatures(page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/features?page=${page}`,
    fetcher
  );

  return {
    features: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
```

### Form with Server Action

```typescript
// app/[locale]/features/new/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createFeatureSchema } from "@/lib/validations/feature";

async function createFeature(formData: FormData) {
  "use server";

  const data = {
    name: formData.get("name") as string,
  };

  const validated = createFeatureSchema.parse(data);

  await prisma.feature.create({
    data: validated,
  });

  redirect("/features");
}

export default function NewFeaturePage() {
  return (
    <form action={createFeature} className="space-y-4 max-w-md">
      <input
        name="name"
        placeholder="Feature name"
        className="w-full px-4 py-2 border rounded-lg"
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-gray-900 text-white rounded-lg"
      >
        Create
      </button>
    </form>
  );
}
```

---

## Checklist

功能开发检查清单：

- [ ] Prisma schema 定义完整
- [ ] Zod validation schema 创建
- [ ] API 路由实现（CRUD）
- [ ] 错误处理完善
- [ ] TypeScript 类型正确
- [ ] Server/Client 组件分离合理
- [ ] 权限检查（需要时）
- [ ] 数据库索引优化
- [ ] 响应式布局
- [ ] Loading/Error 状态处理
