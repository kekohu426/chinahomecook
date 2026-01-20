/**
 * AI生成菜谱服务
 *
 * 使用GLM生成符合PRD Schema v2.0.0的完整菜谱JSON
 */

import { getTextProvider } from "./provider";
import { safeValidateRecipe } from "../validators/recipe";
import type { Recipe } from "@/types/recipe";
import { prisma } from "@/lib/db/prisma";
import { getAppliedPrompt } from "./prompt-manager";
import { evolinkClient } from "./evolink";
import { uploadImage, generateSafeFilename } from "@/lib/utils/storage";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

async function saveGeneratedImage(buffer: Buffer, prefix: string): Promise<string> {
  if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
    const filePath = generateSafeFilename("image.png", prefix);
    return uploadImage(buffer, filePath);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", prefix);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  const filename = generateSafeFilename("image.png");
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return `/uploads/${prefix}/${filename}`;
}
import { getCuisineGuide } from "./cuisine-guides";

/**
 * 从数据库获取 AI 配置
 */
async function getAIConfig() {
  try {
    const config = await prisma.aIConfig.findUnique({
      where: { id: "default" },
    });
    return config;
  } catch (error) {
    console.error("获取 AI 配置失败:", error);
    return null;
  }
}

/**
 * 生成菜谱的提示词模板 - Schema v2.0.0
 * 优先从数据库读取，如果为空则使用默认值
 */
async function buildRecipePrompt(
  params: {
    dishName: string;
    servings?: number;
    timeBudget?: number;
    equipment?: string;
    dietary?: string;
    cuisine?: string;
  }
): Promise<{ prompt: string; systemPrompt: string | null }> {
  const {
    dishName,
    servings = 2,
    timeBudget = 30,
    equipment = "家用厨房常见设备",
    dietary = "无特殊限制",
    cuisine,
  } = params;

  // 获取菜系差异化指导
  const cuisineGuide = cuisine ? getCuisineGuide(cuisine) : "";

  const applied = await getAppliedPrompt("recipe_generate", {
    dishName,
    servings: String(servings),
    timeBudget: String(timeBudget),
    equipment,
    dietary,
    cuisine: cuisine || "家常菜",
    cuisineGuide,
  });

  if (!applied?.prompt) {
    throw new Error("未找到可用的提示词配置");
  }

  return {
    prompt: applied.prompt,
    systemPrompt: applied.systemPrompt,
  };
}

/**
 * 清理AI返回的JSON字符串
 */
function normalizeJsonPunctuation(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        output += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
        output += char;
        continue;
      }

      output += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === '：') {
      output += ':';
      continue;
    }

    if (char === '，') {
      output += ',';
      continue;
    }

    if (char === '＝') {
      output += ':';
      continue;
    }

    output += char;
  }

  return output;
}

function escapeNewlinesInStrings(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        output += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
        output += char;
        continue;
      }

      if (char === "\n" || char === "\r") {
        output += "\\n";
        continue;
      }

      output += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    output += char;
  }

  return output;
}

function fixDoubleQuotedValueArtifacts(input: string): string {
  return input.replace(/:\s*""([^"]+)""/g, ': "$1"');
}

function fixMissingCommasInObjects(input: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  const stack: Array<{ type: "object" | "array"; expectingKey: boolean }> = [];

  const top = () => stack[stack.length - 1];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      const ctx = top();
      if (ctx?.type === "object") {
        // 向前查找，看看前面是否是一个完整的值（字符串、数字、布尔、null、对象、数组）
        let lookback = output.length - 1;
        while (lookback >= 0 && /\s/.test(output[lookback])) {
          lookback--;
        }

        // 检查前面的字符
        const prevChar = lookback >= 0 ? output[lookback] : '';
        const needsComma = prevChar === '"' || prevChar === '}' || prevChar === ']' ||
                          /[0-9]/.test(prevChar) ||
                          (lookback >= 3 && output.substring(lookback - 3, lookback + 1) === 'true') ||
                          (lookback >= 4 && output.substring(lookback - 4, lookback + 1) === 'false') ||
                          (lookback >= 3 && output.substring(lookback - 3, lookback + 1) === 'null');

        // 向前查找下一个引号，看看是否是 key
        let j = i + 1;
        let innerEscaped = false;
        for (; j < input.length; j++) {
          const c = input[j];
          if (innerEscaped) {
            innerEscaped = false;
            continue;
          }
          if (c === "\\") {
            innerEscaped = true;
            continue;
          }
          if (c === '"') break;
        }
        let k = j + 1;
        while (k < input.length && /\s/.test(input[k])) k++;
        const isKey = input[k] === ":";

        // 如果前面有值，且当前是 key，且前面没有逗号，则添加逗号
        if (isKey && needsComma && prevChar !== ',' && prevChar !== '{') {
          output = output.replace(/\s*$/, "");
          output += ",";
          ctx.expectingKey = true;
        }
      }

      inString = true;
      output += char;
      continue;
    }

    if (char === "{") {
      stack.push({ type: "object", expectingKey: true });
      output += char;
      continue;
    }

    if (char === "[") {
      stack.push({ type: "array", expectingKey: false });
      output += char;
      continue;
    }

    if (char === "}") {
      stack.pop();
      output += char;
      continue;
    }

    if (char === "]") {
      stack.pop();
      output += char;
      continue;
    }

    if (char === ":") {
      const ctx = top();
      if (ctx?.type === "object") {
        ctx.expectingKey = false;
      }
      output += char;
      continue;
    }

    if (char === ",") {
      const ctx = top();
      if (ctx?.type === "object") {
        ctx.expectingKey = true;
      }
      output += char;
      continue;
    }

    output += char;
  }

  return output;
}

function fixUnquotedKeys(input: string): string {
  return input.replace(
    /(^|[{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g,
    (_match, prefix, key, suffix) => `${prefix}"${key}"${suffix}`
  );
}

function fixSingleQuotedStrings(input: string): string {
  return input.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, value) => {
    const escaped = String(value).replace(/"/g, '\\"');
    return `"${escaped}"`;
  });
}

export function cleanAIResponse(response: string): string {
  // 移除markdown代码块标记
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  // 移除JSON前后可能的多余文字
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  // 移除可能的注释（// 或 /* */）
  cleaned = cleaned.replace(/\/\/.*$/gm, '');  // 单行注释
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // 多行注释

  // 修复全角标点导致的JSON结构错误
  cleaned = normalizeJsonPunctuation(cleaned);

  // 修复字符串内未转义的换行
  cleaned = escapeNewlinesInStrings(cleaned);

  // 修复单引号字符串
  cleaned = fixSingleQuotedStrings(cleaned);

  // 修复未加引号的 key
  cleaned = fixUnquotedKeys(cleaned);

  // 修复双引号包裹的值被重复引号包裹
  cleaned = fixDoubleQuotedValueArtifacts(cleaned);

  // 修复对象属性之间缺少逗号（增强版）
  cleaned = fixMissingCommasInObjects(cleaned);

  // 移除trailing commas（JSON不允许）
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // 修复常见的数学表达式（AI经常生成 1/2, 1/3 等）
  cleaned = cleaned.replace(/"amount":\s*1\/2/g, '"amount": 0.5');
  cleaned = cleaned.replace(/"amount":\s*1\/3/g, '"amount": 0.33');
  cleaned = cleaned.replace(/"amount":\s*2\/3/g, '"amount": 0.67');
  cleaned = cleaned.replace(/"amount":\s*1\/4/g, '"amount": 0.25');
  cleaned = cleaned.replace(/"amount":\s*3\/4/g, '"amount": 0.75');
  cleaned = cleaned.replace(/"amount":\s*(\d+)\/(\d+)/g, (match, num, denom) => {
    return `"amount": ${parseFloat(num) / parseFloat(denom)}`;
  });

  // 修复未加引号的字符串字段
  cleaned = cleaned.replace(
    /"(amount|unit|notes)"\s*:\s*([^\d"{}\[\]-][^,\n}]*)/g,
    (match, key, rawValue) => {
      const value = String(rawValue).trim();
      if (value === "null") {
        return `"${key}": null`;
      }
      return `"${key}": "${value.replace(/"/g, '\\"')}"`;
    }
  );

  // 修复多余的逗号（连续逗号）
  cleaned = cleaned.replace(/,\s*,+/g, ',');

  // 修复对象开头的逗号
  cleaned = cleaned.replace(/\{\s*,/g, '{');

  // 修复数组开头的逗号
  cleaned = cleaned.replace(/\[\s*,/g, '[');

  return cleaned.trim();
}

function extractFirstJsonObject(input: string): string | null {
  const start = input.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const char = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return input.substring(start, i + 1);
      }
    }
  }

  return null;
}

function unwrapRecipePayload(input: any): any {
  if (!input || typeof input !== "object") return input;

  if (Array.isArray(input)) {
    const firstObject = input.find((item) => item && typeof item === "object");
    return firstObject || input[0];
  }

  const candidates = ["recipe", "data", "result", "output", "payload"];
  for (const key of candidates) {
    const value = (input as Record<string, any>)[key];
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        const firstObject = value.find((item) => item && typeof item === "object");
        return firstObject || value[0];
      }
      if (value.recipe && typeof value.recipe === "object") {
        return value.recipe;
      }
      return value;
    }
  }

  return input;
}

/**
 * 标准化AI生成的数据
 */
export function normalizeRecipeData(data: any): any {
  if (!data) return data;

  const parseNumber = (value: any) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const num = parseFloat(value.replace(/[^\d.]/g, ""));
      return Number.isFinite(num) ? num : undefined;
    }
    return undefined;
  };

  const mapDifficulty = (value: any) => {
    if (!value) return undefined;
    const raw = String(value).toLowerCase().trim();
    if (["easy", "simple", "beginner", "简单", "易"].some((k) => raw.includes(k))) {
      return "easy";
    }
    if (["hard", "difficult", "复杂", "难"].some((k) => raw.includes(k))) {
      return "hard";
    }
    if (["medium", "moderate", "中等"].some((k) => raw.includes(k))) {
      return "medium";
    }
    return undefined;
  };

  const normalizeIngredientItem = (item: any) => {
    if (typeof item === "string") {
      const raw = item.trim();
      if (!raw) return null;
      let name = raw;
      let amount = 1;
      let unit = "份";
      const amountMatch = raw.match(/(\d+(?:\.\d+)?)(\s*[a-zA-Z\u4e00-\u9fa5]+)?$/);
      if (amountMatch?.index != null) {
        const parsedAmount = parseNumber(amountMatch[1]);
        if (parsedAmount) {
          amount = parsedAmount;
          unit = (amountMatch[2] || unit).trim() || unit;
          name = raw.slice(0, amountMatch.index).replace(/[：:]/g, "").trim() || raw;
        }
      }
      return { name, amount, unit };
    }
    if (item && typeof item === "object") {
      const name = item.name || item.ingredient || item.title || item.label;
      if (!name) return null;
      const amount = parseNumber(item.amount ?? item.qty ?? item.quantity) ?? 1;
      const unit = (item.unit ?? item.uom ?? "份") as string;
      return {
        name,
        amount,
        unit: String(unit).trim() || "份",
        iconKey: item.iconKey,
        prep: item.prep,
        optional: item.optional,
        substitutes: item.substitutes,
        allergens: item.allergens,
        notes: item.notes,
      };
    }
    return null;
  };

  const normalizeIngredientSection = (sectionName: string, items: any) => {
    const normalizedItems = (Array.isArray(items) ? items : [items])
      .map(normalizeIngredientItem)
      .filter(Boolean) as any[];
    if (normalizedItems.length === 0) return null;
    return { section: sectionName || "主料", items: normalizedItems };
  };

  if (!data.story && typeof data.culturalStory === "string") {
    data.story = data.culturalStory;
  }

  data.titleZh =
    data.titleZh ||
    data.title ||
    data.name ||
    data.recipeName ||
    data.dishName;

  if (!data.summary || typeof data.summary === "string") {
    const oneLine =
      typeof data.summary === "string"
        ? data.summary
        : data.oneLine || data.description || "";
    data.summary = {
      oneLine,
      healingTone: data.healingTone || "",
      difficulty:
        mapDifficulty(data.difficulty ?? data.difficultyLevel ?? data.summary?.difficulty) ||
        "easy",
      timeTotalMin:
        parseNumber(data.timeTotalMin ?? data.totalTimeMin ?? data.totalTime ?? data.timeBudget) ||
        30,
      timeActiveMin:
        parseNumber(data.timeActiveMin ?? data.activeTimeMin ?? data.cookTime ?? data.activeTime) ||
        15,
      servings: parseNumber(data.servings ?? data.yield ?? data.portions) || 2,
    };
  } else {
    data.summary.difficulty =
      mapDifficulty(data.summary.difficulty ?? data.difficulty ?? data.difficultyLevel) ||
      data.summary.difficulty;
    data.summary.timeTotalMin =
      data.summary.timeTotalMin ??
      parseNumber(data.timeTotalMin ?? data.totalTimeMin ?? data.totalTime ?? data.timeBudget);
    data.summary.timeActiveMin =
      data.summary.timeActiveMin ??
      parseNumber(data.timeActiveMin ?? data.activeTimeMin ?? data.cookTime ?? data.activeTime);
    data.summary.servings =
      data.summary.servings ??
      parseNumber(data.servings ?? data.yield ?? data.portions);
  }

  if (!data.ingredients && (data.ingredientList || data.ingredientsList)) {
    data.ingredients = data.ingredientList || data.ingredientsList;
  }

  if (data.ingredients && !Array.isArray(data.ingredients) && typeof data.ingredients === "object") {
    const sections = Object.entries(data.ingredients)
      .map(([sectionName, items]) => normalizeIngredientSection(sectionName, items))
      .filter(Boolean) as any[];
    if (sections.length > 0) {
      data.ingredients = sections;
    }
  }

  if (Array.isArray(data.ingredients)) {
    const items = data.ingredients
      .map((item: any) => normalizeIngredientItem(item))
      .filter(Boolean) as any[];
    if (items.length > 0 && items.every((item) => item.name)) {
      data.ingredients = [{ section: "主料", items }];
    }
  }

  if (!data.steps && (data.instructions || data.directions || data.method)) {
    data.steps = data.instructions || data.directions || data.method;
  }

  const parseMaybeJson = (value: any) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return value;
      }
    }
    return value;
  };

  const splitToArray = (value: string) =>
    value
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  if (typeof data.ingredients === "string") {
    data.ingredients = splitToArray(data.ingredients);
  }

  if (typeof data.steps === "string") {
    data.steps = splitToArray(data.steps);
  }

  const normalizeArrayField = (value: any, mode: "text" | "json" = "text") => {
    if (Array.isArray(value)) return value;
    if (value == null) return value;
    if (typeof value === "string") {
      const parsed = parseMaybeJson(value);
      if (Array.isArray(parsed)) return parsed;
      if (mode === "text") {
        return splitToArray(value);
      }
    }
    return mode === "text" ? [String(value)] : value;
  };

  data.aliases = normalizeArrayField(data.aliases);
  data.ingredients = normalizeArrayField(data.ingredients, "json");
  data.steps = normalizeArrayField(data.steps, "json");
  data.imageShots = normalizeArrayField(data.imageShots, "json");
  data.faq = normalizeArrayField(data.faq, "json");
  data.tips = normalizeArrayField(data.tips);
  data.troubleshooting = normalizeArrayField(data.troubleshooting, "json");
  data.notes = normalizeArrayField(data.notes);
  data.equipment = normalizeArrayField(data.equipment, "json");

  // 修复 troubleshooting 字段名（确保包含 problem, cause, fix）
  if (Array.isArray(data.troubleshooting)) {
    data.troubleshooting = data.troubleshooting.map((item: any) => {
      if (item && typeof item === 'object') {
        return {
          problem: item.problem || item.issue || '',
          cause: item.cause || item.reason || '',
          fix: item.fix || item.solution || ''
        };
      }
      return item;
    });
  }

  if (data.summary) {
    data.summary.flavorTags = normalizeArrayField(data.summary.flavorTags);
  }

  const normalizeImageRatio = (value: any, key?: string) => {
    const fallbackByKey = (rawKey?: string) => {
      const k = (rawKey || "").toLowerCase();
      if (k.includes("step")) return "4:3";
      if (k.includes("ingredient") || k.includes("flat")) return "3:2";
      return "16:9";
    };

    if (!value) return fallbackByKey(key);

    const raw = String(value).trim().toLowerCase();
    if (!raw) return fallbackByKey(key);

    const cleaned = raw
      .replace(/：/g, ":")
      .replace(/[×x]/g, ":")
      .replace(/[\/\\-]/g, ":")
      .replace(/\s+/g, "");

    const directMap: Record<string, "16:9" | "4:3" | "3:2"> = {
      "16:9": "16:9",
      "4:3": "4:3",
      "3:2": "3:2",
      "9:16": "16:9",
      "1:1": "4:3",
      wide: "16:9",
      widescreen: "16:9",
      landscape: "16:9",
      horizontal: "16:9",
      portrait: "4:3",
      vertical: "4:3",
      square: "4:3",
    };

    if (directMap[cleaned]) return directMap[cleaned];

    if (cleaned.includes(":")) {
      const [w, h] = cleaned.split(":").map((part) => parseFloat(part));
      if (Number.isFinite(w) && Number.isFinite(h) && h !== 0) {
        const ratio = w / h;
        if (Math.abs(ratio - 16 / 9) < 0.15) return "16:9";
        if (Math.abs(ratio - 4 / 3) < 0.15) return "4:3";
        if (Math.abs(ratio - 3 / 2) < 0.15) return "3:2";
      }
    }

    const numeric = parseFloat(raw.replace(/[^\d.]/g, ""));
    if (Number.isFinite(numeric)) {
      if (Math.abs(numeric - 16 / 9) < 0.15) return "16:9";
      if (Math.abs(numeric - 4 / 3) < 0.15) return "4:3";
      if (Math.abs(numeric - 3 / 2) < 0.15) return "3:2";
    }

    return fallbackByKey(key);
  };

  if (Array.isArray(data.imageShots)) {
    data.imageShots = data.imageShots.map((shot: any) => {
      if (!shot || typeof shot !== "object") return shot;
      return {
        ...shot,
        ratio: normalizeImageRatio(shot.ratio, shot.key),
      };
    });
  }

  if (Array.isArray(data.relatedRecipes)) {
    data.relatedRecipes = { similar: data.relatedRecipes };
  }
  if (data.relatedRecipes) {
    data.relatedRecipes.similar = normalizeArrayField(data.relatedRecipes.similar);
    data.relatedRecipes.pairing = normalizeArrayField(data.relatedRecipes.pairing);
  }

  if (Array.isArray(data.pairing)) {
    data.pairing = { suggestions: data.pairing };
  }
  if (data.pairing) {
    data.pairing.suggestions = normalizeArrayField(data.pairing.suggestions);
    data.pairing.sauceOrSide = normalizeArrayField(data.pairing.sauceOrSide);
  }

  if (data.tags) {
    data.tags.scenes = normalizeArrayField(data.tags.scenes);
    data.tags.cookingMethods = normalizeArrayField(data.tags.cookingMethods);
    data.tags.tastes = normalizeArrayField(data.tags.tastes);
    data.tags.crowds = normalizeArrayField(data.tags.crowds);
    data.tags.occasions = normalizeArrayField(data.tags.occasions);
  }

  if (data.styleGuide) {
    data.styleGuide.palette = normalizeArrayField(data.styleGuide.palette);
    data.styleGuide.materials = normalizeArrayField(data.styleGuide.materials);
    data.styleGuide.props = normalizeArrayField(data.styleGuide.props);
    data.styleGuide.compositionRules = normalizeArrayField(
      data.styleGuide.compositionRules
    );
  }

  if (Array.isArray(data.equipment)) {
    data.equipment = data.equipment.map((item: any) =>
      typeof item === "string" ? { name: item, required: true } : item
    );
  }

  if (Array.isArray(data.steps)) {
    data.steps = data.steps.map((step: any, index: number) => {
      if (step && typeof step === "object" && !Array.isArray(step)) {
        const action =
          step.action ||
          step.content ||
          step.description ||
          step.text ||
          step.step ||
          step.instruction;
        return {
          id: step.id || `step${String(index + 1).padStart(2, "0")}`,
          title: step.title || (action ? String(action).slice(0, 12) : `步骤${index + 1}`),
          action: action || step.title || "继续烹饪",
          heat: step.heat,
          ...step,
        };
      }
      if (typeof step === "string") {
        return {
          id: `step${String(index + 1).padStart(2, "0")}`,
          title: step.slice(0, 12) || `步骤${index + 1}`,
          action: step,
          heat: "medium",
        };
      }
      return step;
    });
  }

  // 转换 summary 中的数字字段
  if (data.summary) {
    if (typeof data.summary.timeTotalMin === 'string') {
      data.summary.timeTotalMin = parseInt(data.summary.timeTotalMin, 10);
    }
    if (typeof data.summary.timeActiveMin === 'string') {
      data.summary.timeActiveMin = parseInt(data.summary.timeActiveMin, 10);
    }
    if (typeof data.summary.servings === 'string') {
      data.summary.servings = parseInt(data.summary.servings, 10);
    }
  }

  // 转换 ingredients 中的字段
  if (data.ingredients && Array.isArray(data.ingredients)) {
    const validIcons = [
      "meat", "veg", "fruit", "seafood", "grain", "bean",
      "dairy", "egg", "spice", "sauce", "oil", "tool", "other"
    ];

    data.ingredients.forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          // 修复 notes: null -> undefined
          if (item.notes === null) {
            item.notes = undefined;
          }

          // 修复 iconKey
          if (item.iconKey) {
            const key = item.iconKey.toLowerCase();
            if (!validIcons.includes(key)) {
              if (key.includes("vegetable")) item.iconKey = "veg";
              else if (key === "tool") item.iconKey = "other";
              else {
                console.warn(`Invalid iconKey: ${item.iconKey}, fallback to 'other'`);
                item.iconKey = "other";
              }
            }
          }

          // 修复 amount
          if (typeof item.amount === 'string') {
            const numeric = parseFloat(item.amount);
            if (Number.isNaN(numeric)) {
              const amountLabel = item.amount.trim();
              item.amount = 1;
              if (!item.unit || String(item.unit).trim().length === 0) {
                item.unit = amountLabel;
              }
            } else {
              item.amount = numeric;
            }
          }
        });
      }
    });
  }

  // 转换 steps 中的字段
  if (data.steps && Array.isArray(data.steps)) {
    data.steps.forEach((step: any) => {
      if (typeof step.timerSec === 'string') {
        step.timerSec = parseInt(step.timerSec, 10);
      }
      if (typeof step.timeMin === 'string') {
        step.timeMin = parseFloat(step.timeMin);
      }
      if (typeof step.timeMax === 'string') {
        step.timeMax = parseFloat(step.timeMax);
      }
      // 兼容 failPoint -> failurePoints
      if (step.failPoint && !step.failurePoints) {
        step.failurePoints = [step.failPoint];
      }
    });
  }

  // 转换 nutrition 中的数字
  if (data.nutrition?.perServing) {
    const ps = data.nutrition.perServing;
    ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sodium'].forEach(key => {
      if (typeof ps[key] === 'string') {
        ps[key] = parseFloat(ps[key]);
      }
    });
  }

  return data;
}

function ensureRecipeMinimums(data: any, fallbackTitle: string): any {
  if (!data || typeof data !== "object") {
    return {
      titleZh: fallbackTitle,
      summary: {
        oneLine: `${fallbackTitle}，家常易做、风味温暖。`,
        healingTone: "一口下去，暖胃又安心。",
        difficulty: "easy",
        timeTotalMin: 30,
        timeActiveMin: 15,
        servings: 2,
      },
      ingredients: [{ section: "主料", items: [] }],
      steps: [],
      imageShots: [],
      styleGuide: {},
    };
  }

  data.titleZh = data.titleZh || fallbackTitle;

  if (!data.summary || typeof data.summary !== "object") {
    data.summary = {
      oneLine: "",
      healingTone: "",
      difficulty: "easy",
      timeTotalMin: 30,
      timeActiveMin: 15,
      servings: 2,
    };
  }

  data.summary.oneLine =
    data.summary.oneLine || `${fallbackTitle}，家常易做、风味温暖。`;
  data.summary.healingTone = data.summary.healingTone || "一口下去，暖胃又安心。";
  data.summary.difficulty = data.summary.difficulty || "easy";
  data.summary.timeTotalMin =
    typeof data.summary.timeTotalMin === "number" ? data.summary.timeTotalMin : 30;
  data.summary.timeActiveMin =
    typeof data.summary.timeActiveMin === "number" ? data.summary.timeActiveMin : 15;
  data.summary.servings =
    typeof data.summary.servings === "number" ? data.summary.servings : 2;

  if (!Array.isArray(data.ingredients)) {
    data.ingredients = [{ section: "主料", items: [] }];
  }
  data.ingredients = data.ingredients.map((section: any) => ({
    section: section?.section || "主料",
    items: Array.isArray(section?.items) ? section.items : [],
  }));
  data.ingredients = data.ingredients.map((section: any) => {
    if (section.items.length === 0) {
      section.items = [
        {
          name: fallbackTitle,
          amount: 1,
          unit: "份",
        },
      ];
    }
    return section;
  });

  if (!Array.isArray(data.steps)) {
    data.steps = [];
  }
  if (data.steps.length === 0) {
    data.steps = [
      {
        id: "step01",
        title: "准备",
        action: "整理食材，准备烹饪。",
        heat: "medium",
      },
    ];
  }
  const normalizeHeat = (value: any) => {
    const allowed = ["low", "medium-low", "medium", "medium-high", "high"];
    if (!value) return "medium";
    const raw = String(value).toLowerCase();
    const map: Record<string, string> = {
      low: "low",
      "low heat": "low",
      "low-heat": "low",
      "medium low": "medium-low",
      "medium-low": "medium-low",
      mediumlow: "medium-low",
      medium: "medium",
      "medium heat": "medium",
      "medium-high": "medium-high",
      "medium high": "medium-high",
      mediumhigh: "medium-high",
      high: "high",
      "high heat": "high",
      小火: "low",
      微火: "low",
      中小火: "medium-low",
      中火: "medium",
      中大火: "medium-high",
      大火: "high",
    };
    const mapped = map[raw] || raw;
    return allowed.includes(mapped) ? mapped : "medium";
  };

  data.steps = data.steps.map((step: any, index: number) => {
    const normalized = {
      id: step.id || `step${String(index + 1).padStart(2, "0")}`,
      title: step.title || `步骤${index + 1}`,
      action: step.action || step.title || "继续烹饪",
      heat: normalizeHeat(step.heat),
      ...step,
    };
    normalized.heat = normalizeHeat(normalized.heat);
    return normalized;
  });

  if (!Array.isArray(data.imageShots)) {
    console.log("⚠️ AI 未返回 imageShots 数组，当前值:", typeof data.imageShots, data.imageShots);
    // 自动创建默认的成品图配置
    data.imageShots = [
      {
        key: "cover_main",
        imagePrompt: "",
        ratio: "16:9",
        imageUrl: ""
      },
      {
        key: "cover_detail",
        imagePrompt: "",
        ratio: "16:9",
        imageUrl: ""
      },
      {
        key: "cover_inside",
        imagePrompt: "",
        ratio: "16:9",
        imageUrl: ""
      }
    ];
    console.log("✅ 已自动创建 3 个默认成品图配置");
  } else {
    console.log("✅ AI 返回了 imageShots 数组，长度:", data.imageShots.length);
  }

  if (!data.styleGuide || typeof data.styleGuide !== "object") {
    data.styleGuide = {};
  }

  if (!data.story) {
    data.story = data.summary.oneLine || `${fallbackTitle}的家常做法，简单可靠。`;
  }

  return data;
}

/**
 * 生成单个菜谱
 */
export type GenerateRecipeResult =
  | { success: true; data: Recipe }
  | { success: false; error: string; data?: Recipe; issues?: string[] };

export async function generateRecipe(params: {
  dishName: string;
  servings?: number;
  timeBudget?: number;
  equipment?: string;
  dietary?: string;
  cuisine?: string;
}): Promise<GenerateRecipeResult> {
  try {
    const provider = await getTextProvider();

    // 构建提示词
    const config = await getAIConfig();
    const { prompt, systemPrompt } = await buildRecipePrompt(params);

    // 调用AI生成
    const response = await provider.chat({
      messages: systemPrompt
        ? [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: prompt },
          ]
        : [{ role: "user" as const, content: prompt }],
      temperature: 0.7,
      maxTokens: 8000, // 增加token限制以支持v2.0.0完整输出
    });

    // 清理响应
    const cleanedContent = cleanAIResponse(response.content);

    // 解析JSON
    let recipeData: any;
    let parseError: unknown;
    try {
      recipeData = unwrapRecipePayload(JSON.parse(cleanedContent));

      console.log("📋 AI 返回的顶层字段:", Object.keys(recipeData).join(", "));
      console.log("📋 imageShots 字段:", recipeData.imageShots ? `存在(${Array.isArray(recipeData.imageShots) ? recipeData.imageShots.length + "个" : typeof recipeData.imageShots})` : "不存在");

      // 兼容处理：如果AI返回的数据包裹在recipe字段中，提取出来
      if (recipeData.recipe && typeof recipeData.recipe === 'object') {
        const { recipe, ...rest } = recipeData;
        recipeData = {
          ...rest,
          ...recipe
        };
      }
    } catch (error) {
      parseError = error;
      const extracted = extractFirstJsonObject(cleanedContent);
      if (extracted && extracted !== cleanedContent) {
        try {
          recipeData = unwrapRecipePayload(JSON.parse(extracted));
        } catch (secondaryError) {
          parseError = secondaryError;
        }
      }
    }

    if (!recipeData) {
      console.error("JSON解析失败:", parseError);
      console.error("原始内容（前1000字符）:", response.content.substring(0, 1000));
      console.error("清理后内容（前1000字符）:", cleanedContent.substring(0, 1000));
      console.error("清理后内容（后1000字符）:", cleanedContent.substring(Math.max(0, cleanedContent.length - 1000)));

      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const context = cleanedContent.substring(Math.max(0, pos - 100), Math.min(cleanedContent.length, pos + 100));
          console.error("错误位置上下文（±100字符）:", context);
          console.error("错误位置字符:", cleanedContent[pos]);

          // 输出错误位置前后的行
          const lines = cleanedContent.split('\n');
          let currentPos = 0;
          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (currentPos + lineLength > pos) {
              console.error(`错误在第 ${i + 1} 行:`);
              console.error(`  ${Math.max(0, i - 2)}: ${lines[Math.max(0, i - 2)]}`);
              console.error(`  ${Math.max(0, i - 1)}: ${lines[Math.max(0, i - 1)]}`);
              console.error(`> ${i}: ${lines[i]}`);
              console.error(`  ${i + 1}: ${lines[i + 1] || ''}`);
              console.error(`  ${i + 2}: ${lines[i + 2] || ''}`);
              break;
            }
            currentPos += lineLength;
          }
        }
      }

      // 保存失败的 JSON 到临时文件（仅在开发环境）
      if (process.env.NODE_ENV === 'development') {
        try {
          const fs = require('fs');
          const path = require('path');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = path.join(process.cwd(), `failed-json-${timestamp}.txt`);
          fs.writeFileSync(filename, cleanedContent, 'utf-8');
          console.error(`失败的 JSON 已保存到: ${filename}`);
        } catch (fsError) {
          console.error('无法保存失败的 JSON:', fsError);
        }
      }

      return {
        success: false,
        error: `JSON解析失败：${parseError instanceof Error ? parseError.message : String(parseError)}`,
      };
    }

    // 标准化数据
    recipeData = normalizeRecipeData(recipeData);
    recipeData = ensureRecipeMinimums(recipeData, params.dishName);

    // 验证格式
    const validation = safeValidateRecipe(recipeData);

    if (!validation.success) {
      const issues = validation.error.issues.map((i) => i.message);
      console.error("Schema验证失败:", validation.error.issues);
      return {
        success: false,
        error: `Schema验证失败：${issues.join(", ")}`,
        data: recipeData as Recipe,
        issues,
      };
    }

    return {
      success: true,
      data: validation.data,
    };
  } catch (error) {
    console.error("生成菜谱失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 为菜谱步骤生成图片
 * @param steps 步骤数组
 * @param recipeName 菜谱名称
 * @param options 选项
 * @returns 更新后的步骤数组
 */
export async function generateStepImages(
  steps: any[],
  recipeName: string,
  options?: {
    onProgress?: (current: number, total: number) => void;
    maxConcurrent?: number;
  }
): Promise<any[]> {
  const maxConcurrent = options?.maxConcurrent ?? 2; // 默认并发2个
  const results = [...steps];

  // 过滤出没有 imageUrl 的步骤（imagePrompt 可以自动生成）
  const stepsToGenerate = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => !step.imageUrl);

  if (stepsToGenerate.length === 0) {
    console.log("所有步骤已有图片，跳过生成");
    return results;
  }

  console.log(`开始为 ${stepsToGenerate.length} 个步骤生成图片...`);

  // 分批处理
  for (let i = 0; i < stepsToGenerate.length; i += maxConcurrent) {
    const batch = stepsToGenerate.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async ({ step, index }) => {
      try {
        const prompt = step.imagePrompt || evolinkClient.generateRecipeImagePrompt(
          recipeName,
          step.action || step.title || `步骤${index + 1}`
        );

        console.log(`生成步骤 ${index + 1} 图片: ${prompt.substring(0, 50)}...`);

        const result = await evolinkClient.generateImage({
          prompt,
          negativePrompt: step.negativePrompt || "AI generated, plastic, unnatural, cartoon, 3D render, text, watermark",
          width: 1024,
          height: 768, // 4:3 比例
          timeoutMs: 30000,
          retries: 1,
        });

        if (result.success && (result.imageUrl || result.imageBase64)) {
          let imageUrl = result.imageUrl;
          if (!imageUrl && result.imageBase64) {
            const buffer = Buffer.from(result.imageBase64, "base64");
            imageUrl = await saveGeneratedImage(buffer, "recipes/steps");
          }
          results[index] = {
            ...results[index],
            imageUrl,
          };
          console.log(`步骤 ${index + 1} 图片生成成功`);
        } else {
          console.warn(`步骤 ${index + 1} 图片生成失败: ${result.error}`);
        }
      } catch (error) {
        console.error(`步骤 ${index + 1} 图片生成出错:`, error);
      }
    });

    await Promise.all(batchPromises);

    // 报告进度
    const completed = Math.min(i + maxConcurrent, stepsToGenerate.length);
    options?.onProgress?.(completed, stepsToGenerate.length);
  }

  return results;
}

/**
 * 为菜谱成品图生成图片
 * @param imageShots 成品图配置数组
 * @param recipeName 菜谱名称
 * @returns 更新后的成品图数组
 */
export async function generateCoverImages(
  imageShots: any[],
  recipeName: string
): Promise<any[]> {
  if (!imageShots || imageShots.length === 0) {
    return imageShots;
  }

  const results = [...imageShots];

  // 过滤出没有 imageUrl 的成品图（imagePrompt 可以自动生成）
  const shotsToGenerate = imageShots
    .map((shot, index) => ({ shot, index }))
    .filter(({ shot }) => !shot.imageUrl);

  if (shotsToGenerate.length === 0) {
    console.log("所有成品图已有图片，跳过生成");
    return results;
  }

  console.log(`开始为 ${shotsToGenerate.length} 张成品图生成图片...`);

  for (const { shot, index } of shotsToGenerate) {
    try {
      // 根据 ratio 确定尺寸
      let width = 1024;
      let height = 576; // 默认 16:9
      if (shot.ratio === "4:3") {
        height = 768;
      } else if (shot.ratio === "3:2") {
        height = 683;
      } else if (shot.ratio === "1:1") {
        height = 1024;
      }

      const result = await evolinkClient.generateImage({
        prompt: shot.imagePrompt,
        negativePrompt: shot.negativePrompt || "AI generated, plastic, unnatural, cartoon, 3D render, text, watermark",
        width,
        height,
        timeoutMs: 30000,
        retries: 1,
      });

      if (result.success && (result.imageUrl || result.imageBase64)) {
        let imageUrl = result.imageUrl;
        if (!imageUrl && result.imageBase64) {
          const buffer = Buffer.from(result.imageBase64, "base64");
          imageUrl = await saveGeneratedImage(buffer, "recipes/covers");
        }
        results[index] = {
          ...results[index],
          imageUrl,
        };
        console.log(`成品图 ${shot.key || index + 1} 生成成功`);
      } else {
        console.warn(`成品图 ${shot.key || index + 1} 生成失败: ${result.error}`);
      }
    } catch (error) {
      console.error(`成品图 ${shot.key || index + 1} 生成出错:`, error);
    }
  }

  return results;
}

/**
 * 生成菜谱并自动生成所有图片
 */
export async function generateRecipeWithImages(params: {
  dishName: string;
  servings?: number;
  timeBudget?: number;
  equipment?: string;
  dietary?: string;
  cuisine?: string;
  generateImages?: boolean; // 是否生成图片，默认 true
  onProgress?: (stage: string, current: number, total: number) => void;
}): Promise<GenerateRecipeResult> {
  const { generateImages = true, onProgress, ...recipeParams } = params;

  // 1. 生成菜谱文本
  onProgress?.("generating_recipe", 0, 1);
  const recipeResult = await generateRecipe(recipeParams);

  if (!recipeResult.success) {
    return recipeResult;
  }

  onProgress?.("generating_recipe", 1, 1);

  // 如果不需要生成图片，直接返回
  if (!generateImages) {
    return recipeResult;
  }

  const recipe = recipeResult.data as any;

  // 2. 生成步骤图
  if (recipe.steps && recipe.steps.length > 0) {
    onProgress?.("generating_step_images", 0, recipe.steps.length);
    recipe.steps = await generateStepImages(
      recipe.steps,
      recipe.titleZh || params.dishName,
      {
        onProgress: (current, total) => {
          onProgress?.("generating_step_images", current, total);
        },
      }
    );
  }

  // 3. 生成成品图
  if (recipe.imageShots && recipe.imageShots.length > 0) {
    onProgress?.("generating_cover_images", 0, recipe.imageShots.length);
    recipe.imageShots = await generateCoverImages(
      recipe.imageShots,
      recipe.titleZh || params.dishName
    );
    onProgress?.("generating_cover_images", recipe.imageShots.length, recipe.imageShots.length);
  }

  return {
    success: true,
    data: recipe as Recipe,
  };
}

/**
 * 批量生成菜谱
 */
export async function generateRecipesBatch(
  dishNames: string[],
  options?: {
    servings?: number;
    timeBudget?: number;
    equipment?: string;
    dietary?: string;
    cuisine?: string;
    onProgress?: (current: number, total: number, dishName: string) => void;
  }
): Promise<{
  success: number;
  failed: number;
  results: Array<{
    dishName: string;
    success: boolean;
    data?: Recipe;
    error?: string;
    issues?: string[];
  }>;
}> {
  const results: Array<{
    dishName: string;
    success: boolean;
    data?: Recipe;
    error?: string;
    issues?: string[];
  }> = [];

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < dishNames.length; i++) {
    const dishName = dishNames[i];

    if (options?.onProgress) {
      options.onProgress(i + 1, dishNames.length, dishName);
    }

    const result = await generateRecipe({
      dishName,
      servings: options?.servings,
      timeBudget: options?.timeBudget,
      equipment: options?.equipment,
      dietary: options?.dietary,
      cuisine: options?.cuisine,
    });

    if (result.success) {
      successCount++;
      results.push({
        dishName,
        success: true,
        data: result.data,
      });
    } else {
      failedCount++;
      results.push({
        dishName,
        success: false,
        error: result.error,
        data: result.data,
        issues: result.issues,
      });
    }

    // 避免API限流
    if (i < dishNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    results,
  };
}
