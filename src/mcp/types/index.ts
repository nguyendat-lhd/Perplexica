/**
 * MCP Types for Perplexica
 */

export interface SearchParams {
  query: string;
  focusMode: 'webSearch' | 'academicSearch' | 'writingAssistant' | 'wolframAlphaSearch' | 'youtubeSearch' | 'redditSearch';
  optimizationMode?: 'speed' | 'balanced' | 'quality';
  chatModel?: {
    provider: string;
    name: string;
  };
  embeddingModel?: {
    provider: string;
    name: string;
  };
  history?: Array<[string, string]>;
  systemInstructions?: string;
  stream?: boolean;
}

export interface ChatParams {
  message: {
    messageId: string;
    chatId: string;
    content: string;
  };
  focusMode: string;
  optimizationMode?: 'speed' | 'balanced' | 'quality';
  history?: Array<[string, string]>;
  files?: string[];
  chatModel?: {
    provider: string;
    name: string;
  };
  embeddingModel?: {
    provider: string;
    name: string;
  };
  systemInstructions?: string;
}

export interface ImageSearchParams {
  query: string;
  chatHistory?: Array<{ role: string; content: string }>;
  chatModel?: {
    provider: string;
    model: string;
  };
}

export interface VideoSearchParams {
  query: string;
  chatHistory?: Array<{ role: string; content: string }>;
  chatModel?: {
    provider: string;
    model: string;
  };
}

export interface SearchResult {
  message: string;
  sources: Array<{
    pageContent: string;
    metadata: {
      title: string;
      url: string;
    };
  }>;
}

export interface ImageResult {
  images: Array<{
    url: string;
    title: string;
    thumbnail?: string;
  }>;
}

export interface VideoResult {
  videos: Array<{
    url: string;
    title: string;
    thumbnail?: string;
    duration?: string;
  }>;
}


