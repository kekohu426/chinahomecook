/**
 * 智谱AI (GLM) Provider 实现
 *
 * 使用智谱AI API 进行文本生成（用于菜谱生成）
 * 文档：https://open.bigmodel.cn/dev/api
 */

import { ProxyAgent, fetch as undiciFetch } from "undici";
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
} from "./types";

// 获取代理配置
function getProxyDispatcher() {
  // 优先使用完整 URL，其次使用端口号构建
  let proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

  // 如果没有完整 URL，但有端口号配置，则自动构建
  if (!proxyUrl && process.env.PROXY_PORT) {
    proxyUrl = `http://127.0.0.1:${process.env.PROXY_PORT}`;
  }

  console.log("[GLM] 代理配置:", proxyUrl || "无代理");
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

export class GLMProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: {
    apiKey: string;
    baseURL?: string;
    model?: string;
  }) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://open.bigmodel.cn/api/paas/v4";
    this.model = config.model || "glm-4-flash"; // 默认使用 glm-4-flash（快速模型）
  }

  getName(): string {
    return "GLM (智谱AI)";
  }

  getModel(): string {
    return this.model;
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const dispatcher = getProxyDispatcher();
    const response = await undiciFetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: false,
      }),
      ...(dispatcher ? { dispatcher } : {}),
    } as any);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GLM API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async chatStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse> {
    const dispatcher = getProxyDispatcher();
    const response = await undiciFetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: true,
      }),
      ...(dispatcher ? { dispatcher } : {}),
    } as any);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GLM API Error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let totalTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                onChunk(content);
              }

              // 收集 token 使用情况
              if (parsed.usage) {
                totalTokens = parsed.usage.total_tokens;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      usage: totalTokens
        ? {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens,
          }
        : undefined,
    };
  }
}
