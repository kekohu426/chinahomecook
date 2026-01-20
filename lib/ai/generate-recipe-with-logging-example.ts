/**
 * AI 生成流程日志集成示例
 *
 * 展示如何在现有生成流程中集成日志记录
 * 性能优化：所有日志调用都是同步返回，不阻塞主流程
 */

import { AIGenerationLogger, calculateCost } from "./generation-logger";
import { getTextProvider } from "./provider";
import { evolinkClient } from "./evolink";

/**
 * 示例：带日志的食谱生成
 */
export async function generateRecipeWithLogging(params: {
  dishName: string;
  cuisine?: string;
  jobId?: string;
  userId?: string;
}) {
  // 创建日志记录器
  const logger = new AIGenerationLogger(undefined, {
    recipeId: undefined, // 生成后才有
    jobId: params.jobId,
    userId: params.userId,
  });

  const sessionId = logger.getSessionId();
  console.log(`[Session ${sessionId}] Starting recipe generation for: ${params.dishName}`);

  try {
    // 步骤1: 提示词组装
    const startPrompt = Date.now();
    const prompt = `生成${params.cuisine || ""}菜谱：${params.dishName}`;
    logger.logSuccess("prompt_assembly", "system", {
      prompt: prompt.substring(0, 1000), // 只记录前1000字符
      durationMs: Date.now() - startPrompt,
      metadata: { cuisine: params.cuisine, dishName: params.dishName },
    });

    // 步骤2: 文本生成（使用 measure 自动记录时间）
    const provider = await getTextProvider();
    const response = await logger.measure(
      "text_generation",
      provider.modelName || "gpt-4",
      async () => {
        return await provider.chat({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          maxTokens: 8000,
        });
      },
      {
        prompt: prompt.substring(0, 1000),
        parameters: { temperature: 0.7, maxTokens: 8000 },
        provider: provider.providerName,
      }
    );

    // 记录 token 使用和成本
    if (response.usage) {
      const cost = calculateCost(provider.modelName || "gpt-4", {
        input: response.usage.promptTokens,
        output: response.usage.completionTokens,
      });

      logger.logSuccess("token_calculation", "system", {
        tokenUsage: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens,
        },
        cost,
        durationMs: 0,
      });
    }

    // 步骤3: JSON 解析
    let recipeData;
    try {
      const startParse = Date.now();
      recipeData = JSON.parse(response.content);
      logger.logSuccess("json_parsing", "system", {
        durationMs: Date.now() - startParse,
        resultText: `Parsed ${Object.keys(recipeData).length} fields`,
      });
    } catch (error) {
      logger.logFailure("json_parsing", "system", error as Error, {
        resultText: response.content.substring(0, 500),
      });
      throw error;
    }

    // 步骤4: 数据校验
    const startValidation = Date.now();
    const validation = validateRecipe(recipeData);
    if (!validation.valid) {
      logger.log({
        stepName: "data_validation",
        modelName: "system",
        status: "failed",
        durationMs: Date.now() - startValidation,
        errorMessage: `Validation failed: ${validation.errors.join(", ")}`,
        warning: JSON.stringify(validation.errors),
      });
      throw new Error("Recipe validation failed");
    }

    logger.logSuccess("data_validation", "system", {
      durationMs: Date.now() - startValidation,
      resultText: "Validation passed",
    });

    // 步骤5: 图片生成（如果需要）
    if (recipeData.imageShots && recipeData.imageShots.length > 0) {
      for (let i = 0; i < recipeData.imageShots.length; i++) {
        const shot = recipeData.imageShots[i];
        try {
          const imageUrl = await logger.measure(
            "image_generation",
            "dall-e-3",
            async () => {
              const result = await evolinkClient.generateImage({
                prompt: shot.prompt,
                model: "dall-e-3",
              });
              return result.url;
            },
            {
              prompt: shot.prompt.substring(0, 500),
              parameters: { model: "dall-e-3", index: i },
              cost: 0.04, // DALL-E 3 固定价格
              retryIndex: 0,
            }
          );

          recipeData.imageShots[i].url = imageUrl;

          logger.logSuccess("image_storage", "system", {
            durationMs: 0,
            resultImages: [imageUrl],
            metadata: { shotIndex: i },
          });
        } catch (error) {
          logger.logFailure("image_generation", "dall-e-3", error as Error, {
            prompt: shot.prompt.substring(0, 500),
            retryIndex: 0,
            metadata: { shotIndex: i },
          });
          // 继续处理其他图片
        }
      }
    }

    // 步骤6: 数据库写入
    const startDb = Date.now();
    const savedRecipe = await saveRecipeToDatabase(recipeData);
    logger.logSuccess("database_insert", "system", {
      durationMs: Date.now() - startDb,
      recipeId: savedRecipe.id,
      resultText: `Recipe saved with ID: ${savedRecipe.id}`,
    });

    console.log(`[Session ${sessionId}] Recipe generation completed successfully`);
    return { success: true, recipe: savedRecipe, sessionId };
  } catch (error) {
    console.error(`[Session ${sessionId}] Recipe generation failed:`, error);
    logger.logFailure("generation_pipeline", "system", error as Error);
    throw error;
  }
}

// 辅助函数（示例）
function validateRecipe(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.title) errors.push("Missing title");
  if (!data.ingredients) errors.push("Missing ingredients");
  if (!data.steps) errors.push("Missing steps");
  return { valid: errors.length === 0, errors };
}

async function saveRecipeToDatabase(data: any): Promise<{ id: string }> {
  // 实际的数据库保存逻辑
  return { id: "recipe_123" };
}
