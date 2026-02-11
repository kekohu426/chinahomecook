import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function main() {
  // 查看最近的 ImageGenTask
  const tasks = await prisma.imageGenTask.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      recipeName: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      totalSteps: true,
      promptsDone: true,
      imagesDone: true,
    }
  });

  console.log('最近的图片生成任务:');
  tasks.forEach(task => {
    console.log(`  - ${task.recipeName} (${task.status})`);
    console.log(`    ID: ${task.id}`);
    console.log(`    进度: prompts ${task.promptsDone}/${task.totalSteps}, images ${task.imagesDone}/${task.totalSteps}`);
    if (task.errorMessage) {
      console.log(`    错误: ${task.errorMessage}`);
    }
    console.log(`    创建时间: ${task.createdAt}`);
  });

  // 查看 AI 日志
  const logCount = await prisma.aIGenerationLog.count();
  console.log(`\nAI 生成日志数量: ${logCount}`);

  if (logCount > 0) {
    const logs = await prisma.aIGenerationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        stepName: true,
        modelName: true,
        status: true,
        createdAt: true,
      }
    });
    console.log('最近的日志:');
    logs.forEach(log => {
      console.log(`  - ${log.stepName} (${log.modelName}) - ${log.status} @ ${log.createdAt}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
