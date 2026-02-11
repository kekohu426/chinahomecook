const fs = require('fs');

const user = fs.readFileSync('scripts/_tmp_recipe_user.txt', 'utf8').trimEnd();
const escape = (s) => s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const userEsc = escape(user);

const path = 'lib/ai/default-prompts.ts';
let content = fs.readFileSync(path, 'utf8');

const marker = 'key: "recipe_generate"';
const startIdx = content.indexOf(marker);
if (startIdx === -1) throw new Error('recipe_generate not found');

const promptIdx = content.indexOf('prompt:', startIdx);
if (promptIdx === -1) throw new Error('prompt not found');

const promptStart = content.indexOf('`', promptIdx);
const variablesIdx = content.indexOf('variables:', promptStart);
if (variablesIdx === -1) throw new Error('variables not found');

const promptEnd = content.lastIndexOf('`', variablesIdx);
if (promptEnd <= promptStart) throw new Error('prompt end not found');

content = content.slice(0, promptStart + 1) + userEsc + content.slice(promptEnd);

const lineStart = content.lastIndexOf('\n', variablesIdx) + 1;
const lineEnd = content.indexOf('\n', variablesIdx);
const variablesLine = '    variables: ["dishName", "servings", "timeBudget", "equipment", "dietary", "cuisine", "cuisineGuide"],';
content = content.slice(0, lineStart) + variablesLine + content.slice(lineEnd);

fs.writeFileSync(path, content, 'utf8');
