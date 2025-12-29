# 食谱研习 (Recipe Zen) 🍜

> 极致治愈 × 极致实用的中国美食指南

## 项目简介

一个 AI 驱动的治愈系美食网站，用户可以：
- 📖 浏览精美的中国菜谱（吉卜力/日杂风格配图）
- 🤖 AI 无感生成定制化食谱
- 🎯 点开就能照做（语音朗读 + 计时器）
- 📚 阅读美食文化故事（《舌尖上的中国》风格）

## 技术栈

- **前端**：Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes
- **数据库**：Neon (Serverless PostgreSQL) + Prisma ORM
- **存储**：Cloudflare R2 (图片CDN)
- **AI**：灵活配置（DeepSeek / OpenAI）
- **部署**：Vercel

## 快速开始

```bash
npm install
cp .env.example .env.local
npx prisma db push
npm run dev
```

## 项目文档

- 📐 [架构设计](./docs/ARCHITECTURE.md)
- 🛠️ [开发指南](./docs/DEVELOPMENT.md)
- 📝 [技术决策](./docs/DECISIONS.md)
- 📋 [变更日志](./docs/CHANGELOG.md)
- ✅ [待办事项](./docs/TODO.md)
- 🔌 [API文档](./docs/API.md)

## 开发状态

🚧 当前阶段：**MVP 开发中**

查看 [TODO.md](./docs/TODO.md) 了解详细进度
