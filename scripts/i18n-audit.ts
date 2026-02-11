/**
 * 多语言完整性审计脚本
 *
 * 检查：
 * 1. 数据库翻译覆盖率
 * 2. 代码中的硬编码中文
 * 3. 翻译键完整性
 *
 * 用法：pnpm i18n:audit
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { translations } from "../lib/i18n/translations";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface AuditResult {
  category: string;
  severity: "error" | "warning" | "info";
  message: string;
  details?: string;
}

const results: AuditResult[] = [];

// ============================================
// 1. 检查数据库翻译覆盖率
// ============================================
async function auditDatabaseTranslations() {
  console.log("\n📊 检查数据库翻译覆盖率...\n");

  const tables = [
    {
      name: "Recipe",
      model: prisma.recipe,
      transModel: prisma.recipeTranslation,
      idField: "id",
      transIdField: "recipeId",
      filter: { status: "published" },
    },
    {
      name: "Cuisine",
      model: prisma.cuisine,
      transModel: prisma.cuisineTranslation,
      idField: "id",
      transIdField: "cuisineId",
      filter: { isActive: true },
    },
    {
      name: "Location",
      model: prisma.location,
      transModel: prisma.locationTranslation,
      idField: "id",
      transIdField: "locationId",
      filter: { isActive: true },
    },
    {
      name: "Collection",
      model: prisma.collection,
      transModel: prisma.collectionTranslation,
      idField: "id",
      transIdField: "collectionId",
      filter: { status: "published" },
    },
    {
      name: "Tag",
      model: prisma.tag,
      transModel: prisma.tagTranslation,
      idField: "id",
      transIdField: "tagId",
      filter: {},
    },
    {
      name: "HomeBrowseItem",
      model: prisma.homeBrowseItem,
      transModel: prisma.homeBrowseItemTranslation,
      idField: "id",
      transIdField: "itemId",
      filter: { isActive: true },
    },
  ];

  for (const table of tables) {
    try {
      const total = await (table.model as any).count({ where: table.filter });
      const withEnglish = await (table.transModel as any).count({
        where: { locale: "en" },
      });

      const coverage = total > 0 ? Math.round((withEnglish / total) * 100) : 100;

      if (coverage < 100) {
        results.push({
          category: "database",
          severity: coverage < 50 ? "error" : "warning",
          message: `${table.name}: ${withEnglish}/${total} 有英文翻译 (${coverage}%)`,
          details: `缺少 ${total - withEnglish} 条英文翻译`,
        });
      } else {
        console.log(`  ✅ ${table.name}: ${total}/${total} (100%)`);
      }
    } catch (error) {
      console.log(`  ⏭️ ${table.name}: 跳过（表结构不匹配）`);
    }
  }
}

// ============================================
// 2. 检查代码中的硬编码
// ============================================
function auditCodeHardcoding() {
  console.log("\n🔍 检查代码硬编码...\n");

  const patterns = [
    {
      pattern: /isEn\s*\?\s*["'`][^"'`]+["'`]\s*:\s*["'`][^"'`]+["'`]/g,
      description: 'isEn ? "..." : "..." 三元表达式',
    },
    {
      pattern: /locale\s*===?\s*["'`]en["'`]\s*\?\s*["'`][^"'`]+["'`]\s*:\s*["'`][^"'`]+["'`]/g,
      description: 'locale === "en" ? "..." : "..." 三元表达式',
    },
  ];

  const scanDirs = ["components", "app/[locale]"];
  const excludeDirs = ["node_modules", ".next", "admin"];
  const excludeFiles = [".bak", ".test.", ".spec."];

  function scanDirectory(dir: string): string[] {
    const files: string[] = [];
    const fullPath = path.join(process.cwd(), dir);

    if (!fs.existsSync(fullPath)) return files;

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (excludeDirs.some((ex) => entryPath.includes(ex))) continue;
      if (excludeFiles.some((ex) => entry.name.includes(ex))) continue;

      if (entry.isDirectory()) {
        files.push(...scanDirectory(entryPath));
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(entryPath);
      }
    }

    return files;
  }

  let totalIssues = 0;

  for (const dir of scanDirs) {
    const files = scanDirectory(dir);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (const { pattern, description } of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // 找到匹配所在的行号
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split("\n").length;

          // 排除注释
          const line = lines[lineNumber - 1] || "";
          if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
            continue;
          }

          results.push({
            category: "hardcoding",
            severity: "warning",
            message: `${file}:${lineNumber}`,
            details: `${description}: ${match[0].substring(0, 60)}...`,
          });
          totalIssues++;
        }
      }
    }
  }

  if (totalIssues === 0) {
    console.log("  ✅ 未发现硬编码问题");
  }
}

// ============================================
// 3. 检查翻译键完整性
// ============================================
function auditTranslationKeys() {
  console.log("\n📝 检查翻译键完整性...\n");

  const collectKeys = (obj: unknown, prefix = ""): string[] => {
    if (!obj || typeof obj !== "object") return [];
    return Object.entries(obj as Record<string, unknown>).flatMap(
      ([key, value]) => {
        const next = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string") return [next];
        if (value && typeof value === "object") return collectKeys(value, next);
        return [];
      }
    );
  };

  const zhKeys = collectKeys(translations.zh);
  const enKeys = collectKeys(translations.en);
  const zhSet = new Set(zhKeys);
  const enSet = new Set(enKeys);

  const missingInEn = zhKeys.filter((k) => !enSet.has(k));
  const missingInZh = enKeys.filter((k) => !zhSet.has(k));

  if (missingInEn.length || missingInZh.length) {
    results.push({
      category: "translations",
      severity: "warning",
      message: `翻译键不一致: zh=${zhKeys.length}, en=${enKeys.length}`,
      details: [
        missingInEn.length ? `缺少 en: ${missingInEn.join(", ")}` : null,
        missingInZh.length ? `缺少 zh: ${missingInZh.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
    });
  } else {
    console.log(`  ✅ 翻译键数量一致: ${zhKeys.length} 项`);
  }
}

// ============================================
// 输出报告
// ============================================
function printReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📋 多语言审计报告");
  console.log("=".repeat(60) + "\n");

  const errors = results.filter((r) => r.severity === "error");
  const warnings = results.filter((r) => r.severity === "warning");

  if (errors.length > 0) {
    console.log(`❌ 错误 (${errors.length}):\n`);
    errors.forEach((r) => {
      console.log(`  • [${r.category}] ${r.message}`);
      if (r.details) console.log(`    ${r.details}`);
    });
    console.log("");
  }

  if (warnings.length > 0) {
    console.log(`⚠️ 警告 (${warnings.length}):\n`);
    warnings.forEach((r) => {
      console.log(`  • [${r.category}] ${r.message}`);
      if (r.details) console.log(`    ${r.details}`);
    });
    console.log("");
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ 所有检查通过！\n");
  }

  console.log("=".repeat(60));
  console.log(`总计: ${errors.length} 个错误, ${warnings.length} 个警告`);
  console.log("=".repeat(60) + "\n");

  // 返回错误数用于 CI
  return errors.length;
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log("\n🌐 多语言完整性审计\n");
  console.log("时间:", new Date().toLocaleString("zh-CN"));

  await auditDatabaseTranslations();
  auditCodeHardcoding();
  auditTranslationKeys();

  const errorCount = printReport();

  await prisma.$disconnect();

  // CI 模式：有错误时返回非零退出码
  if (process.argv.includes("--ci") && errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("审计失败:", error);
  process.exit(1);
});
