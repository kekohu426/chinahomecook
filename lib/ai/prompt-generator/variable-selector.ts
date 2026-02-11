/**
 * 变量选择器
 * 根据步骤类型和菜品风格选择合适的拍摄变量
 */

import { StepType, DishStyle, PromptVariables, PromptLibraries } from '@/types/prompt-generator';
import { StateManager } from './state-manager';

export class VariableSelector {
    private libraries: PromptLibraries;
    private stateManager: StateManager;

    constructor(libraries: PromptLibraries, stateManager: StateManager) {
        this.libraries = libraries;
        this.stateManager = stateManager;
    }

    /**
     * 为步骤选择所有变量
     */
    selectVariables(
        stepType: StepType,
        dishStyle: DishStyle
    ): PromptVariables {
        // 1. 选择视角（根据步骤类型）
        const perspectivesForType = this.libraries.perspectives[stepType];
        const perspective = perspectivesForType[
            Math.floor(Math.random() * perspectivesForType.length)
        ];
        this.stateManager.markPerspectiveUsed(perspective);

        // 2. 选择光线（根据菜品风格）
        const lightingForStyle = this.libraries.lighting[dishStyle] || this.libraries.lighting.light_and_fresh;
        const lighting = lightingForStyle[
            Math.floor(Math.random() * lightingForStyle.length)
        ];

        // 3. 选择台面（轮换，避免重复）
        const surface = this.stateManager.getNextSurface(this.libraries.surfaces);

        // 4. 选择相机（轮换，避免重复）
        const camera = this.stateManager.getNextCamera(this.libraries.cameras);

        // 5. 选择背景（轮换，避免重复）
        const background = this.stateManager.getNextBackground(this.libraries.backgrounds);

        return {
            perspective,
            lighting,
            surface,
            camera,
            background,
        };
    }
}
