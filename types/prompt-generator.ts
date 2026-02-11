/**
 * Recipe Prompt Generator 类型定义
 */

export type StepType = 'preparation' | 'cooking' | 'presentation';
export type DishStyle = 'light_and_fresh' | 'dark_and_moody' | 'baking';

export interface StepPromptOptions {
    description: string;
    stepType?: StepType;
    dishStyle?: DishStyle;
    stepNumber?: number;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}

export interface PromptVariables {
    perspective: string;
    lighting: string;
    surface: string;
    camera: string;
    background: string;
}

export interface StepPrompt {
    stepNumber: number;
    stepType: StepType;
    coreAction: string;
    prompt: string;
    variables: PromptVariables;
}

export interface RecipeInput {
    name: string;
    tags?: string[];
    steps: Array<{ number: number; description: string }>;
    style?: DishStyle;
}

export interface RecipePrompts {
    recipeName: string;
    overallStyle: DishStyle;
    prompts: StepPrompt[];
    metadata: {
        generatedAt: string;
        totalSteps: number;
    };
}

export interface PromptLibraries {
    cameras: string[];
    surfaces: string[];
    backgrounds: string[];
    lighting: {
        light_and_fresh: string[];
        dark_and_moody: string[];
        baking: string[];
    };
    perspectives: {
        preparation: string[];
        cooking: string[];
        presentation: string[];
    };
}

export interface GeneratorState {
    usedSurfaces: string[];
    usedBackgrounds: string[];
    usedCameras: string[];
    usedPerspectives: string[];
}

// ========== 治愈美学类型定义 ==========

/**
 * 治愈美学场景上下文
 * 定义贯穿所有步骤的统一厨房环境
 */
export interface HealingSceneContext {
    kitchenStyle: string;      // 厨房风格，如 "中式家庭厨房，老旧但干净"
    lightingMood: string;      // 光线氛围，如 "清晨侧光，温暖金色"
    colorPalette: string;      // 色彩基调，如 "暖黄、米白、深木色"
    props: string[];           // 道具列表，如 ["老铁锅", "竹砧板", "白瓷碗"]
}

/**
 * 治愈美学单个镜头
 */
export interface HealingShot {
    step: number;              // 步骤序号
    key: string;               // 镜头标识，如 "step_1", "step_2"
    ratio: string;             // 图片比例，如 "4:3", "16:9"
    cameraAngle: string;       // 相机角度，如 "45度俯拍", "平视特写"
    prompt: string;            // 正向提示词
    negativePrompt: string;    // 负向提示词
}

/**
 * 治愈美学提示词生成结果
 */
export interface HealingPromptsResult {
    sceneContext: HealingSceneContext;
    shots: HealingShot[];
}

/**
 * 治愈美学步骤输入
 */
export interface StepInputForHealing {
    number: number;
    description: string;
    title?: string;
}
