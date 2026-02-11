/**
 * 提示词组装器
 * 将各个元素组合成最终的图片生成提示词
 */

import { PromptVariables } from '@/types/prompt-generator';

export class PromptAssembler {
    /**
     * 组装完整的提示词
     */
    assemble(coreAction: string, variables: PromptVariables): string {
        const prompt = `A realistic and detailed food photography, professional color grading, ${variables.camera}.
${variables.perspective} of ${coreAction}.
The scene is set ${variables.surface}, with ${variables.background}.
The lighting is ${variables.lighting}, casting soft shadows and highlighting the texture of the food.
High detail, sharp focus on the main action, with a slight bokeh background.`;

        return prompt.trim();
    }

    /**
     * 获取负面提示词（用于排除不想要的元素）
     */
    getNegativePrompt(): string {
        return '--no illustration, 3d render, cartoon, watermark, text, logo, oversaturated, artificial, fake, camera, tripod, equipment';
    }

    /**
     * 组装完整提示词（包含负面提示词）
     */
    assembleWithNegative(coreAction: string, variables: PromptVariables): string {
        const mainPrompt = this.assemble(coreAction, variables);
        const negativePrompt = this.getNegativePrompt();
        return `${mainPrompt}\n\n${negativePrompt}`;
    }
}
