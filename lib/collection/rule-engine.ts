/**
 * Collection 规则引擎
 *
 * 核心口径：
 * 1. 规则组间为 AND 关系
 * 2. 规则组内根据 logic 字段决定 AND/OR
 * 3. exclude 条件为 NOT 关系
 * 4. 空组/空条件忽略
 */

import { Prisma } from "@prisma/client";
import type {
  RuleConfig,
  CustomRuleConfig,
  RuleGroup,
  RuleCondition,
  RuleOperator,
  RuleField,
} from "@/lib/types/collection";
import { isAutoRule, isCustomRule } from "@/lib/types/collection";

// Prisma where 条件类型
type RecipeWhereInput = Prisma.RecipeWhereInput;

/**
 * 将规则配置转换为 Prisma 查询条件
 */
export function buildRuleWhereClause(
  rules: RuleConfig,
  collection: {
    cuisineId?: string | null;
    locationId?: string | null;
    tagId?: string | null;
    excludedRecipeIds?: string[];
  }
): RecipeWhereInput {
  const where: RecipeWhereInput = {};

  // 处理排除的食谱
  if (collection.excludedRecipeIds && collection.excludedRecipeIds.length > 0) {
    where.id = { notIn: collection.excludedRecipeIds };
  }

  // Auto 规则：单标签匹配
  if (isAutoRule(rules)) {
    if (rules.field === "cuisineId" && collection.cuisineId) {
      where.cuisineId = collection.cuisineId;
    } else if (rules.field === "locationId" && collection.locationId) {
      where.locationId = collection.locationId;
    } else if (rules.field === "tagId" && collection.tagId) {
      where.tags = { some: { tagId: collection.tagId } };
    }
    return where;
  }

  // Custom 规则：复杂规则组合
  if (isCustomRule(rules)) {
    const customWhere = buildCustomRuleWhere(rules);
    return { ...where, ...customWhere };
  }

  return where;
}

/**
 * 构建 Custom 规则的查询条件
 */
function buildCustomRuleWhere(rules: CustomRuleConfig): RecipeWhereInput {
  const conditions: RecipeWhereInput[] = [];

  // 处理规则组（组间 AND）
  for (const group of rules.groups) {
    if (group.conditions.length === 0) continue;

    const groupWhere = buildGroupWhere(group);
    if (groupWhere) {
      conditions.push(groupWhere);
    }
  }

  // 处理排除条件（NOT）
  const excludeConditions: RecipeWhereInput[] = [];
  for (const condition of rules.exclude || []) {
    const conditionWhere = buildConditionWhere(condition);
    if (conditionWhere) {
      excludeConditions.push(conditionWhere);
    }
  }

  // 组合最终条件
  const result: RecipeWhereInput = {};

  // 组间 AND
  if (conditions.length > 0) {
    if (conditions.length === 1) {
      Object.assign(result, conditions[0]);
    } else {
      result.AND = conditions;
    }
  }

  // 排除条件 NOT
  if (excludeConditions.length > 0) {
    if (excludeConditions.length === 1) {
      result.NOT = excludeConditions[0];
    } else {
      result.NOT = { OR: excludeConditions };
    }
  }

  return result;
}

/**
 * 构建单个规则组的查询条件
 */
function buildGroupWhere(group: RuleGroup): RecipeWhereInput | null {
  if (group.conditions.length === 0) return null;

  const conditionWheres: RecipeWhereInput[] = [];

  for (const condition of group.conditions) {
    const conditionWhere = buildConditionWhere(condition);
    if (conditionWhere) {
      conditionWheres.push(conditionWhere);
    }
  }

  if (conditionWheres.length === 0) return null;

  // 单个条件直接返回
  if (conditionWheres.length === 1) {
    return conditionWheres[0];
  }

  // 多个条件根据 logic 组合
  if (group.logic === "OR") {
    return { OR: conditionWheres };
  } else {
    return { AND: conditionWheres };
  }
}

/**
 * 构建单个条件的查询条件
 */
function buildConditionWhere(condition: RuleCondition): RecipeWhereInput | null {
  const { field, operator, value, tagType } = condition;

  // 处理标签相关字段
  if (field === "tagId" || field === "tag") {
    return buildTagCondition(operator, value, tagType);
  }

  // 处理关联字段
  if (field === "cuisineId") {
    return buildRelationCondition("cuisineId", operator, value);
  }

  if (field === "locationId") {
    return buildRelationCondition("locationId", operator, value);
  }

  // 处理数值字段
  if (["cookTime", "prepTime", "difficulty", "servings"].includes(field)) {
    return buildNumericCondition(field, operator, value);
  }

  return null;
}

/**
 * 构建标签条件
 */
function buildTagCondition(
  operator: RuleOperator | string,
  value: string | number | string[],
  tagType?: string
): RecipeWhereInput | null {
  // 构建标签查询条件
  const tagWhere: Prisma.RecipeTagWhereInput = {};

  // 如果指定了标签类型
  if (tagType) {
    tagWhere.tag = { type: tagType };
  }

  switch (operator) {
    case "eq":
      tagWhere.tagId = value as string;
      return { tags: { some: tagWhere } };

    case "neq":
      tagWhere.tagId = value as string;
      return { tags: { none: tagWhere } };

    case "in":
      const inValues = Array.isArray(value) ? value : [value as string];
      tagWhere.tagId = { in: inValues };
      return { tags: { some: tagWhere } };

    case "nin":
      const ninValues = Array.isArray(value) ? value : [value as string];
      tagWhere.tagId = { in: ninValues };
      return { tags: { none: tagWhere } };

    default:
      return null;
  }
}

/**
 * 构建关联字段条件（cuisineId, locationId）
 */
function buildRelationCondition(
  field: "cuisineId" | "locationId",
  operator: RuleOperator | string,
  value: string | number | string[]
): RecipeWhereInput | null {
  switch (operator) {
    case "eq":
      return { [field]: value as string };

    case "neq":
      return { [field]: { not: value as string } };

    case "in":
      const inValues = Array.isArray(value) ? value : [value as string];
      return { [field]: { in: inValues } };

    case "nin":
      const ninValues = Array.isArray(value) ? value : [value as string];
      return { [field]: { notIn: ninValues } };

    default:
      return null;
  }
}

/**
 * 构建数值字段条件
 */
function buildNumericCondition(
  field: string,
  operator: RuleOperator | string,
  value: string | number | string[]
): RecipeWhereInput | null {
  const numValue = typeof value === "number" ? value : parseInt(value as string, 10);

  if (isNaN(numValue)) return null;

  switch (operator) {
    case "eq":
      return { [field]: numValue };

    case "neq":
      return { [field]: { not: numValue } };

    case "lt":
      return { [field]: { lt: numValue } };

    case "lte":
      return { [field]: { lte: numValue } };

    case "gt":
      return { [field]: { gt: numValue } };

    case "gte":
      return { [field]: { gte: numValue } };

    default:
      return null;
  }
}

/**
 * 验证规则配置是否有效
 */
export function validateRuleConfig(rules: RuleConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (isAutoRule(rules)) {
    if (!rules.field) {
      errors.push("Auto 规则必须指定 field");
    }
    if (!rules.value) {
      errors.push("Auto 规则必须指定 value");
    }
    if (!["cuisineId", "locationId", "tagId"].includes(rules.field)) {
      errors.push(`无效的 field: ${rules.field}`);
    }
  } else if (isCustomRule(rules)) {
    // 验证规则组
    for (let i = 0; i < rules.groups.length; i++) {
      const group = rules.groups[i];
      if (!group.logic || !["AND", "OR"].includes(group.logic)) {
        errors.push(`规则组 ${i + 1} 的 logic 必须是 AND 或 OR`);
      }

      for (let j = 0; j < group.conditions.length; j++) {
        const condition = group.conditions[j];
        const conditionErrors = validateCondition(condition);
        errors.push(
          ...conditionErrors.map((e) => `规则组 ${i + 1} 条件 ${j + 1}: ${e}`)
        );
      }
    }

    // 验证排除条件
    for (let i = 0; i < (rules.exclude || []).length; i++) {
      const condition = rules.exclude[i];
      const conditionErrors = validateCondition(condition);
      errors.push(...conditionErrors.map((e) => `排除条件 ${i + 1}: ${e}`));
    }
  } else {
    errors.push("无效的规则类型");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证单个条件
 */
function validateCondition(condition: RuleCondition): string[] {
  const errors: string[] = [];

  if (!condition.field) {
    errors.push("必须指定 field");
  }

  if (!condition.operator) {
    errors.push("必须指定 operator");
  }

  const validOperators = ["eq", "neq", "in", "nin", "lt", "lte", "gt", "gte"];
  if (!validOperators.includes(condition.operator)) {
    errors.push(`无效的 operator: ${condition.operator}`);
  }

  if (condition.value === undefined || condition.value === null) {
    errors.push("必须指定 value");
  }

  // 标签字段需要 tagType
  if (condition.field === "tag" && !condition.tagType) {
    errors.push("tag 字段必须指定 tagType");
  }

  // 数值字段的操作符限制
  const numericFields = ["cookTime", "prepTime", "difficulty", "servings"];
  if (numericFields.includes(condition.field)) {
    const numericOperators = ["eq", "neq", "lt", "lte", "gt", "gte"];
    if (!numericOperators.includes(condition.operator)) {
      errors.push(`数值字段不支持 ${condition.operator} 操作符`);
    }
  }

  // 关联字段的操作符限制
  const relationFields = ["cuisineId", "locationId", "tagId", "tag"];
  if (relationFields.includes(condition.field)) {
    const relationOperators = ["eq", "neq", "in", "nin"];
    if (!relationOperators.includes(condition.operator)) {
      errors.push(`关联字段不支持 ${condition.operator} 操作符`);
    }
  }

  return errors;
}

/**
 * 获取规则的人类可读描述
 */
export function getRuleDescription(rules: RuleConfig): string {
  if (isAutoRule(rules)) {
    const fieldLabels: Record<string, string> = {
      cuisineId: "菜系",
      locationId: "地区",
      tagId: "标签",
    };
    return `自动匹配 ${fieldLabels[rules.field] || rules.field}`;
  }

  if (isCustomRule(rules)) {
    if (rules.groups.length === 0) {
      return "无规则（匹配所有）";
    }

    const groupDescs = rules.groups.map((group, i) => {
      const condDescs = group.conditions.map((c) => getConditionDescription(c));
      const logic = group.logic === "OR" ? " 或 " : " 且 ";
      return `(${condDescs.join(logic)})`;
    });

    let desc = groupDescs.join(" 且 ");

    if (rules.exclude && rules.exclude.length > 0) {
      const excludeDescs = rules.exclude.map((c) => getConditionDescription(c));
      desc += ` 排除: ${excludeDescs.join(", ")}`;
    }

    return desc;
  }

  return "未知规则类型";
}

/**
 * 获取条件的人类可读描述
 */
function getConditionDescription(condition: RuleCondition): string {
  const fieldLabels: Record<string, string> = {
    cuisineId: "菜系",
    locationId: "地区",
    tagId: "标签",
    tag: "标签",
    cookTime: "烹饪时间",
    prepTime: "准备时间",
    difficulty: "难度",
    servings: "份量",
  };

  const operatorLabels: Record<string, string> = {
    eq: "等于",
    neq: "不等于",
    in: "包含",
    nin: "不包含",
    lt: "小于",
    lte: "小于等于",
    gt: "大于",
    gte: "大于等于",
  };

  const field = fieldLabels[condition.field] || condition.field;
  const operator = operatorLabels[condition.operator] || condition.operator;
  const value = Array.isArray(condition.value)
    ? condition.value.join(", ")
    : String(condition.value);

  return `${field} ${operator} ${value}`;
}
