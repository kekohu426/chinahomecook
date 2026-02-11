const fs = require('fs');

const system = fs.readFileSync('scripts/_tmp_recipe_system.txt', 'utf8').trimEnd();
const user = fs.readFileSync('scripts/_tmp_recipe_user.txt', 'utf8').trimEnd();

const escape = (s) => s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const sysEsc = escape(system);
const userEsc = escape(user);

function updateDefault() {
  const path = 'lib/ai/default-prompts.ts';
  let content = fs.readFileSync(path, 'utf8');

  const marker = 'key: "recipe_generate"';
  const idx = content.indexOf(marker);
  if (idx === -1) throw new Error('recipe_generate not found');

  const sysIdx = content.indexOf('systemPrompt:', idx);
  if (sysIdx === -1) throw new Error('systemPrompt not found');

  const sysStart = content.indexOf('`', sysIdx);
  const promptIdx = content.indexOf('\n    prompt:', sysStart);
  if (promptIdx === -1) throw new Error('prompt not found');

  const sysEnd = content.lastIndexOf('`', promptIdx);
  if (sysEnd <= sysStart) throw new Error('systemPrompt end not found');

  const promptStart = content.indexOf('`', promptIdx);
  const varsIdx = content.indexOf('\n    variables:', promptStart);
  if (varsIdx === -1) throw new Error('variables not found');

  const promptEnd = content.lastIndexOf('`', varsIdx);
  if (promptEnd <= promptStart) throw new Error('prompt end not found');

  content = content.slice(0, sysStart + 1) + sysEsc + content.slice(sysEnd);
  content = content.slice(0, promptStart + 1) + userEsc + content.slice(promptEnd);

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

updateDefault();
updateSeed();
