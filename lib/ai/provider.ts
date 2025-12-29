/**
 * AI Provider 工厂
 *
 * 根据环境变量自动选择和配置 AI Provider
 */

import { DeepSeekProvider } from "./deepseek";
import { OpenAIProvider } from "./openai";
import { GLMProvider } from "./glm";
import type { AIProvider } from "./types";

/**
 * 获取文本生成 AI Provider
 *
 * 根据环境变量 AI_TEXT_PROVIDER 自动选择：
 * - "glm" → 智谱AI (推荐用于菜谱生成)
 * - "deepseek" → DeepSeek API
 * - "openai" → OpenAI API
 *
 * @throws {Error} 如果未配置 API Key 或 Provider
 */
export function getTextProvider(): AIProvider {
  const provider = process.env.AI_TEXT_PROVIDER || "glm";

  switch (provider.toLowerCase()) {
    case "glm": {
      const apiKey = process.env.GLM_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GLM_API_KEY 未配置。请在 .env 文件中设置 GLM_API_KEY"
        );
      }
      return new GLMProvider({
        apiKey,
        baseURL: process.env.GLM_API_URL,
        model: process.env.GLM_MODEL || "glm-4-flash",
      });
    }

    case "deepseek": {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error(
          "DEEPSEEK_API_KEY 未配置。请在 .env 文件中设置 DEEPSEEK_API_KEY"
        );
      }
      return new DeepSeekProvider({
        apiKey,
        baseURL: process.env.DEEPSEEK_API_URL,
        model: process.env.DEEPSEEK_MODEL,
      });
    }

    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "OPENAI_API_KEY 未配置。请在 .env 文件中设置 OPENAI_API_KEY"
        );
      }
      return new OpenAIProvider({
        apiKey,
        model: process.env.OPENAI_MODEL,
      });
    }

    default:
      throw new Error(
        `不支持的 AI Provider: ${provider}。支持的选项：glm, deepseek, openai`
      );
  }
}

/**
 * 简化的聊天接口
 *
 * 使用默认配置快速调用 AI
 */
export async function chat(
  prompt: string,
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const provider = getTextProvider();

  const messages = [];

  if (options?.systemPrompt) {
    messages.push({
      role: "system" as const,
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: "user" as const,
    content: prompt,
  });

  const response = await provider.chat({
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });

  return response.content;
}

/**
 * 流式聊天接口
 *
 * 实时返回 AI 生成的内容
 */
export async function chatStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const provider = getTextProvider();

  const messages = [];

  if (options?.systemPrompt) {
    messages.push({
      role: "system" as const,
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: "user" as const,
    content: prompt,
  });

  const response = await provider.chatStream(
    {
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    },
    onChunk
  );

  return response.content;
}
