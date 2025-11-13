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
import { MCPTimeoutError, MCPNetworkError } from '../utils/errors';
import { DEFAULT_TIMEOUTS } from '../config/timeouts';

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Search failed: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const result = await response.json();
      return result as SearchResult;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Search request timed out after 2 minutes', {
          cause: { type: 'TIMEOUT', duration: 120000 }
        } as any);
      }

      throw error;
    }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout for streaming

    try {
      const response = await fetch(`${this.baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Search stream failed: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const streamTimeout = setTimeout(() => {
        reader.cancel();
      }, 300000); // 5 minutes stream timeout

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
              // Skip invalid JSON lines, but continue processing
              console.warn('[MCP] Invalid JSON line in stream:', line);
            }
          }
        }
      } finally {
        clearTimeout(streamTimeout);
        reader.releaseLock();
      }
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Search stream request timed out after 3 minutes', {
          cause: { type: 'TIMEOUT', duration: 180000 }
        } as any);
      }

      throw error;
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout for chat

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Chat failed: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const streamTimeout = setTimeout(() => {
        reader.cancel();
      }, 300000); // 5 minutes stream timeout

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
              // Skip invalid JSON lines, but continue processing
              console.warn('[MCP] Invalid JSON line in chat stream:', line);
            }
          }
        }
      } finally {
        clearTimeout(streamTimeout);
        reader.releaseLock();
      }
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Chat request timed out after 3 minutes', {
          cause: { type: 'TIMEOUT', duration: 180000 }
        } as any);
      }

      throw error;
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 1.5 minutes timeout for image search

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Image search failed: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const result = await response.json();
      return result as ImageResult;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Image search request timed out after 1.5 minutes', {
          cause: { type: 'TIMEOUT', duration: 90000 }
        } as any);
      }

      throw error;
    }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 1.5 minutes timeout for video search

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Video search failed: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const result = await response.json();
      return result as VideoResult;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Video search request timed out after 1.5 minutes', {
          cause: { type: 'TIMEOUT', duration: 90000 }
        } as any);
      }

      throw error;
    }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout for models

    try {
      const response = await fetch(`${this.baseUrl}/api/models`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Failed to get models: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const result = await response.json();
      return result as any;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Get models request timed out after 30 seconds', {
          cause: { type: 'TIMEOUT', duration: 30000 }
        } as any);
      }

      throw error;
    }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout for config

    try {
      const response = await fetch(`${this.baseUrl}/api/config`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetails: any;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }
        throw new Error(`Failed to get config: ${errorDetails.message || response.statusText}`, {
          cause: { status: response.status, details: errorDetails }
        } as any);
      }

      const result = await response.json();
      return result as any;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        throw new Error('Get config request timed out after 30 seconds', {
          cause: { type: 'TIMEOUT', duration: 30000 }
        } as any);
      }

      throw error;
    }
  }
}

/**
 * Default API instance
 * Can be used directly in code mode
 */
export const perplexica = new PerplexicaAPI();

