import { prisma } from '../lib/db/prisma';

async function main() {
  const tasks = await prisma.imageGenTask.findMany({
    select: { id: true, prompts: true, recipeId: true },
    take: 5
  });
  
  for (const t of tasks) {
    console.log('Task ID:', t.id);
    console.log('Recipe ID:', t.recipeId);
    console.log('Prompts type:', typeof t.prompts);
    console.log('Is array:', Array.isArray(t.prompts));
    if (t.prompts && typeof t.prompts === 'object') {
      console.log('Keys:', Object.keys(t.prompts as object));
    }
    console.log('---');
  }
}

main().finally(() => prisma.$disconnect());
