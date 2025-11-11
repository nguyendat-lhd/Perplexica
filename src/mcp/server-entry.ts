/**
 * MCP Server Entry Point (Direct execution)
 * 
 * This file can be executed directly with tsx/node
 */

import { PerplexicaMCPServer } from './server.js';

// Log errors to stderr (MCP protocol requirement)
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const server = new PerplexicaMCPServer({
  name: 'perplexica-mcp-server',
  version: '1.0.0',
  codeModeEnabled: true,
  baseUrl: process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000',
});

server.start().catch((error) => {
  console.error('Failed to start MCP server:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

