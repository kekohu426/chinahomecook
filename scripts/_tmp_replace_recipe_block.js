const fs = require('fs');

const system = fs.readFileSync('scripts/_tmp_recipe_system.txt', 'utf8').trimEnd();
const user = fs.readFileSync('scripts/_tmp_recipe_user.txt', 'utf8').trimEnd();

const escape = (s) => s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const sysEsc = escape(system);
const userEsc = escape(user);

const newBlock = `  {
    key: "recipe_generate",
    name: "菜谱生成",
    description: "根据菜名生成完整的菜谱JSON数据",
    category: "generate",
    systemPrompt: \`${sysEsc}\`,
    prompt: \`${userEsc}\`,
    variables: ["dishName", "servings", "timeBudget", "equipment", "dietary", "cuisine", "cuisineGuide"],
  },
`;

function replaceBlock() {
  const path = 'lib/ai/default-prompts.ts';
  let content = fs.readFileSync(path, 'utf8');

  const startMarker = '  {\n    key: "recipe_generate"';
  const endMarker = '  {\n    key: "seo_generate"';

  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) throw new Error('recipe_generate block start not found');

  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error('seo_generate block start not found');

  content = content.slice(0, startIdx) + newBlock + content.slice(endIdx);
  fs.writeFileSync(path, content, 'utf8');
}

function updateSeed() {
  const path = 'scripts/seed-recipe-prompt.mjs';
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(
    /const SYSTEM_PROMPT = `[\s\S]*?`;/,
    `const SYSTEM_PROMPT = \`${sysEsc}\`;
`
  );

  content = content.replace(
    /const USER_PROMPT = `[\s\S]*?`;/,
    `const USER_PROMPT = \`${userEsc}\`;
`
  );

  fs.writeFileSync(path, content, 'utf8');
}

replaceBlock();
updateSeed();
