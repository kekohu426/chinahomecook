/**
 * Recipe Prompt Generator - 主入口
 * 整合所有子模块，提供简洁的API接口
 */

import {
    StepPromptOptions,
    StepPrompt,
    RecipeInput,
    RecipePrompts,
    DishStyle,
    PromptLibraries,
    HealingPromptsResult,
    HealingSceneContext,
    StepInputForHealing,
} from '@/types/prompt-generator';
import { AIGenerationLogger } from '@/lib/ai/generation-logger';
import { translateAction } from './translator';
import { classifyStep } from './classifier';
import { StateManager } from './state-manager';
import { VariableSelector } from './variable-selector';
import { PromptAssembler } from './prompt-assembler';
import promptLibraries from './libraries.json';
import {
    generateHealingPrompts,
    createDefaultSceneContext,
    healingShotToStepPrompt,
} from './healing-prompt-generator';

export class RecipePromptGenerator {
    private libraries: PromptLibraries;
    private stateManager: StateManager;
    private variableSelector: VariableSelector;
    private assembler: PromptAssembler;

    constructor() {
        this.libraries = promptLibraries as PromptLibraries;
        this.stateManager = new StateManager();
        this.variableSelector = new VariableSelector(this.libraries, this.stateManager);
        this.assembler = new PromptAssembler();
    }

    /**
     * 为单个步骤生成提示词
     */
    async generateStepPrompt(options: StepPromptOptions): Promise<StepPrompt> {
        const {
            description,
            stepType: providedStepType,
            dishStyle = 'light_and_fresh',
            stepNumber = 1,
        } = options;

        // 1. 翻译核心动作
        const coreAction = await translateAction(description);

        // 2. 识别步骤类型（如果未提供）
        const stepType = providedStepType || await classifyStep(description);

        // 3. 选择变量
        const variables = this.variableSelector.selectVariables(stepType, dishStyle);

        // 4. 组装提示词
        const prompt = this.assembler.assembleWithNegative(coreAction, variables);

        return {
            stepNumber,
            stepType,
            coreAction,
            prompt,
            variables,
        };
    }

    /**
     * 为整个食谱批量生成提示词（带状态管理）
     */
    async generateRecipePrompts(recipe: RecipeInput): Promise<RecipePrompts> {
        // 重置状态，开始新食谱
        this.stateManager.reset();

        // 分析菜品风格
        const dishStyle = recipe.style || this.analyzeDishStyle(recipe.tags || []);

        // 为每个步骤生成提示词
        const prompts: StepPrompt[] = [];
        const totalSteps = recipe.steps.length;

        for (let i = 0; i < totalSteps; i++) {
            const step = recipe.steps[i];
            const prompt = await this.generateStepPrompt({
                description: step.description,
                stepNumber: step.number,
                dishStyle,
                isFirstStep: i === 0,
                isLastStep: i === totalSteps - 1,
            });
            prompts.push(prompt);
        }

        return {
            recipeName: recipe.name,
            overallStyle: dishStyle,
            prompts,
            metadata: {
                generatedAt: new Date().toISOString(),
                totalSteps,
            },
        };
    }

    /**
     * 分析菜品风格
     */
    private analyzeDishStyle(tags: string[]): DishStyle {
        const tagString = tags.join(',').toLowerCase();

        // 烘焙类
        if (/烘焙|蛋糕|面包|饼干|甜点|西点/.test(tagString)) {
            return 'baking';
        }

        // 浓郁重口味
        if (/川菜|湘菜|辣|红烧|酱|浓郁|重口|肉类/.test(tagString)) {
            return 'dark_and_moody';
        }

        // 默认清淡
        return 'light_and_fresh';
    }

    /**
     * 重置状态（开始新食谱时）
     */
    resetState(): void {
        this.stateManager.reset();
    }

    /**
     * 一次性生成所有步骤的治愈美学提示词
     *
     * @param recipeName 菜谱名称
     * @param steps 步骤列表
     * @param dishStyle 菜品风格
     * @param logger 可选的 AI 生成记录器
     * @returns 包含场景上下文和所有步骤提示词的结果
     */
    async generateAllStepPrompts(
        recipeName: string,
        steps: StepInputForHealing[],
        dishStyle: DishStyle,
        logger?: AIGenerationLogger
    ): Promise<HealingPromptsResult> {
        return generateHealingPrompts(recipeName, steps, dishStyle, logger);
    }

    /**
     * 带回退的批量生成治愈美学提示词
     *
     * 优先使用新版一次性生成，失败时回退到旧的逐步生成逻辑
     *
     * @param recipeName 菜谱名称
     * @param steps 步骤列表
     * @param dishStyle 菜品风格
     * @param logger 可选的 AI 生成记录器
     * @returns 生成结果，包含是否使用了回退
     */
    async generateAllStepPromptsWithFallback(
        recipeName: string,
        steps: StepInputForHealing[],
        dishStyle: DishStyle,
        logger?: AIGenerationLogger
    ): Promise<{
        prompts: StepPrompt[];
        usedFallback: boolean;
        sceneContext?: HealingSceneContext;
    }> {
        try {
            // 尝试使用新版治愈美学生成器
            const healingResult = await this.generateAllStepPrompts(recipeName, steps, dishStyle, logger);

            // 转换为 StepPrompt 格式
            const prompts: StepPrompt[] = healingResult.shots.map((shot) =>
                healingShotToStepPrompt(shot, healingResult.sceneContext)
            );

            return {
                prompts,
                usedFallback: false,
                sceneContext: healingResult.sceneContext,
            };
        } catch (error) {
            console.warn(
                `[HealingPromptGenerator] 新版生成失败，回退到旧逻辑: ${error instanceof Error ? error.message : '未知错误'}`
            );

            // 回退到旧的逐步生成逻辑
            this.stateManager.reset();
            const prompts: StepPrompt[] = [];

            for (const step of steps) {
                const prompt = await this.generateStepPrompt({
                    description: step.description,
                    stepNumber: step.number,
                    dishStyle,
                });
                prompts.push(prompt);
            }

            return {
                prompts,
                usedFallback: true,
                sceneContext: createDefaultSceneContext(dishStyle),
            };
        }
    }
}

// 导出单例
export const promptGenerator = new RecipePromptGenerator();
