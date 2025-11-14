#!/usr/bin/env node
/**
 * Standalone MCP HTTP Server
 * 
 * This server exposes Perplexica MCP functionality via HTTP/SSE.
 * It can be deployed separately and accessed by MCP clients like Cursor.
 * 
 * Usage:
 *   node src/mcp/http-server.js
 *   or
 *   npm run mcp:http-server
 * 
 * Environment variables:
 *   - PORT: Server port (default: 3001)
 *   - PERPLEXICA_BASE_URL: Base URL of Perplexica API (default: http://localhost:3000)
 *   - MCP_ALLOWED_HOSTS: Comma-separated list of allowed hosts
 *   - MCP_ALLOWED_ORIGINS: Comma-separated list of allowed origins
 */

import http from 'http';
import { PerplexicaMCPServer } from './server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

const PORT = parseInt(process.env.PORT || '3001', 10);
const BASE_URL = process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000';

// Store active sessions
const activeSessions = new Map<string, { server: PerplexicaMCPServer; transport: StreamableHTTPServerTransport }>();

// Create HTTP server
const httpServer = http.createServer(async (req, res) => {
  // Enable CORS
  const origin = req.headers.origin;
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(',') || ['*'];
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version');
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'perplexica-mcp-server' }));
    return;
  }

  // Only handle /v1/sse endpoint
  if (req.url !== '/v1/sse' && !req.url?.startsWith('/v1/sse')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    // Get or create session
    let session = sessionId ? activeSessions.get(sessionId) : undefined;
    
    if (!session) {
      // Create new MCP server instance for this session
      const mcpServer = new PerplexicaMCPServer({
        name: 'perplexica-mcp-server',
        version: '1.0.0',
        codeModeEnabled: true,
        baseUrl: BASE_URL,
      });

      // Create transport for this session
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: false,
        allowedHosts: process.env.MCP_ALLOWED_HOSTS?.split(',') || undefined,
        allowedOrigins: process.env.MCP_ALLOWED_ORIGINS?.split(',') || undefined,
        enableDnsRebindingProtection: !!(
          process.env.MCP_ALLOWED_HOSTS || process.env.MCP_ALLOWED_ORIGINS
        ),
        onsessioninitialized: (sid) => {
          console.log(`[MCP] Session initialized: ${sid}`);
          activeSessions.set(sid, { server: mcpServer, transport });
        },
        onsessionclosed: (sid) => {
          console.log(`[MCP] Session closed: ${sid}`);
          activeSessions.delete(sid);
        },
      });

      // Connect server to transport
      await mcpServer.getServer().connect(transport);
      
      session = { server: mcpServer, transport };
    }

    // Handle the request
    let body: any = undefined;
    
    if (req.method === 'POST' || req.method === 'DELETE') {
      // Read request body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyString = Buffer.concat(chunks).toString();
      
      if (bodyString) {
        try {
          body = JSON.parse(bodyString);
        } catch {
          body = bodyString;
        }
      }
    }

    // Handle request through transport
    await session.transport.handleRequest(req, res, body);
  } catch (error: any) {
    console.error('[MCP] Request error:', {
      error: error.message,
      stack: error.stack,
      cause: error.cause,
      url: req.url,
      method: req.method
    });

    if (!res.headersSent) {
      let statusCode = 500;
      let errorResponse = {
        error: error.message || 'Internal server error',
        type: 'INTERNAL_ERROR'
      };

      if (error.cause) {
        if (error.cause.type === 'TIMEOUT') {
          statusCode = 408; // Request Timeout
          errorResponse = {
            error: `Request timed out after ${error.cause.duration / 1000} seconds`,
            type: 'TIMEOUT',
            duration: error.cause.duration
          } as any;
        }
        if (error.cause.status) {
          statusCode = error.cause.status;
          (errorResponse as any).status = error.cause.status;
          (errorResponse as any).details = error.cause.details;
        }
      }

      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errorResponse));
    }
  }
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`[MCP] Perplexica MCP HTTP Server started`);
  console.log(`[MCP] Listening on http://localhost:${PORT}`);
  console.log(`[MCP] SSE endpoint: http://localhost:${PORT}/v1/sse`);
  console.log(`[MCP] Perplexica API: ${BASE_URL}`);
  console.log(`[MCP] Configure Cursor with: https://your-server.com/v1/sse`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('[MCP] SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[MCP] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[MCP] SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[MCP] Server closed');
    process.exit(0);
  });
});

