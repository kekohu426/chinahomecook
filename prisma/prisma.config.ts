/**
 * Prisma 7 配置文件
 * 用于数据库迁移时的连接配置
 */

import { defineConfig } from "@prisma/cli";
import { loadEnvFile } from "node:process";
import { join } from "node:path";

// 加载 .env.local 文件
loadEnvFile(join(process.cwd(), ".env.local"));

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
