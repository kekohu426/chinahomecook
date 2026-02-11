const fs = require('fs');

const system = fs.readFileSync('scripts/_tmp_recipe_system.txt', 'utf8').trimEnd();
const user = fs.readFileSync('scripts/_tmp_recipe_user.txt', 'utf8').trimEnd();
const escape = (s) => s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const sysEsc = escape(system);
const userEsc = escape(user);

const recipeBlock = `  {\n    key: \"recipe_generate\",\n    name: \"菜谱生成\",\n    description: \"根据菜名生成完整的菜谱JSON数据\",\n    category: \"generate\",\n    systemPrompt: \\\`${sysEsc}\\\`,\n    prompt: \\\`${userEsc}\\\`,\n    variables: [\"dishName\", \"servings\", \"timeBudget\", \"equipment\", \"dietary\", \"cuisine\", \"cuisineGuide\"],\n  },\n`;

const path = 'lib/ai/default-prompts.ts';
let content = fs.readFileSync(path, 'utf8');

const recipeStart = content.indexOf('  {\n    key: \"recipe_generate\"');
if (recipeStart === -1) throw new Error('recipe_generate block start not found');

const seoSystemMarker = 'systemPrompt: `你是 Recipe Zen 的专业 SEO 内容专家';
const seoSystemIdx = content.indexOf(seoSystemMarker);
if (seoSystemIdx === -1) throw new Error('seo systemPrompt not found');

const seoCategoryIdx = content.lastIndexOf('\n    category: "seo",', seoSystemIdx);
if (seoCategoryIdx === -1) throw new Error('seo category not found');

const nextBlockMarker = '\n  {\n    key: "recipe_page_copy"';
const seoEndIdx = content.indexOf(nextBlockMarker, seoSystemIdx);
if (seoEndIdx === -1) throw new Error('recipe_page_copy block start not found');

const seoBody = content.slice(seoCategoryIdx + 1, seoEndIdx); // starts with category line
const seoBlock = `  {\n    key: \"seo_generate\",\n    name: \"SEO内容生成\",\n    description: \"为聚合页生成完整的SEO内容\",\n` + seoBody;

content = content.slice(0, recipeStart) + recipeBlock + seoBlock + content.slice(seoEndIdx);
fs.writeFileSync(path, content, 'utf8');
