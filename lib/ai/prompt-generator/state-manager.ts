/**
 * 状态管理器
 * 跟踪已使用的元素，避免重复
 */

import { GeneratorState } from '@/types/prompt-generator';

export class StateManager {
    private state: GeneratorState;

    constructor() {
        this.state = {
            usedSurfaces: [],
            usedBackgrounds: [],
            usedCameras: [],
            usedPerspectives: [],
        };
    }

    /**
     * 从数组中选择下一个未使用的元素
     * 如果都用过了，重置并重新开始
     */
    getNextItem(items: string[], usedItems: string[]): string {
        const available = items.filter(item => !usedItems.includes(item));

        if (available.length === 0) {
            // 都用过了，重置
            usedItems.length = 0;
            return items[Math.floor(Math.random() * items.length)];
        }

        // 从可用的中随机选择
        const selected = available[Math.floor(Math.random() * available.length)];
        usedItems.push(selected);
        return selected;
    }

    getNextSurface(surfaces: string[]): string {
        return this.getNextItem(surfaces, this.state.usedSurfaces);
    }

    getNextBackground(backgrounds: string[]): string {
        return this.getNextItem(backgrounds, this.state.usedBackgrounds);
    }

    getNextCamera(cameras: string[]): string {
        return this.getNextItem(cameras, this.state.usedCameras);
    }

    markPerspectiveUsed(perspective: string): void {
        if (!this.state.usedPerspectives.includes(perspective)) {
            this.state.usedPerspectives.push(perspective);
        }
    }

    reset(): void {
        this.state = {
            usedSurfaces: [],
            usedBackgrounds: [],
            usedCameras: [],
            usedPerspectives: [],
        };
    }

    getState(): GeneratorState {
        return { ...this.state };
    }
}
