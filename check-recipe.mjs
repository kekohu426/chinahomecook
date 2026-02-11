import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. 查找南昌拌米粉
  const recipe = await prisma.recipe.findFirst({
    where: { title: { contains: '南昌' } },
    include: {
      cuisine: { select: { name: true } },
      location: { select: { name: true } },
      explorer: { select: { nameZh: true } },
      reviewer: { select: { nameZh: true } },
      translations: { where: { locale: 'en' }, select: { title: true, isReviewed: true } },
    }
  });

  if (!recipe) {
    console.log('未找到南昌拌米粉');
    const all = await prisma.recipe.findMany({ take: 5, select: { title: true } });
    console.log('现有菜谱:', all.map(r => r.title));
    return;
  }

  console.log('=== 1. 基本字段检查 ===');
  console.log('ID:', recipe.id);
  console.log('标题:', recipe.title);
  console.log('作者:', recipe.author || '❌ 缺失');
  console.log('菜系:', recipe.cuisine?.name || '❌ 缺失');
  console.log('地点:', recipe.location?.name || '❌ 缺失');
  console.log('探索者:', recipe.explorer?.nameZh || '❌ 缺失');
  console.log('审核者:', recipe.reviewer?.nameZh || '❌ 缺失');
  console.log('封面图:', recipe.coverImage ? '✅ 有' : '❌ 缺失');
  console.log('英文翻译:', recipe.translations?.[0]?.title || '❌ 缺失');

  const summary = recipe.summary;
  console.log('\n=== Summary 字段 ===');
  console.log('一句话简介:', summary?.oneLine || '❌ 缺失');
  console.log('主要食材:', summary?.primaryIngredients || '❌ 缺失');
  console.log('难度:', summary?.difficulty || '❌ 缺失');
  console.log('总时间:', summary?.timeTotalMin || '❌ 缺失');

  const steps = recipe.steps || [];
  console.log('\n=== 步骤检查 ===');
  console.log('步骤数量:', steps.length);
  if (steps[0]) {
    console.log('第1步 speechText:', steps[0].speechText || '❌ 缺失');
    console.log('第1步 visualCue:', steps[0].visualCue || '❌ 缺失');
    console.log('第1步 imageUrl:', steps[0].imageUrl ? '✅ 有' : '❌ 缺失');
  }

  // 2. 检查 AI 生成日志
  console.log('\n=== 2. AI 生成日志 ===');
  const logs = await prisma.aIGenerationLog.findMany({
    where: { recipeId: recipe.id },
    select: { id: true, stepName: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  if (logs.length > 0) {
    console.log('日志数量:', logs.length);
    logs.forEach(l => console.log(`  - ${l.stepName}: ${l.status}`));
  } else {
    console.log('❌ 无 AI 生成日志');
  }

  // 3. 检查图片生成任务
  console.log('\n=== 3. 图片生成任务 ===');
  const tasks = await prisma.imageGenTask.findMany({
    where: { recipeId: recipe.id },
    select: { id: true, status: true, imagesDone: true, shotsDone: true, totalSteps: true, totalShots: true },
  });
  if (tasks.length > 0) {
    tasks.forEach(t => {
      console.log('任务ID:', t.id);
      console.log('状态:', t.status);
      console.log('步骤图:', `${t.imagesDone}/${t.totalSteps}`);
      console.log('成品图:', `${t.shotsDone}/${t.totalShots}`);
    });
  } else {
    console.log('❌ 无图片生成任务');
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
