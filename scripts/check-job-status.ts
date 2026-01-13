/**
 * 检查生成任务状态脚本
 *
 * 查看 GenerateJob 任务的状态和进度
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const jobId = process.argv[2];

  if (jobId) {
    // 查看单个任务
    const job = await prisma.generateJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      console.log(`❌ 任务 ${jobId} 不存在`);
      return;
    }

    console.log(`\n📋 任务详情: ${job.id}`);
    console.log(`   状态: ${job.status}`);
    console.log(`   成功: ${job.successCount}/${job.totalCount}`);
    console.log(`   失败: ${job.failedCount}`);
    console.log(`   创建时间: ${job.createdAt}`);
    console.log(`   开始时间: ${job.startedAt || "未开始"}`);
    console.log(`   完成时间: ${job.completedAt || "未完成"}`);

    // 查看关联的食谱
    const results = job.results as any[];
    if (results && results.length > 0) {
      console.log(`\n📖 生成的食谱:`);
      for (const result of results) {
        const statusIcon = result.status === "success" ? "✅" : "❌";
        console.log(`   ${statusIcon} ${result.recipeName} ${result.recipeId ? `(${result.recipeId})` : result.error || ""}`);
      }
    }
  } else {
    // 查看最近的任务列表
    const jobs = await prisma.generateJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`\n📋 最近 10 个任务:`);
    for (const job of jobs) {
      const statusEmoji = {
        pending: "⏳",
        running: "🔄",
        completed: "✅",
        failed: "❌",
        cancelled: "🚫",
        partial: "⚠️",
      }[job.status] || "❓";

      console.log(`   ${statusEmoji} ${job.id} - ${job.status} (${job.successCount}/${job.totalCount})`);
    }

    console.log(`\n💡 使用 "npx tsx scripts/check-job-status.ts <jobId>" 查看详情`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
