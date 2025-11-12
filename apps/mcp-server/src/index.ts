#!/usr/bin/env node
/**
 * MCP Server Entry Point
 * 
 * Run this file to start the Perplexica MCP server
 * 
 * Usage:
 *   node src/mcp/server.js
 *   or
 *   npm run mcp:server
 */

import { PerplexicaMCPServer } from './server';

const server = new PerplexicaMCPServer({
  name: 'perplexica-mcp-server',
  version: '1.0.0',
  codeModeEnabled: true,
  baseUrl: process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000',
});

server.start().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});


