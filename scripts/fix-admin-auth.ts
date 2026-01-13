/**
 * 批量修复 admin 路由鉴权
 */

import * as fs from "fs";
import * as path from "path";

const ROUTES_TO_FIX = [
  "app/api/admin/blog/[id]/generate-content/route.ts",
  "app/api/admin/blog/[id]/generate-outline/route.ts",
  "app/api/admin/blog/[id]/publish/route.ts",
  "app/api/admin/blog/[id]/route.ts",
  "app/api/admin/blog/[id]/translate/route.ts",
  "app/api/admin/blog/[id]/translation/route.ts",
  "app/api/admin/config/about/translate/route.ts",
  "app/api/admin/config/cuisines/[id]/translate/route.ts",
  "app/api/admin/config/home/browse/[id]/translate/route.ts",
  "app/api/admin/config/home/testimonials/[id]/translate/route.ts",
  "app/api/admin/config/home/translate/route.ts",
  "app/api/admin/config/locations/[id]/translate/route.ts",
  "app/api/admin/recipes/[id]/translate/route.ts",
  "app/api/admin/recipes/batch/route.ts",
  "app/api/admin/recipes/batch/translate-stream/route.ts",
  "app/api/admin/translations/batch/route.ts",
  "app/api/admin/translations/route.ts",
];

const BASE_DIR = path.join(__dirname, "..");

function addAuthToRoute(filePath: string): boolean {
  const fullPath = path.join(BASE_DIR, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, "utf-8");

  // 已有鉴权则跳过
  if (content.includes("requireAdmin") || content.includes("auth()")) {
    console.log(`⏭️  已有鉴权: ${filePath}`);
    return false;
  }

  // 添加 import
  const importLine = 'import { requireAdmin } from "@/lib/auth/guard";';

  // 找到最后一个 import 语句的位置
  const importRegex = /^import .+ from .+;$/gm;
  let lastImportEnd = 0;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    lastImportEnd = match.index + match[0].length;
  }

  if (lastImportEnd > 0) {
    content = content.slice(0, lastImportEnd) + "\n" + importLine + content.slice(lastImportEnd);
  }

  // 在每个 export async function 的 try { 之前添加鉴权
  const functionPatterns = [
    /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]*\)\s*\{(\s*)try\s*\{/g,
    /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]*\)\s*\{(\s*)(const|let|var)/g,
  ];

  for (const pattern of functionPatterns) {
    content = content.replace(pattern, (match, method, space, nextToken) => {
      const authCheck = `const authError = await requireAdmin();\n  if (authError) return authError;\n\n  `;
      if (match.includes("try {")) {
        return `export async function ${method}(request: NextRequest) {\n  ${authCheck}try {`;
      } else {
        return `export async function ${method}(request: NextRequest) {\n  ${authCheck}${nextToken || ""}`;
      }
    });
  }

  // 处理没有 try 块的简单函数
  content = content.replace(
    /export async function (GET|POST|PUT|PATCH|DELETE)\(([^)]*)\)\s*\{\n(\s*)((?!const authError))/g,
    (match, method, params, space, nextLine) => {
      return `export async function ${method}(${params}) {\n  const authError = await requireAdmin();\n  if (authError) return authError;\n\n${space}${nextLine}`;
    }
  );

  fs.writeFileSync(fullPath, content);
  console.log(`✅ 已修复: ${filePath}`);
  return true;
}

console.log("=== 批量修复 Admin 路由鉴权 ===\n");

let fixed = 0;
for (const route of ROUTES_TO_FIX) {
  if (addAuthToRoute(route)) {
    fixed++;
  }
}

console.log(`\n完成: 修复了 ${fixed} 个文件`);
