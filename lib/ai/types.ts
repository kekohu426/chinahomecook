/**
 * AI Provider 类型定义
 *
 * 支持多个 AI 服务商的统一接口
 */

// AI Provider 配置
export interface AIProviderConfig {
  provider: "deepseek" | "openai";
  apiKey: string;
  baseURL?: string;
  model?: string;
}

// 聊天消息
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// 聊天完成选项
export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// 聊天响应
export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// AI Provider 接口
export interface AIProvider {
  /**
   * 聊天完成（非流式）
   */
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;

  /**
   * 流式聊天完成
   */
  chatStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse>;

  /**
   * 获取 Provider 名称
   */
  getName(): string;

  /**
   * 获取当前使用的模型
   */
  getModel(): string;
}

// 图片生成 Provider 接口
export interface ImageProvider {
  /**
   * 生成图片
   */
  generateImage(options: {
    prompt: string;
    width?: number;
    height?: number;
    style?: string;
  }): Promise<{
    url: string;
    base64?: string;
  }>;

  /**
   * 获取 Provider 名称
   */
  getName(): string;
}
