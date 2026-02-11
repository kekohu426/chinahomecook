/**
 * 治愈美学提示词批量生成器
 *
 * 核心功能：一次 LLM 调用生成所有步骤的图片提示词
 * 确保场景一致性、治愈美学风格、反AI感锚点
 */

import { chat } from '@/lib/ai/provider';
import { getPromptConfig } from '@/lib/ai/prompt-manager';
import { AIGenerationLogger } from '@/lib/ai/generation-logger';
import {
  DishStyle,
  HealingPromptsResult,
  HealingSceneContext,
  HealingShot,
  StepInputForHealing,
} from '@/types/prompt-generator';
import {
  HEALING_SYSTEM_PROMPT,
  buildHealingUserPrompt,
  DEFAULT_HEALING_NEGATIVE_PROMPT,
} from './healing-system-prompt';

/**
 * 生成治愈美学提示词（一次 LLM 调用）
 *
 * @param recipeName 菜谱名称
 * @param steps 步骤列表
 * @param dishStyle 菜品风格
 * @param logger 可选的 AI 生成记录器
 * @returns 包含场景上下文和所有步骤提示词的结果
 */
export async function generateHealingPrompts(
  recipeName: string,
  steps: StepInputForHealing[],
  dishStyle: DishStyle,
  logger?: AIGenerationLogger
): Promise<HealingPromptsResult> {
  // 尝试从数据库获取自定义配置，否则使用默认值
  const promptConfig = await getPromptConfig('healing_step_prompts');

  // 使用配置中的 systemPrompt，或回退到默认值
  const systemPrompt = promptConfig?.systemPrompt || HEALING_SYSTEM_PROMPT;

  // 构建用户提示词
  const userPrompt = buildHealingUserPrompt(recipeName, steps, dishStyle);

  // 调用 LLM（传入 logger 以记录生成）
  const response = await chat(userPrompt, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 4000,
    logger,
    stepName: 'healing_prompts_generation',
  });

  // 解析 JSON 响应
  const result = parseHealingResponse(response);

  // 验证输出
  validateHealingResult(result, steps.length);

  return result;
}

/**
 * 解析 LLM 响应为 HealingPromptsResult
 */
function parseHealingResponse(response: string): HealingPromptsResult {
  // 尝试提取 JSON（可能被 markdown 代码块包裹）
  let jsonStr = response.trim();

  // 移除可能的 markdown 代码块
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // 尝试找到 JSON 对象的开始和结束
  const startIdx = jsonStr.indexOf('{');
  const endIdx = jsonStr.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed as HealingPromptsResult;
  } catch (error) {
    throw new Error(
      `解析治愈美学提示词响应失败: ${error instanceof Error ? error.message : '未知错误'}\n响应内容: ${response.substring(0, 500)}`
    );
  }
}

/**
 * 验证 HealingPromptsResult 格式
 */
function validateHealingResult(result: HealingPromptsResult, expectedStepCount: number): void {
  // 验证 sceneContext
  if (!result.sceneContext) {
    throw new Error('缺少 sceneContext 字段');
  }

  const ctx = result.sceneContext;
  if (!ctx.kitchenStyle || !ctx.lightingMood || !ctx.colorPalette) {
    throw new Error('sceneContext 缺少必要字段 (kitchenStyle, lightingMood, colorPalette)');
  }

  if (!Array.isArray(ctx.props) || ctx.props.length === 0) {
    throw new Error('sceneContext.props 必须是非空数组');
  }

  // 验证 shots
  if (!Array.isArray(result.shots)) {
    throw new Error('shots 必须是数组');
  }

  // 期望数量 = 步骤数 + 1（封面图 step: 0）
  const expectedTotalShots = expectedStepCount + 1;
  if (result.shots.length !== expectedTotalShots) {
    console.warn(
      `警告: shots 数量 (${result.shots.length}) 与期望数量 (${expectedTotalShots}) 不匹配（${expectedStepCount} 步骤 + 1 封面）`
    );
  }

  // 验证每个 shot
  for (const shot of result.shots) {
    // 注意：step: 0 是封面图，不能用 !shot.step 判断（0 是 falsy）
    if (typeof shot.step !== 'number' || !shot.prompt) {
      throw new Error(`shot ${shot.step ?? '?'} 缺少必要字段 (step, prompt)`);
    }

    // 确保有负向提示词
    if (!shot.negativePrompt) {
      shot.negativePrompt = DEFAULT_HEALING_NEGATIVE_PROMPT;
    }

    // 确保有 key
    if (!shot.key) {
      shot.key = `step_${shot.step}`;
    }

    // 确保有 ratio
    if (!shot.ratio) {
      shot.ratio = '4:3';
    }
  }
}

/**
 * 创建默认的场景上下文（用于回退）
 */
export function createDefaultSceneContext(dishStyle: DishStyle): HealingSceneContext {
  const styleContexts: Record<DishStyle, HealingSceneContext> = {
    light_and_fresh: {
      kitchenStyle: 'Clean Chinese home kitchen with white tiles and natural light',
      lightingMood: 'Bright morning light from window, soft and diffused',
      colorPalette: 'White, light wood, fresh green accents',
      props: ['white ceramic bowl', 'bamboo cutting board', 'stainless steel wok'],
    },
    dark_and_moody: {
      kitchenStyle: 'Traditional Chinese home kitchen with warm ambient lighting',
      lightingMood: 'Warm side lighting, golden hour glow, gentle shadows',
      colorPalette: 'Deep brown, warm gold, rich red accents',
      props: ['seasoned iron wok with patina', 'wooden cutting board with knife marks', 'clay pot'],
    },
    baking: {
      kitchenStyle: 'Cozy Chinese home kitchen with wooden elements',
      lightingMood: 'Soft warm light, gentle window backlight',
      colorPalette: 'Golden yellow, cream white, natural wood tones',
      props: ['wooden rolling pin', 'bamboo steamer', 'flour-dusted surface'],
    },
  };

  return styleContexts[dishStyle];
}

/**
 * 从 HealingShot 转换为兼容旧格式的 StepPrompt
 */
export function healingShotToStepPrompt(
  shot: HealingShot,
  sceneContext: HealingSceneContext
): {
  stepNumber: number;
  stepType: 'preparation' | 'cooking' | 'presentation';
  coreAction: string;
  prompt: string;
  variables: {
    perspective: string;
    lighting: string;
    surface: string;
    camera: string;
    background: string;
  };
} {
  // 根据步骤序号推断步骤类型
  const stepType: 'preparation' | 'cooking' | 'presentation' =
    shot.step === 1 ? 'preparation' : 'cooking';

  return {
    stepNumber: shot.step,
    stepType,
    coreAction: shot.prompt.substring(0, 50), // 截取前50字符作为核心动作
    prompt: shot.prompt,
    variables: {
      perspective: shot.cameraAngle || '45-degree angle',
      lighting: sceneContext.lightingMood,
      surface: sceneContext.props[0] || 'kitchen counter',
      camera: '50mm lens, f/2.8',
      background: sceneContext.kitchenStyle,
    },
  };
}
