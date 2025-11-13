/**
 * MCP Server Implementation for Perplexica
 * 
 * This server exposes Perplexica's functionality via MCP protocol.
 * Supports both traditional tool calling and Code Mode.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools } from './tools/index';
import { PerplexicaAPI } from './code-mode/api';
import { searchTools } from './code-mode/filesystem-discovery';
import type {
  SearchParams,
  ChatParams,
  ImageSearchParams,
  VideoSearchParams,
} from './types/index';

export class PerplexicaMCPServer {
  private server: Server;
  private api: PerplexicaAPI;
  private codeModeEnabled: boolean;

  constructor(options: {
    name?: string;
    version?: string;
    codeModeEnabled?: boolean;
    baseUrl?: string;
  } = {}) {
    this.codeModeEnabled = options.codeModeEnabled ?? true;
    this.api = new PerplexicaAPI(options.baseUrl);

    this.server = new Server(
      {
        name: options.name || 'perplexica-mcp-server',
        version: options.version || '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: allTools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'web_search':
            return await this.handleWebSearch(args as unknown as { query: string });

          case 'perplexica_search':
            return await this.handleSearch(args as unknown as SearchParams);

          case 'perplexica_chat':
            return await this.handleChat(args as unknown as ChatParams);

          case 'perplexica_search_images':
            return await this.handleImageSearch(args as unknown as ImageSearchParams);

          case 'perplexica_search_videos':
            return await this.handleVideoSearch(args as unknown as VideoSearchParams);

          case 'perplexica_get_models':
            return await this.handleGetModels();

          case 'perplexica_get_config':
            return await this.handleGetConfig();

          case 'perplexica_search_tools':
            return await this.handleSearchTools(args as unknown as { query: string; detailLevel?: 'name' | 'summary' | 'full' });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
      console.error('[MCP] Tool execution error:', {
        tool: name,
        error: error.message,
        stack: error.stack,
        cause: error.cause
      });

      // Enhanced error response with structured information
      let errorMessage = error.message || 'Unknown error';
      let errorDetails = {};

      if (error.cause) {
        if (error.cause.type === 'TIMEOUT') {
          errorMessage = `Request timed out after ${error.cause.duration / 1000} seconds`;
        }
        if (error.cause.status) {
          errorDetails = {
            statusCode: error.cause.status,
            details: error.cause.details
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
          ...(Object.keys(errorDetails).length > 0 ? [{
            type: 'text',
            text: `\nDetails: ${JSON.stringify(errorDetails, null, 2)}`
          }] : [])
        ],
        isError: true,
      };
    }
    });

    // List resources (if needed)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [],
      };
    });

    // Read resource (if needed)
    this.server.setRequestHandler(ReadResourceRequestSchema, async () => {
      throw new Error('Resources not implemented');
    });
  }

  private async handleWebSearch(params: { query: string }) {
    // Convert simple web search params to full search params
    const searchParams: SearchParams = {
      query: params.query,
      focusMode: 'webSearch',
      optimizationMode: 'balanced',
    };

    const result = await this.api.search(searchParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: result.message,
            sources: result.sources,
          }, null, 2),
        },
      ],
    };
  }

  private async handleSearch(params: SearchParams) {
    const result = await this.api.search(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: result.message,
            sources: result.sources,
          }, null, 2),
        },
      ],
    };
  }

  private async handleChat(params: ChatParams) {
    const chunks: string[] = [];
    for await (const event of this.api.chat(params)) {
      if (event.type === 'message') {
        chunks.push(event.data);
      }
    }
    return {
      content: [
        {
          type: 'text',
          text: chunks.join(''),
        },
      ],
    };
  }

  private async handleImageSearch(params: ImageSearchParams) {
    const result = await this.api.searchImages(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleVideoSearch(params: VideoSearchParams) {
    const result = await this.api.searchVideos(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetModels() {
    const models = await this.api.getModels();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(models, null, 2),
        },
      ],
    };
  }

  private async handleGetConfig() {
    const config = await this.api.getConfig();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }

  private async handleSearchTools(params: { query: string; detailLevel?: 'name' | 'summary' | 'full' }) {
    const results = searchTools(params.query, params.detailLevel || 'summary');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: params.query,
            detailLevel: params.detailLevel || 'summary',
            results: results,
            count: results.length,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Get TypeScript API code for Code Mode
   * This returns the API wrapper code that LLMs can use
   */
  getCodeModeAPI(): string {
    const baseUrl = (this.api as any).baseUrl || 'http://localhost:3000';
    return `
import { PerplexicaAPI } from './api';

// Create API instance
const api = new PerplexicaAPI('${baseUrl}');

// Available methods:
// - api.search(params): Perform AI-powered search
// - api.searchStream(params): Stream search results
// - api.chat(params): Send chat message
// - api.searchImages(params): Search for images
// - api.searchVideos(params): Search for videos
// - api.getModels(): Get available models
// - api.getConfig(): Get configuration

// Example usage:
// const result = await api.search({
//   query: "What is Perplexica?",
//   focusMode: "webSearch"
// });
// console.log(result.message);
`;
  }

  /**
   * Start the MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Perplexica MCP Server started');
  }

  /**
   * Get the server instance
   */
  getServer(): Server {
    return this.server;
  }
}

