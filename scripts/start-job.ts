/**
 * 直接启动生成任务（绕过API）
 *
 * 使用方式: npx tsx scripts/start-job.ts
 */

import * as fs from "fs";
import * as path from "path";

// 先加载环境变量
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);
    // 去掉引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 50) + "...");
console.log("GLM_API_KEY:", process.env.GLM_API_KEY ? "已配置" : "未配置");

// 使用动态导入
async function run() {
  const { prisma } = await import("../lib/db/prisma");
  const { executeGenerateJob } = await import("../lib/ai/job-executor");

  const JOB_ID = process.env.JOB_ID || "cmk2389wg0000e521f6zyn0a8";

  console.log(`\n=== 启动生成任务: ${JOB_ID} ===\n`);

  // 检查任务状态
  const job = await prisma.generateJob.findUnique({
    where: { id: JOB_ID },
    select: { status: true, totalCount: true, recipeNames: true },
  });

  if (!job) {
    console.error("❌ 任务不存在");
    return;
  }

  if (job.status !== "pending") {
    console.error(`❌ 任务状态异常: ${job.status}`);
    return;
  }

  console.log(`任务状态: ${job.status}`);
  console.log(`待生成: ${job.totalCount} 道菜`);
  console.log(`菜名: ${(job.recipeNames as string[]).join(", ")}`);
  console.log("\n开始执行...\n");

  // 执行任务
  const result = await executeGenerateJob(JOB_ID);

  console.log("\n=== 执行结果 ===");
  console.log(`成功: ${result.successCount}`);
  console.log(`失败: ${result.failedCount}`);

  if (result.results) {
    console.log("\n详细:");
    for (const r of result.results) {
      const icon = r.status === "success" ? "✅" : "❌";
      console.log(`  ${icon} ${r.recipeName}${r.error ? ` - ${r.error}` : ""}`);
    }
  }

  if (result.error) {
    console.log(`\n错误: ${result.error}`);
  }
}

run()
  .catch(console.error)
  .finally(() => process.exit(0));
