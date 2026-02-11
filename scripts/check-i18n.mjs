import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

async function checkPage() {
  await mkdir('screenshots', { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('=== 检查英文首页 (端口 3005) ===\n');

  await page.goto('http://localhost:3005/en/', { waitUntil: 'networkidle', timeout: 60000 });

  // 截图
  await page.screenshot({ path: 'screenshots/en-homepage.png', fullPage: true });
  console.log('截图已保存: screenshots/en-homepage.png\n');

  // 获取页面所有文本
  const allText = await page.evaluate(() => {
    return document.body.innerText;
  });

  // 检查中文字符
  const chineseMatches = allText.match(/[\u4e00-\u9fa5]+/g) || [];
  const uniqueChinese = [...new Set(chineseMatches)];

  console.log('=== 页面文本分析 ===\n');

  if (uniqueChinese.length > 0) {
    console.log(`⚠️ 发现 ${uniqueChinese.length} 处中文内容:\n`);
    uniqueChinese.forEach((text, i) => {
      console.log(`  ${i+1}. "${text}"`);
    });
  } else {
    console.log('✅ 未发现中文内容');
  }

  // 打印页面前 3000 字符
  console.log('\n=== 页面内容预览 (前3000字符) ===\n');
  console.log(allText.substring(0, 3000));

  await browser.close();
}

checkPage().catch(console.error);
