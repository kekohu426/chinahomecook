import { prisma } from './lib/db/prisma';

async function syncRecipeImages() {
  const recipeId = 'cmkxiwiyf0006douoxr7epnrk';

  // 获取图片任务
  const task = await prisma.imageGenTask.findFirst({
    where: { recipeId },
    include: { recipe: true },
  });

  if (!task || !task.recipe) {
    console.log('未找到任务或菜谱');
    return;
  }

  console.log('=== 同步前 ===');
  const stepsBefore = task.recipe.steps as any[];
  console.log('步骤1 imageUrl:', stepsBefore[0]?.imageUrl || '无');

  // 获取生成的图片
  const stepImages = (task.images as any[]) || [];
  console.log('\n生成的图片:');
  stepImages.forEach(img => {
    console.log(`  步骤${img.stepNumber}: ${img.imageUrl ? '有' : '无'}`);
  });

  // 同步图片到步骤
  const recipeSteps = task.recipe.steps as any[];
  const updatedSteps = recipeSteps.map((step, index) => {
    let stepNumber = step.number;
    if (stepNumber === undefined) {
      if (step.id) {
        const match = step.id.match(/\d+/);
        if (match) {
          stepNumber = parseInt(match[0], 10);
        }
      }
      if (stepNumber === undefined) {
        stepNumber = index + 1;
      }
    }

    const img = stepImages.find((i: any) => i.stepNumber === stepNumber);
    if (img?.imageUrl) {
      return { ...step, image: img.imageUrl, imageUrl: img.imageUrl };
    }
    return step;
  });

  // 更新数据库
  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      steps: updatedSteps,
      coverImage: task.coverImageUrl || task.recipe.coverImage,
    },
  });

  console.log('\n=== 同步后 ===');
  updatedSteps.forEach((step, i) => {
    console.log(`步骤${i+1} imageUrl: ${step.imageUrl ? '✅ 有' : '❌ 无'}`);
  });
  console.log('\n同步完成!');
}

syncRecipeImages().catch(e => console.error(e));
