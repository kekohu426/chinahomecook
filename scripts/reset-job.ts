/**
 * 重置任务状态
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
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function run() {
  const { prisma } = await import("../lib/db/prisma");

  const JOB_ID = process.env.JOB_ID || "cmk2389wg0000e521f6zyn0a8";

  await prisma.generateJob.update({
    where: { id: JOB_ID },
    data: {
      status: "pending",
      successCount: 0,
      failedCount: 0,
      results: [],
      startedAt: null,
      completedAt: null,
    },
  });
  console.log(`✅ 任务 ${JOB_ID} 已重置为 pending`);
}

run()
  .catch(console.error)
  .finally(() => process.exit(0));
