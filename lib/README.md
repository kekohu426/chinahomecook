# 库函数目录结构

## 📁 文件夹说明

### `/lib/ai`
AI 服务提供商抽象层
- `provider.ts` - AI Provider 接口定义
- `deepseek.ts` - DeepSeek 实现
- `openai.ts` - OpenAI 实现
- `stability.ts` - Stability AI（图片生成）
- `config.ts` - 配置和切换逻辑

**设计原则**：
- 统一接口，可灵活切换
- 支持流式响应（AI对话）
- 错误处理和重试机制

### `/lib/db`
数据库相关工具
- `prisma.ts` - Prisma 客户端单例
- `queries/` - 数据查询函数
- `migrations/` - 数据库迁移脚本

### `/lib/utils`
通用工具函数
- `cn.ts` - Tailwind 类名合并
- `format.ts` - 格式化函数（时间、数量等）
- `validation.ts` - Zod 验证 Schema
- `storage.ts` - Cloudflare R2 图片上传

## 🔧 使用示例

### AI Provider
```typescript
import { getAIProvider } from "@/lib/ai/provider";

const ai = getAIProvider("text"); // 根据环境变量自动选择
const response = await ai.chat("没放啤酒可以用白酒代替吗？");
```

### 数据库查询
```typescript
import { getRecipeById } from "@/lib/db/queries/recipes";

const recipe = await getRecipeById("recipe-123");
```

### 工具函数
```typescript
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";

const className = cn("base-class", isActive && "active-class");
const time = formatDuration(120); // "2分钟"
```

## 📝 开发规范

1. 所有函数必须有 TypeScript 类型
2. 复杂逻辑添加 JSDoc 注释
3. 错误处理必须完善
4. 敏感数据使用环境变量
5. 添加单元测试（未来）
