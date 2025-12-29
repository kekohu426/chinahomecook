/**
 * Evolink 图像生成 API 客户端
 *
 * 文档：https://evolink.ai/zh/z-image-turbo
 */

interface EvolinkImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

interface EvolinkImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class EvolinkClient {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.EVOLINK_API_KEY || "";
    this.apiUrl = process.env.EVOLINK_API_URL || "https://evolink.ai/api/v1";

    if (!this.apiKey) {
      throw new Error("EVOLINK_API_KEY is not configured");
    }
  }

  /**
   * 生成图片
   */
  async generateImage(request: EvolinkImageRequest): Promise<EvolinkImageResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "z-image-turbo",
          prompt: request.prompt,
          negative_prompt: request.negativePrompt || "",
          width: request.width || 1024,
          height: request.height || 1024,
          steps: request.steps || 20,
          seed: request.seed,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "图片生成失败",
        };
      }

      const data = await response.json();

      // Evolink API 返回格式可能不同，需要根据实际 API 文档调整
      const imageUrl = data.data?.[0]?.url || data.url || data.image_url;

      if (!imageUrl) {
        return {
          success: false,
          error: "未获取到图片 URL",
        };
      }

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      console.error("Evolink API 调用失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "图片生成失败",
      };
    }
  }

  /**
   * 为食谱步骤生成提示词
   */
  generateRecipeImagePrompt(
    recipeName: string,
    stepDescription: string,
    style: string = "清新自然，美食摄影"
  ): string {
    return `${recipeName}制作过程，${stepDescription}，${style}，高质量，专业摄影，自然光，美食博客风格`;
  }
}

// 单例导出
export const evolinkClient = new EvolinkClient();
