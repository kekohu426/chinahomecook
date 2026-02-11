const fs = require('fs');
const path = 'lib/ai/default-prompts.ts';
let content = fs.readFileSync(path, 'utf8');
// Fix escaped backticks and BOM characters
content = content.replace(/\\`/g, '`').replace(/\uFEFF/g, '');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed escaped backticks and BOM characters');
