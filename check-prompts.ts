import { prisma } from './lib/db/prisma';

async function main() {
  const task = await prisma.imageGenTask.findFirst({
    where: { recipeId: 'cmkxiwiyf0006douoxr7epnrk' },
  });

  if (!task) {
    console.log('未找到任务');
    return;
  }

  console.log('=== 步骤图提示词 ===');
  const prompts = task.prompts as any;
  if (prompts?.steps) {
    prompts.steps.forEach((p: any) => {
      console.log('步骤' + p.stepNumber + ':');
      console.log('  prompt:', p.prompt);
      console.log('');
    });
  } else if (Array.isArray(prompts)) {
    prompts.forEach((p: any) => {
      console.log('步骤' + p.stepNumber + ':');
      console.log('  prompt:', p.prompt);
      console.log('');
    });
  } else {
    console.log('prompts结构:', JSON.stringify(prompts, null, 2));
  }

  console.log('\n=== 成品图提示词 ===');
  const shotPrompts = task.shotPrompts as any[];
  if (shotPrompts) {
    shotPrompts.forEach((p: any) => {
      console.log(p.key + ':');
      console.log('  ' + p.imagePrompt);
      console.log('');
    });
  }
}
main();
