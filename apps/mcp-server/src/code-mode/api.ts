/**
 * TypeScript API Wrapper for Code Mode
 * 
 * This file exposes Perplexica's functionality as a TypeScript API
 * that LLMs can use by writing code, rather than calling tools directly.
 * 
 * Based on Cloudflare's Code Mode approach:
 * https://blog.cloudflare.com/code-mode/
 */

import type {
  SearchParams,
  SearchResult,
  ChatParams,
  ImageSearchParams,
  ImageResult,
  VideoSearchParams,
  VideoResult,
} from '../types/index';

/**
 * Perplexica API Client
 * 
 * This class provides a TypeScript API interface to Perplexica's capabilities.
 * LLMs can write code that uses this API instead of calling MCP tools directly.
 */
export class PerplexicaAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Perform an AI-powered search
   * 
   * @example
   * const api = new PerplexicaAPI();
   * const result = await api.search({
   *   query: "What is Perplexica?",
   *   focusMode: "webSearch"
   * });
   * console.log(result.message);
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        focusMode: params.focusMode,
        optimizationMode: params.optimizationMode || 'balanced',
        chatModel: params.chatModel,
        embeddingModel: params.embeddingModel,
        history: params.history || [],
        systemInstructions: params.systemInstructions,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Search failed: ${(error as any)?.message || response.statusText}`);
    }

    return response.json() as any;
  }

  /**
   * Stream search results
   * 
   * @example
   * const api = new PerplexicaAPI();
   * for await (const chunk of api.searchStream({ query: "AI trends", focusMode: "webSearch" })) {
   *   if (chunk.type === 'response') {
   *     process.stdout.write(chunk.data);
   *   } else if (chunk.type === 'sources') {
   *     console.log('Sources:', chunk.data);
   *   }
   * }
   */
  async *searchStream(params: SearchParams): AsyncGenerator<{ type: string; data: any }> {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Search failed: ${(error as any)?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            yield data;
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Send a chat message
   * 
   * @example
   * const api = new PerplexicaAPI();
   * const stream = api.chat({
   *   message: {
   *     messageId: "msg-123",
   *     chatId: "chat-456",
   *     content: "Hello!"
   *   },
   *   focusMode: "webSearch"
   * });
   * 
   * for await (const event of stream) {
   *   if (event.type === 'message') {
   *     console.log(event.data);
   *   }
   * }
   */
  async *chat(params: ChatParams): AsyncGenerator<{ type: string; data: any; messageId?: string }> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Chat failed: ${(error as any)?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            yield data;
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Search for images
   * 
   * @example
   * const api = new PerplexicaAPI();
   * const result = await api.searchImages({
   *   query: "cute cats"
   * });
   * console.log(result.images);
   */
  async searchImages(params: ImageSearchParams): Promise<ImageResult> {
    const response = await fetch(`${this.baseUrl}/api/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        chatHistory: params.chatHistory || [],
        chatModel: params.chatModel,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Image search failed: ${(error as any)?.message || response.statusText}`);
    }

    return response.json() as any;
  }

  /**
   * Search for videos
   * 
   * @example
   * const api = new PerplexicaAPI();
   * const result = await api.searchVideos({
   *   query: "how to cook pasta"
   * });
   * console.log(result.videos);
   */
  async searchVideos(params: VideoSearchParams): Promise<VideoResult> {
    const response = await fetch(`${this.baseUrl}/api/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        chatHistory: params.chatHistory || [],
        chatModel: params.chatModel,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Video search failed: ${(error as any)?.message || response.statusText}`);
    }

    return response.json() as any;
  }

  /**
   * Get available models
   * 
   * @example
   * const api = new PerplexicaAPI();
   * const models = await api.getModels();
   * console.log(models.chatModelProviders);
   */
  async getModels(): Promise<{
    chatModelProviders: Record<string, any>;
    embeddingModelProviders: Record<string, any>;
  }> {
    const response = await fetch(`${this.baseUrl}/api/models`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get models: ${(error as any)?.message || response.statusText}`);
    }

    return response.json() as any;
  }

  /**
   * Get configuration
   * 
   * @example
   * const api = new PerplexicaAPI();
   * const config = await api.getConfig();
   * console.log(config.chatModelProviders);
   */
  async getConfig(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/config`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get config: ${(error as any)?.message || response.statusText}`);
    }

    return response.json() as any;
  }
}

/**
 * Default API instance
 * Can be used directly in code mode
 */
export const perplexica = new PerplexicaAPI();

