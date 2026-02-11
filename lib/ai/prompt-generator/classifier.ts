/**
 * 步骤分类器
 * 根据描述判断步骤类型：准备/烹饪/摆盘
 */

import { StepType } from '@/types/prompt-generator';

// 关键词映射
const KEYWORDS = {
    preparation: [
        '切', '洗', '准备', '腌', '码', '剁', '搅拌', '混合',
        '筛', '称', '量', '剥', '去皮', '去籽', '泡',
    ],
    cooking: [
        '炒', '煮', '蒸', '炸', '烤', '煎', '焖', '炖', '烧',
        '焯', '爆', '溜', '煨', '熬', '卤', '腌', '拌',
        '下锅', '入锅', '加热', '翻炒', '搅动',
    ],
    presentation: [
        '装盘', '摆盘', '撒', '淋', '浇', '点缀', '码放',
        '盛', '放入盘中', '倒入碗', '成品',
    ],
};

export async function classifyStep(description: string): Promise<StepType> {
    // 计算每个类型的匹配分数
    const scores = {
        preparation: 0,
        cooking: 0,
        presentation: 0,
    };

    for (const [type, keywords] of Object.entries(KEYWORDS)) {
        for (const keyword of keywords) {
            if (description.includes(keyword)) {
                scores[type as StepType] += 1;
            }
        }
    }

    // 特殊规则：如果包含火候、锅相关词，强制为烹饪
    if (/[锅|火|油|热|冷|温|焖|炖|煮|蒸]/.test(description)) {
        scores.cooking += 2;
    }

    // 特殊规则：如果包含盛装词，强制为摆盘
    if (/[盘|碗|器|撒|浇|淋|点缀|装]/.test(description)) {
        scores.presentation += 2;
    }

    // 返回得分最高的类型
    const maxScore = Math.max(scores.preparation, scores.cooking, scores.presentation);

    if (maxScore === 0) {
        // 没有匹配到任何关键词，默认为烹饪
        return 'cooking';
    }

    if (scores.cooking === maxScore) return 'cooking';
    if (scores.presentation === maxScore) return 'presentation';
    return 'preparation';
}
