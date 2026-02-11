import { prisma } from './lib/db/prisma';

async function main() {
  const recipe = await prisma.recipe.findFirst({
    where: { slug: { contains: '宫爆鸡丁' } },
    include: {
      explorer: { select: { nameZh: true } },
      reviewer: { select: { nameZh: true } },
      cuisine: { select: { name: true } },
      location: { select: { name: true } },
      tags: { include: { tag: { select: { name: true, type: true } } } }
    }
  });
  if (recipe) {
    console.log('=== 宫爆鸡丁食谱详情 ===');
    console.log('ID:', recipe.id);
    console.log('标题:', recipe.title);
    console.log('状态:', recipe.status);
    console.log('难度:', recipe.difficulty || '❌ 缺失');
    console.log('准备时间:', recipe.prepTime || '❌ 缺失');
    console.log('烹饪时间:', recipe.cookTime || '❌ 缺失');
    console.log('份量:', recipe.servings || '❌ 缺失');
    console.log('描述:', recipe.description ? '✓ 有' : '❌ 缺失');
    console.log('封面图:', recipe.coverImage ? '✓ 有' : '❌ 缺失');
    console.log('摘要:', recipe.summary ? '✓ 有' : '❌ 缺失');
    console.log('故事:', recipe.story ? '✓ 有' : '❌ 缺失');
    console.log('营养信息:', recipe.nutrition ? '✓ 有' : '❌ 缺失');
    console.log('SEO:', recipe.seo ? '✓ 有' : '❌ 缺失');
    console.log('菜系:', recipe.cuisine?.name || '❌ 缺失');
    console.log('地区:', recipe.location?.name || '❌ 缺失');
    console.log('探索者(作者):', recipe.explorer?.nameZh || '❌ 未分配');
    console.log('审核者:', recipe.reviewer?.nameZh || '❌ 未分配');
    console.log('标签:', recipe.tags.length > 0 ? recipe.tags.map(t => t.tag.name).join(', ') : '❌ 缺失');
  } else {
    console.log('未找到宫爆鸡丁食谱');
  }
}
main();
