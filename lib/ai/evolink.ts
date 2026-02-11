/**
 * Evolink 图像生成 API 客户端
 *
 * 文档：https://kie.ai/zh-CN/z-image
 *
 * 配置优先级：
 * 1. 数据库 AIConfig 表 (imageApiKey, imageBaseUrl)
 * 2. 环境变量 (EVOLINK_API_KEY, EVOLINK_API_URL)
 */

import { prisma } from "@/lib/db/prisma";
import { AIGenerationLogger, calculateCost } from "./generation-logger";

interface EvolinkImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  timeoutMs?: number;
  retries?: number;
  // 日志相关
  logger?: AIGenerationLogger;
  stepName?: string;
}

interface EvolinkImageResponse {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
}

interface ImageConfig {
  provider?: string;
  apiKey: string;
  apiUrl: string;
  model?: string;
  defaultNegativePrompt?: string;
}

// 缓存配置，避免每次请求都查询数据库
let cachedConfig: ImageConfig | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1分钟缓存

/**
 * 从数据库获取图像生成配置
 */
async function getImageConfig(): Promise<ImageConfig> {
  const now = Date.now();

  // 使用缓存
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { id: "default" },
      select: {
        imageProvider: true,
        imageApiKey: true,
        imageBaseUrl: true,
        imageModel: true,
        imageNegativePrompt: true,
      },
    });

    // 优先使用数据库配置，否则回退到环境变量
    const provider =
      (aiConfig?.imageProvider || process.env.AI_IMAGE_PROVIDER || "evolink").toLowerCase();
    const defaultApiUrl =
      provider === "kie" ? "https://api.kie.ai" : "https://api.evolink.ai/v1";
    const rawApiUrl =
      aiConfig?.imageBaseUrl ||
      (provider === "kie" ? process.env.KIE_API_URL : process.env.EVOLINK_API_URL) ||
      defaultApiUrl;

    const config: ImageConfig = {
      provider,
      apiKey: aiConfig?.imageApiKey || (provider === "kie" ? process.env.KIE_API_KEY : process.env.EVOLINK_API_KEY) || "",
      apiUrl: provider === "kie" ? normalizeKieBaseUrl(rawApiUrl) : normalizeBaseUrl(rawApiUrl),
      model: aiConfig?.imageModel || "z-image",
      defaultNegativePrompt: aiConfig?.imageNegativePrompt || undefined,
    };

    cachedConfig = config;
    configCacheTime = now;

    return config;
  } catch (error) {
    console.error("获取图像配置失败，使用环境变量:", error);

    // 数据库查询失败时回退到环境变量
    const provider = (process.env.AI_IMAGE_PROVIDER || "evolink").toLowerCase();
    const defaultApiUrl =
      provider === "kie" ? "https://api.kie.ai" : "https://api.evolink.ai/v1";
    return {
      provider,
      apiKey: (provider === "kie" ? process.env.KIE_API_KEY : process.env.EVOLINK_API_KEY) || "",
      apiUrl: provider === "kie"
        ? normalizeKieBaseUrl(process.env.KIE_API_URL || defaultApiUrl)
        : normalizeBaseUrl(process.env.EVOLINK_API_URL || defaultApiUrl),
      model: "z-image",
    };
  }
}

/**
 * 清除配置缓存（用于配置更新后）
 */

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/\/+$/, "");
}

function normalizeKieBaseUrl(url: string): string {
  let base = normalizeBaseUrl(url);
  base = base.replace(/\/api\/v1$/i, "");
  base = base.replace(/\/v1$/i, "");
  return base;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl);
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function getAspectRatio(width?: number, height?: number): string {
  if (!width || !height) return "1:1";
  const ratio = width / height;
  const candidates: Array<{ label: string; value: number }> = [
    { label: "21:9", value: 21 / 9 },
    { label: "16:9", value: 16 / 9 },
    { label: "4:3", value: 4 / 3 },
    { label: "1:1", value: 1 },
    { label: "3:4", value: 3 / 4 },
    { label: "9:16", value: 9 / 16 },
  ];
  let best = candidates[0];
  let bestDiff = Math.abs(ratio - best.value);
  for (const candidate of candidates.slice(1)) {
    const diff = Math.abs(ratio - candidate.value);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best.label;
}

export function clearImageConfigCache(): void {
  cachedConfig = null;
  configCacheTime = 0;
}

export class EvolinkClient {
  private defaultTimeoutMs = 20000;
  private defaultRetries = 1;

  /**
   * 生成图片
   */
  async generateImage(request: EvolinkImageRequest): Promise<EvolinkImageResponse> {
    const retries = request.retries ?? this.defaultRetries;
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    const startTime = Date.now();
    let lastError = "图片生成失败";

    // 获取配置（优先数据库，回退环境变量）
    const config = await getImageConfig();
    const provider = (config.provider || "evolink").toLowerCase();
    const modelName = config.model || "z-image";

    if (!config.apiKey) {
      const error = "图像生成 API Key 未配置，请在管理后台 AI 配置中设置，或配置 EVOLINK_API_KEY 环境变量";
      // 记录失败日志
      if (request.logger) {
        request.logger.logFailure(
          request.stepName || "image_generation",
          modelName,
          new Error(error),
          {
            prompt: request.prompt.substring(0, 500),
            parameters: { width: request.width, height: request.height },
            provider,
            durationMs: Date.now() - startTime,
          }
        );
      }
      return {
        success: false,
        error,
      };
    }

    if (provider === "kie") {
      return this.generateImageWithKie(request, config, modelName, timeoutMs, retries, startTime);
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          `${config.apiUrl}/images/generations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model || "z-image",
              prompt: request.prompt,
              negative_prompt: request.negativePrompt || config.defaultNegativePrompt || "",
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
        let imageBase64 =
          data.data?.[0]?.b64_json ||
          data.data?.[0]?.b64 ||
          data.image_base64 ||
          data.b64_json;

        // 2. 如果没有 URL，但有 task_id，则进行轮询 (异步返回)
        const taskId = data.id || data.task_id;
        if (!imageUrl && !imageBase64 && taskId) {
          console.log(`Evolink 任务已创建，ID: ${taskId}，开始轮询...`);
          const polledUrl = await this.pollTaskResult(taskId, timeoutMs, config);
          if (polledUrl) {
            imageUrl = polledUrl;
          } else {
            console.error(`❌ 轮询任务 ${taskId} 失败，未获取到图片 URL`);
            lastError = "轮询任务失败，未获取到图片 URL";
            continue;
          }
        }

        // 3. 检查 results 数组 (直接返回的情况)
        if (!imageUrl && data.results && Array.isArray(data.results) && data.results.length > 0) {
          imageUrl = data.results[0];
        }

        if (!imageUrl && !imageBase64) {
          console.error("❌ 未能从响应中提取图片 URL 或 Base64");
          console.error("响应数据结构:", {
            hasData: !!data.data,
            dataLength: Array.isArray(data.data) ? data.data.length : 0,
            hasUrl: !!data.url,
            hasImageUrl: !!data.image_url,
            hasTaskId: !!taskId,
            hasResults: !!data.results,
            resultsLength: Array.isArray(data.results) ? data.results.length : 0,
            topLevelKeys: Object.keys(data),
          });
          lastError = "未获取到图片 URL";
          continue;
        }

        // 记录成功日志
        if (request.logger) {
          const durationMs = Date.now() - startTime;
          request.logger.logSuccess(request.stepName || "image_generation", modelName, {
            prompt: request.prompt.substring(0, 500),
            parameters: {
              width: request.width || 1024,
              height: request.height || 1024,
              steps: request.steps || 20,
            },
            resultImages: imageUrl ? [imageUrl] : undefined,
            cost: calculateCost(modelName, {}),
            durationMs,
            provider,
            retryIndex: attempt,
          });
        }

        return {
          success: true,
          imageUrl,
          imageBase64,
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

    // 记录最终失败日志
    if (request.logger) {
      const durationMs = Date.now() - startTime;
      request.logger.logFailure(
        request.stepName || "image_generation",
        modelName,
        new Error(lastError),
        {
          prompt: request.prompt.substring(0, 500),
          parameters: {
            width: request.width || 1024,
            height: request.height || 1024,
          },
          durationMs,
          provider,
          retryIndex: retries,
        }
      );
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * 轮询任务结果
   */
  private async generateImageWithKie(
    request: EvolinkImageRequest,
    config: ImageConfig,
    modelName: string,
    timeoutMs: number,
    retries: number,
    startTime: number
  ): Promise<EvolinkImageResponse> {
    let lastError = "Image generation failed";

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const aspectRatio = getAspectRatio(request.width, request.height);
        const response = await this.fetchWithTimeout(
          joinUrl(config.apiUrl, "/api/v1/jobs/createTask"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              input: {
                prompt: request.prompt,
                negative_prompt: request.negativePrompt || config.defaultNegativePrompt || "",
                aspect_ratio: aspectRatio,
              },
            }),
          },
          timeoutMs
        );

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          // ignore parse errors
        }

        if (!response.ok) {
          lastError = data?.msg || data?.message || data?.error || `Image generation failed (HTTP ${response.status})`;
          continue;
        }

        if (data?.code && data.code !== 200) {
          lastError = data?.msg || `Image generation failed (code ${data.code})`;
          continue;
        }

        const taskId = data?.data?.taskId || data?.taskId;
        if (!taskId) {
          lastError = data?.msg || "Failed to get task ID";
          continue;
        }

        const polled = await this.pollKieTaskResult(taskId, timeoutMs, config);
        if (polled.imageUrl) {
          if (request.logger) {
            const durationMs = Date.now() - startTime;
            request.logger.logSuccess(request.stepName || "image_generation", modelName, {
              prompt: request.prompt.substring(0, 500),
              parameters: { aspect_ratio: aspectRatio },
              resultImages: [polled.imageUrl],
              cost: calculateCost(modelName, {}),
              durationMs,
              provider: "kie",
              retryIndex: attempt,
            });
          }
          return { success: true, imageUrl: polled.imageUrl };
        }

        lastError = polled.error || lastError;
      } catch (error) {
        const name = (error as { name?: string } | null)?.name;
        const message = (error as { message?: string } | null)?.message;
        if (name === "AbortError" || /abort/i.test(message || "") || message === "") {
          lastError = "Request timeout";
        } else if (message) {
          lastError = message;
        } else {
          lastError = "Image generation failed";
        }
      }
    }

    if (request.logger) {
      request.logger.logFailure(
        request.stepName || "image_generation",
        modelName,
        new Error(lastError),
        {
          prompt: request.prompt.substring(0, 500),
          parameters: { width: request.width, height: request.height },
          provider: "kie",
          durationMs: Date.now() - startTime,
        }
      );
    }

    return { success: false, error: lastError };
  }

  private async pollKieTaskResult(
    taskId: string,
    timeoutMs: number,
    config: ImageConfig
  ): Promise<{ imageUrl?: string; error?: string }> {
    const pollInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await this.fetchWithTimeout(
          joinUrl(config.apiUrl, `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`),
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${config.apiKey}`,
            },
          },
          Math.min(10000, timeoutMs)
        );

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          // ignore parse errors
        }

        if (!response.ok) {
          const errorMessage = data?.msg || data?.message || data?.error || `Poll failed (HTTP ${response.status})`;
          return { error: errorMessage };
        }

        if (data?.code && data.code !== 200) {
          return { error: data?.msg || `Poll failed (code ${data.code})` };
        }

        const state = data?.data?.state;
        if (state === "success") {
          const resultJson = data?.data?.resultJson;
          let imageUrl: string | undefined;

          if (typeof resultJson === "string") {
            try {
              const parsed = JSON.parse(resultJson);
              imageUrl = parsed?.resultUrls?.[0] || parsed?.results?.[0];
            } catch {
              // ignore parse errors
            }
          } else if (resultJson && typeof resultJson === "object") {
            imageUrl = (resultJson as any)?.resultUrls?.[0] || (resultJson as any)?.results?.[0];
          }

          if (!imageUrl) {
            imageUrl = data?.data?.resultUrl;
          }

          if (imageUrl) {
            return { imageUrl };
          }

          return { error: "Failed to extract image URL" };
        }

        if (state === "fail") {
          return { error: data?.data?.failMsg || "Image generation failed" };
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        const message = (error as { message?: string } | null)?.message;
        return { error: message || "Poll request failed" };
      }
    }

    return { error: "Request timeout" };
  }

  private async pollTaskResult(taskId: string, timeoutMs: number, config: ImageConfig): Promise<string | null> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1秒轮询一次

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(`${config.apiUrl}/tasks/${taskId}`, {
          headers: {
            "Authorization": `Bearer ${config.apiKey}`,
          },
        });

        if (!response.ok) {
          console.warn(`轮询任务失败: HTTP ${response.status}`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }

        const data = await response.json();
        console.log(`任务 ${taskId} 状态: ${data.status}`);
        console.log(`任务 ${taskId} 完整响应:`, JSON.stringify(data, null, 2));

        if (data.status === "completed" || data.status === "succeeded") {
          // 优先检查 results 数组
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log(`✅ 从 results 数组获取到图片 URL: ${data.results[0]}`);
            return data.results[0];
          }
          // 其次检查 data 数组 (标准 OpenAI 格式)
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const url = data.data[0].url || data.data[0].image_url;
            if (url) {
              console.log(`✅ 从 data 数组获取到图片 URL: ${url}`);
              return url;
            }
          }
          // 检查顶层 URL 字段
          if (data.url || data.image_url) {
            const url = data.url || data.image_url;
            console.log(`✅ 从顶层字段获取到图片 URL: ${url}`);
            return url;
          }

          console.error(`❌ 任务 ${taskId} 已完成，但未找到图片 URL`);
          console.error("响应数据结构:", {
            hasResults: !!data.results,
            resultsLength: Array.isArray(data.results) ? data.results.length : 0,
            hasData: !!data.data,
            dataLength: Array.isArray(data.data) ? data.data.length : 0,
            hasUrl: !!data.url,
            hasImageUrl: !!data.image_url,
            topLevelKeys: Object.keys(data),
          });
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
