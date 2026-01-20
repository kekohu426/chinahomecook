/**
 * AI 规则生成器
 *
 * 根据用户的自然语言描述，生成数据库查询规则
 */

import { getTextProvider } from "./provider";

// 标签数据（从数据库获取）
interface TagData {
  scenes: Array<{ id: string; name: string; slug: string }>;
  cookingMethods: Array<{ id: string; name: string; slug: string }>;
  tastes: Array<{ id: string; name: string; slug: string }>;
  crowds: Array<{ id: string; name: string; slug: string }>;
  occasions: Array<{ id: string; name: string; slug: string }>;
}

// 规则结构
export interface Rule {
  field: string;
  operator: "equals" | "contains" | "in";
  value: string | string[];
}

export interface RuleGroup {
  logic: "AND" | "OR";
  rules: Rule[];
}

export interface GeneratedRules {
  ruleGroups: RuleGroup[];
  explanation: string; // AI 对规则的解释
  confidence: number; // 置信度 0-1
}

/**
 * 生成 AI Prompt
 */
function buildPrompt(userInput: string, tags: TagData): string {
  return `你是一个食谱数据库查询规则生成器。用户会用自然语言描述他们想要的食谱类型，你需要根据可用的标签生成精确的查询规则。

## 可用标签类型和值

### 1. 场景标签 (scene)
${tags.scenes.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

### 2. 烹饪方式 (method)
${tags.cookingMethods.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

### 3. 口味标签 (taste)
${tags.tastes.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

### 4. 适合人群 (crowd)
${tags.crowds.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

### 5. 场合标签 (occasion)
${tags.occasions.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

## 规则生成要求

1. **字段类型**：
   - scene: 场景标签
   - method: 烹饪方式
   - taste: 口味标签
   - crowd: 适合人群
   - occasion: 场合标签

2. **操作符**：
   - equals: 精确匹配（单个标签）
   - in: 匹配多个标签之一（OR 关系）

3. **规则组逻辑**：
   - AND: 所有规则都必须满足
   - OR: 满足任一规则即可

4. **生成原则**：
   - 优先使用 AND 逻辑组合多个维度的标签
   - 同一维度的多个标签使用 in 操作符
   - 必须使用标签的 ID，不是名称
   - 尽量精确匹配用户意图
   - 如果用户描述模糊，选择最相关的标签

## 用户输入
"${userInput}"

## 输出格式（JSON）
请严格按照以下格式输出，不要添加任何其他文字：

\`\`\`json
{
  "ruleGroups": [
    {
      "logic": "AND",
      "rules": [
        {
          "field": "scene",
          "operator": "equals",
          "value": "标签ID"
        }
      ]
    }
  ],
  "explanation": "简短解释为什么选择这些标签（中文，1-2句话）",
  "confidence": 0.9
}
\`\`\`

## 示例

### 示例1：用户输入 "产后产妇食谱"
\`\`\`json
{
  "ruleGroups": [
    {
      "logic": "AND",
      "rules": [
        {
          "field": "scene",
          "operator": "equals",
          "value": "cmk55t8mz000qr521nf2u38er"
        },
        {
          "field": "crowd",
          "operator": "equals",
          "value": "cmk55to9n0034r5211tk2jzvu"
        }
      ]
    }
  ],
  "explanation": "选择了月子餐场景和产妇人群标签，精确匹配产后调理需求",
  "confidence": 0.95
}
\`\`\`

### 示例2：用户输入 "适合老人的清淡家常菜"
\`\`\`json
{
  "ruleGroups": [
    {
      "logic": "AND",
      "rules": [
        {
          "field": "crowd",
          "operator": "equals",
          "value": "cmk55tozk0038r5211h4j7nif"
        },
        {
          "field": "taste",
          "operator": "equals",
          "value": "cmk55tifb0028r521e6my5ejc"
        },
        {
          "field": "occasion",
          "operator": "equals",
          "value": "cmk55tv6d0046r521oiprs112"
        }
      ]
    }
  ],
  "explanation": "选择了老人人群、清淡口味和家常菜场合，符合老年人饮食习惯",
  "confidence": 0.9
}
\`\`\`

### 示例3：用户输入 "快手下饭菜"
\`\`\`json
{
  "ruleGroups": [
    {
      "logic": "AND",
      "rules": [
        {
          "field": "scene",
          "operator": "in",
          "value": ["cmk55t637000cr521smd8qp83", "cmk55t76s000ir52139lbuadp"]
        }
      ]
    }
  ],
  "explanation": "选择了快手菜和下饭菜场景标签，满足快速烹饪且适合配饭的需求",
  "confidence": 0.85
}
\`\`\`

现在请根据用户输入生成规则：`;
}

/**
 * 使用 AI 生成规则
 */
export async function generateRulesFromNaturalLanguage(
  userInput: string,
  tags: TagData
): Promise<GeneratedRules> {
  const prompt = buildPrompt(userInput, tags);

  try {
    // 使用默认的 AI Provider（GLM）
    const provider = getTextProvider();

    const response = await provider.chat({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // 较低温度，保证输出稳定
      maxTokens: 2000,
    });

    const content = response.content;

    // 提取 JSON
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

    if (!jsonMatch) {
      throw new Error("AI 返回格式错误：未找到 JSON");
    }

    const result = JSON.parse(jsonMatch[1]) as GeneratedRules;

    // 验证结果
    if (!result.ruleGroups || !Array.isArray(result.ruleGroups)) {
      throw new Error("AI 返回格式错误：缺少 ruleGroups");
    }

    return result;
  } catch (error) {
    console.error("AI 生成规则失败:", error);
    throw new Error(`AI 生成规则失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 验证生成的规则
 */
export function validateRules(rules: GeneratedRules, tags: TagData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const allTagIds = new Set([
    ...tags.scenes.map(t => t.id),
    ...tags.cookingMethods.map(t => t.id),
    ...tags.tastes.map(t => t.id),
    ...tags.crowds.map(t => t.id),
    ...tags.occasions.map(t => t.id),
  ]);

  for (const group of rules.ruleGroups) {
    for (const rule of group.rules) {
      // 验证字段类型
      const validFields = ["scene", "method", "taste", "crowd", "occasion"];
      if (!validFields.includes(rule.field)) {
        errors.push(`无效的字段类型: ${rule.field}`);
      }

      // 验证操作符
      const validOperators = ["equals", "in"];
      if (!validOperators.includes(rule.operator)) {
        errors.push(`无效的操作符: ${rule.operator}`);
      }

      // 验证标签 ID
      const values = Array.isArray(rule.value) ? rule.value : [rule.value];
      for (const value of values) {
        if (!allTagIds.has(value)) {
          errors.push(`无效的标签 ID: ${value}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
