/**
 * Recipe Schema 验证器测试
 *
 * 测试所有 PRD Schema v1.1.0 的验证规则
 */

import { describe, it, expect } from 'vitest'
import {
  validateRecipe,
  safeValidateRecipe,
  validateSummary,
  validateIngredients,
  validateSteps,
} from '@/lib/validators/recipe'

describe('Recipe Schema Validator', () => {
  // ==================== Summary 测试 ====================
  describe('Summary 验证', () => {
    it('应该拒绝缺少 oneLine 的数据', () => {
      const invalid = {
        healingTone: '治愈文案',
        difficulty: 'easy',
        timeTotalMin: 60,
        timeActiveMin: 30,
        servings: 3
      }

      expect(() => validateSummary(invalid)).toThrow()
    })

    it('应该拒绝缺少 healingTone 的数据', () => {
      const invalid = {
        oneLine: '一句话',
        difficulty: 'easy',
        timeTotalMin: 60,
        timeActiveMin: 30,
        servings: 3
      }

      expect(() => validateSummary(invalid)).toThrow()
    })

    it('应该拒绝错误的 difficulty 枚举值', () => {
      const invalid = {
        oneLine: '一句话',
        healingTone: '治愈文案',
        difficulty: 'super-hard', // 不在枚举中
        timeTotalMin: 60,
        timeActiveMin: 30,
        servings: 3
      }

      expect(() => validateSummary(invalid)).toThrow()
    })

    it('应该拒绝负数的时间', () => {
      const invalid = {
        oneLine: '一句话',
        healingTone: '治愈文案',
        difficulty: 'easy',
        timeTotalMin: -10, // 负数
        timeActiveMin: 30,
        servings: 3
      }

      expect(() => validateSummary(invalid)).toThrow()
    })

    it('应该接受完整的 summary 数据', () => {
      const valid = {
        oneLine: '麦香与肉脂的微醺共舞',
        healingTone: '家的味道，总在啤酒香里藏着',
        difficulty: 'medium' as const,
        timeTotalMin: 60,
        timeActiveMin: 30,
        servings: 3
      }

      expect(() => validateSummary(valid)).not.toThrow()
      const result = validateSummary(valid)
      expect(result.oneLine).toBe('麦香与肉脂的微醺共舞')
      expect(result.difficulty).toBe('medium')
    })
  })

  // ==================== Ingredients 测试 ====================
  describe('Ingredients 验证', () => {
    it('应该拒绝空数组', () => {
      expect(() => validateIngredients([])).toThrow()
    })

    it('应该拒绝错误的 iconKey 枚举值', () => {
      const invalid = [{
        section: '主料',
        items: [{
          name: '鸭肉',
          iconKey: 'invalid-icon', // 不在枚举中
          amount: 750,
          unit: '克'
        }]
      }]

      expect(() => validateIngredients(invalid)).toThrow()
    })

    it('应该拒绝负数的 amount', () => {
      const invalid = [{
        section: '主料',
        items: [{
          name: '鸭肉',
          iconKey: 'meat',
          amount: -100, // 负数
          unit: '克'
        }]
      }]

      expect(() => validateIngredients(invalid)).toThrow()
    })

    it('应该接受所有有效的 iconKey 枚举值', () => {
      const validIcons = ['meat', 'veg', 'fruit', 'seafood', 'grain', 'bean', 'dairy', 'egg', 'spice', 'sauce', 'oil', 'other']

      validIcons.forEach(iconKey => {
        const valid = [{
          section: '测试分组',
          items: [{
            name: '测试食材',
            iconKey,
            amount: 100,
            unit: '克'
          }]
        }]

        expect(() => validateIngredients(valid)).not.toThrow()
      })
    })

    it('应该接受完整的ingredients数据', () => {
      const valid = [
        {
          section: '主料',
          items: [
            {
              name: '鸭肉',
              iconKey: 'meat' as const,
              amount: 750,
              unit: '克',
              notes: '半只'
            },
            {
              name: '啤酒',
              iconKey: 'other' as const,
              amount: 500,
              unit: '毫升'
            }
          ]
        },
        {
          section: '配料',
          items: [
            {
              name: '青红椒',
              iconKey: 'veg' as const,
              amount: 2,
              unit: '个'
            }
          ]
        }
      ]

      expect(() => validateIngredients(valid)).not.toThrow()
      const result = validateIngredients(valid)
      expect(result).toHaveLength(2)
      expect(result[0].section).toBe('主料')
      expect(result[0].items).toHaveLength(2)
    })
  })

  // ==================== Steps 测试 ====================
  describe('Steps 验证', () => {
    it('应该拒绝空数组', () => {
      expect(() => validateSteps([])).toThrow()
    })

    it('应该接受只有必填字段的步骤（v2.0.0 其他字段可选）', () => {
      const valid = [{
        id: 'step01',
        title: '步骤标题',
        action: '详细描述'
        // v2.0.0: timerSec, speechText, visualCue, failPoint, photoBrief 都是可选的
      }]

      expect(() => validateSteps(valid)).not.toThrow()
    })

    it('应该拒绝负数的 timerSec', () => {
      const invalid = [{
        id: 'step01',
        title: '冷水焯鸭去腥',
        action: '鸭肉切块冷水下锅',
        speechText: '将鸭肉切块',
        timerSec: -10, // 负数
        visualCue: '水面浮起灰色浮沫',
        failPoint: '煮太久肉质变老',
        photoBrief: '炸鸭块特写'
      }]

      expect(() => validateSteps(invalid)).toThrow()
    })

    it('应该接受完整的步骤数据', () => {
      const valid = [
        {
          id: 'step01',
          title: '冷水焯鸭去腥',
          action: '鸭肉切块冷水下锅，放入两片姜和少许料酒。大火煮开后撇去浮沫，煮2分钟捞出。',
          speechText: '将鸭肉切块，冷水下锅，加入姜片和料酒，大火煮开后撇去浮沫。',
          timerSec: 120,
          visualCue: '水面浮起大量灰色浮沫，鸭肉变色发白。',
          failPoint: '煮太久肉质变老，失去嫩滑口感。',
          photoBrief: '炸鸭块特写，表面微微泛白'
        },
        {
          id: 'step02',
          title: '煸炒出鸭油',
          action: '热锅不放油，直接下鸭肉煸炒。',
          speechText: '热锅后直接下鸭肉煸炒。',
          timerSec: 300,
          visualCue: '锅底开始渗出金黄色鸭油。',
          failPoint: '火候不够鸭油不足，影响后续香味。',
          photoBrief: '煸炒鸭肉，锅底金黄鸭油'
        }
      ]

      expect(() => validateSteps(valid)).not.toThrow()
      const result = validateSteps(valid)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('step01')
      expect(result[0].timerSec).toBe(120)
    })
  })

  // ==================== 完整 Recipe 测试 ====================
  describe('完整 Recipe 验证', () => {
    it('应该拒绝错误的 schemaVersion', () => {
      const invalid = {
        schemaVersion: '1.0.0', // 错误版本
        titleZh: '啤酒鸭',
        summary: {},
        story: {},
        ingredients: [],
        steps: [],
        styleGuide: {},
        imageShots: []
      }

      expect(() => validateRecipe(invalid)).toThrow()
    })

    it('应该拒绝缺少 titleZh 的数据', () => {
      const invalid = {
        schemaVersion: '1.1.0',
        titleEn: 'Beer Duck',
        summary: {},
        story: {},
        ingredients: [],
        steps: [],
        styleGuide: {},
        imageShots: []
      }

      expect(() => validateRecipe(invalid)).toThrow()
    })

    it('应该接受完整的 PRD Schema v1.1.0 数据', () => {
      const valid = {
        schemaVersion: '1.1.0' as const,
        titleZh: '啤酒鸭',
        titleEn: 'Beer Duck',
        summary: {
          oneLine: '麦香与肉脂的微醺共舞',
          healingTone: '家的味道，总在啤酒香里藏着',
          difficulty: 'medium' as const,
          timeTotalMin: 60,
          timeActiveMin: 30,
          servings: 3
        },
        story: {
          title: '啤酒鸭的前世今生',
          content: '啤酒鸭是一道充满江湖气的菜肴，起源于川渝地区的街头小馆。据说是某位厨师在炖鸭时，手边没有黄酒，便随手倒入半瓶啤酒。没想到，啤酒的麦芽香与鸭肉的油脂完美融合，成就了这道经典。',
          tags: ['川菜', '家常菜', '肉类']
        },
        ingredients: [
          {
            section: '主料',
            items: [
              {
                name: '鸭肉',
                iconKey: 'meat' as const,
                amount: 750,
                unit: '克',
                notes: '半只'
              },
              {
                name: '啤酒',
                iconKey: 'other' as const,
                amount: 500,
                unit: '毫升'
              }
            ]
          }
        ],
        steps: [
          {
            id: 'step01',
            title: '冷水焯鸭去腥',
            action: '鸭肉切块冷水下锅，放入两片姜和少许料酒。大火煮开后撇去浮沫，煮2分钟捞出。',
            speechText: '将鸭肉切块，冷水下锅，加入姜片和料酒。',
            timerSec: 120,
            visualCue: '水面浮起大量灰色浮沫',
            failPoint: '煮太久肉质变老',
            photoBrief: '炸鸭块特写'
          }
        ],
        styleGuide: {
          theme: '治愈系暖调',
          lighting: '自然光',
          composition: '留白构图',
          aesthetic: '吉卜力风格'
        },
        imageShots: [
          {
            key: 'cover',
            imagePrompt: '啤酒鸭成品图，俯视角度，温暖光线',
            ratio: '16:9' as const
          }
        ]
      }

      expect(() => validateRecipe(valid)).not.toThrow()
      const result = validateRecipe(valid)
      expect(result.schemaVersion).toBe('1.1.0')
      expect(result.titleZh).toBe('啤酒鸭')
      expect(result.summary.oneLine).toBeDefined()
      // story can be string or object, check properly
      expect(result.story).toBeDefined()
      if (typeof result.story === 'object' && result.story !== null) {
        expect(result.story.tags).toHaveLength(3)
      }
    })

    it('safeValidateRecipe 应该返回结果而非抛出异常', () => {
      const invalid = {
        schemaVersion: '1.1.0',
        // 缺少必填字段
      }

      const result = safeValidateRecipe(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })
})
