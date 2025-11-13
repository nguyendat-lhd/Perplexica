/**
 * MCP Tools for Perplexica
 * 
 * These tools expose Perplexica's functionality as MCP tools.
 * In Code Mode, these are converted to TypeScript API calls.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type {
  SearchParams,
  ChatParams,
  ImageSearchParams,
  VideoSearchParams,
} from '../types';



/**
 * Search tool - Perform AI-powered search
 */
export const searchTool: Tool = {
  name: 'perplexica_search',
  description: `Perform an AI-powered search using Perplexica. This is the main search tool that supports:

For basic web search: Just provide the query parameter (defaults to webSearch mode)

Advanced search options:
- webSearch: General web search (default)
- academicSearch: Academic papers and research
- writingAssistant: Writing assistance without web search
- wolframAlphaSearch: Mathematical and computational queries
- youtubeSearch: YouTube video search
- redditSearch: Reddit discussions and opinions

Optimization modes: speed, balanced (default), quality`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or question',
      },
      focusMode: {
        type: 'string',
        enum: ['webSearch', 'academicSearch', 'writingAssistant', 'wolframAlphaSearch', 'youtubeSearch', 'redditSearch'],
        description: 'The focus mode for the search',
      },
      optimizationMode: {
        type: 'string',
        enum: ['speed', 'balanced', 'quality'],
        description: 'Optimization mode: speed (fastest), balanced (default), quality (best results)',
        default: 'balanced',
      },
      chatModel: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          name: { type: 'string' },
        },
        description: 'Chat model to use (optional)',
      },
      embeddingModel: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          name: { type: 'string' },
        },
        description: 'Embedding model to use (optional)',
      },
      history: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 2,
        },
        description: 'Conversation history as array of [role, message] tuples',
      },
      systemInstructions: {
        type: 'string',
        description: 'Custom system instructions',
      },
    },
    required: ['query', 'focusMode'],
  },
};

/**
 * Chat tool - Send a chat message with history
 */
export const chatTool: Tool = {
  name: 'perplexica_chat',
  description: 'Send a chat message to Perplexica with conversation history and file attachments',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          chatId: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['messageId', 'chatId', 'content'],
      },
      focusMode: {
        type: 'string',
        enum: ['webSearch', 'academicSearch', 'writingAssistant', 'wolframAlphaSearch', 'youtubeSearch', 'redditSearch'],
        description: 'The focus mode for the chat',
      },
      optimizationMode: {
        type: 'string',
        enum: ['speed', 'balanced', 'quality'],
        default: 'balanced',
      },
      history: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 2,
        },
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file IDs to attach',
      },
      chatModel: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          name: { type: 'string' },
        },
      },
      embeddingModel: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          name: { type: 'string' },
        },
      },
      systemInstructions: {
        type: 'string',
      },
    },
    required: ['message', 'focusMode'],
  },
};

/**
 * Image search tool
 */
export const imageSearchTool: Tool = {
  name: 'perplexica_search_images',
  description: 'Search for images using AI-powered image search',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The image search query',
      },
      chatHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
      chatModel: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          model: { type: 'string' },
        },
      },
    },
    required: ['query'],
  },
};

/**
 * Video search tool
 */
export const videoSearchTool: Tool = {
  name: 'perplexica_search_videos',
  description: 'Search for videos using AI-powered video search',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The video search query',
      },
      chatHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
      chatModel: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          model: { type: 'string' },
        },
      },
    },
    required: ['query'],
  },
};

/**
 * Get models tool
 */
export const getModelsTool: Tool = {
  name: 'perplexica_get_models',
  description: 'Get list of available chat and embedding models',
  inputSchema: {
    type: 'object',
    properties: {
      includeProvider: {
        type: 'boolean',
        description: 'Include provider information in results',
        default: false,
      },
    },
  },
};

/**
 * Get config tool
 */
export const getConfigTool: Tool = {
  name: 'perplexica_get_config',
  description: 'Get current configuration including API keys status',
  inputSchema: {
    type: 'object',
    properties: {
      includeApiKeys: {
        type: 'boolean',
        description: 'Include API key status in results',
        default: false,
      },
      includeModels: {
        type: 'boolean',
        description: 'Include available models in results',
        default: false,
      },
    },
  },
};

/**
 * Search tools tool - Find tools by query (progressive disclosure)
 */
export const searchToolsTool: Tool = {
  name: 'perplexica_search_tools',
  description: `Search for available MCP tools by keyword. Supports progressive disclosure with detail levels:
- name: Return only tool names
- summary: Return names and short descriptions (default)
- full: Return full tool definitions with schemas

This enables on-demand tool loading, reducing token usage compared to loading all tool definitions upfront.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find matching tools (searches in tool names and descriptions)',
      },
      detailLevel: {
        type: 'string',
        enum: ['name', 'summary', 'full'],
        description: 'Level of detail to return: name (just names), summary (names + descriptions), full (complete definitions)',
        default: 'summary',
      },
    },
    required: ['query'],
  },
};

export const allTools = [
  searchTool,
  chatTool,
  imageSearchTool,
  videoSearchTool,
  getModelsTool,
  getConfigTool,
  searchToolsTool,
];


