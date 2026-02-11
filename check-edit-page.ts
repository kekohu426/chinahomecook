import { prisma } from './lib/db/prisma';

async function main() {
  // 1. 查看编辑页面加载的数据
  const recipe = await prisma.recipe.findUnique({
    where: { id: 'cmkxiwiyf0006douoxr7epnrk' },
    include: {
      cuisine: true,
      location: true,
    },
  });

  if (!recipe) {
    console.log('未找到菜谱');
    return;
  }

  console.log('=== 编辑页面加载的原始数据 ===');
  console.log('title:', recipe.title);
  console.log('author:', recipe.author);
  console.log('cuisineId:', recipe.cuisineId);
  console.log('locationId:', recipe.locationId);
  console.log('cuisine:', recipe.cuisine?.name);
  console.log('location:', recipe.location?.name);
  console.log('coverImage:', recipe.coverImage ? '有' : '无');

  console.log('\n=== Summary 原始数据 ===');
  console.log(JSON.stringify(recipe.summary, null, 2));

  console.log('\n=== Steps 原始数据(前2个) ===');
  const steps = recipe.steps as any[];
  if (steps && steps.length > 0) {
    for (let i = 0; i < Math.min(2, steps.length); i++) {
      const s = steps[i];
      console.log('步骤' + (i+1) + ':', JSON.stringify({
        id: s.id,
        title: s.title,
        speechText: s.speechText,
        visualCue: s.visualCue,
        imageUrl: s.imageUrl,
      }, null, 2));
    }
  }

  // 2. 查看图片生成任务详情
  console.log('\n=== 图片生成任务详情 ===');
  const task = await prisma.imageGenTask.findFirst({
    where: { recipeId: recipe.id },
  });

  if (task) {
    console.log('任务ID:', task.id);
    console.log('状态:', task.status);
    console.log('\nsteps 字段(任务输入):');
    console.log(JSON.stringify(task.steps, null, 2));
    console.log('\nimages 字段(步骤图结果):');
    console.log(JSON.stringify(task.images, null, 2));
    console.log('\nshotImages 字段(成品图结果):');
    console.log(JSON.stringify(task.shotImages, null, 2));
  } else {
    console.log('无图片任务');
  }
}

main().catch(e => console.error(e));
