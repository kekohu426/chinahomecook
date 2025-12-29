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
  timeoutMs?: number;
  retries?: number;
}

interface EvolinkImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class EvolinkClient {
  private apiKey: string;
  private apiUrl: string;
  private defaultTimeoutMs = 20000;
  private defaultRetries = 1;

  constructor() {
    this.apiKey = process.env.EVOLINK_API_KEY || "";
    this.apiUrl = process.env.EVOLINK_API_URL || "https://api.evolink.ai/v1";

    if (!this.apiKey) {
      throw new Error("EVOLINK_API_KEY is not configured");
    }
  }

  /**
   * 生成图片
   */
  async generateImage(request: EvolinkImageRequest): Promise<EvolinkImageResponse> {
    const retries = request.retries ?? this.defaultRetries;
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    let lastError = "图片生成失败";

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.apiUrl}/images/generations`,
          {
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
          },
          timeoutMs
        );

        if (!response.ok) {
          let errorMessage = `图片生成失败（HTTP ${response.status}）`;
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || errorMessage;
          } catch {
            // Ignore json parse error
          }
          lastError = errorMessage;
          continue;
        }

        const data = await response.json();
        console.log("Evolink Response Data:", JSON.stringify(data, null, 2));

        // 1. 尝试直接获取 URL (同步返回)
        let imageUrl = data.data?.[0]?.url || data.url || data.image_url;

        // 2. 如果没有 URL，但有 task_id，则进行轮询 (异步返回)
        const taskId = data.id || data.task_id;
        if (!imageUrl && taskId) {
          console.log(`Evolink 任务已创建，ID: ${taskId}，开始轮询...`);
          imageUrl = await this.pollTaskResult(taskId, timeoutMs);
        }

        // 3. 检查 results 数组 (直接返回的情况)
        if (!imageUrl && data.results && Array.isArray(data.results) && data.results.length > 0) {
          imageUrl = data.results[0];
        }

        if (!imageUrl) {
          lastError = "未获取到图片 URL";
          continue;
        }

        return {
          success: true,
          imageUrl,
        };
      } catch (error) {
        const name = (error as { name?: string } | null)?.name;
        const message = (error as { message?: string } | null)?.message;

        if (name === "AbortError" || /abort/i.test(message || "") || message === "") {
          lastError = "请求超时";
        } else if (message) {
          lastError = message;
        } else {
          lastError = "图片生成失败";
        }
        console.error("Evolink API 调用失败:", error);
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * 轮询任务结果
   */
  private async pollTaskResult(taskId: string, timeoutMs: number): Promise<string | null> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1秒轮询一次

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(`${this.apiUrl}/tasks/${taskId}`, {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          console.warn(`轮询任务失败: HTTP ${response.status}`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }

        const data = await response.json();
        console.log(`任务 ${taskId} 状态: ${data.status}`);

        if (data.status === "completed" || data.status === "succeeded") {
          // 优先检查 results 数组
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            return data.results[0];
          }
          // 其次检查 data 数组 (标准 OpenAI 格式)
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            return data.data[0].url;
          }
          return null;
        } else if (data.status === "failed") {
          console.error(`任务 ${taskId} 失败:`, data.error);
          return null;
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (e) {
        console.error("轮询出错:", e);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    console.error(`任务 ${taskId} 轮询超时`);
    return null;
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

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("请求超时");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

// 单例导出
export const evolinkClient = new EvolinkClient();
