import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function main() {
  const count = await prisma.aIGenerationLog.count();
  console.log('当前日志数量:', count);

  if (count > 0) {
    const result = await prisma.aIGenerationLog.deleteMany({});
    console.log('已删除日志数量:', result.count);
  } else {
    console.log('没有日志需要删除');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
