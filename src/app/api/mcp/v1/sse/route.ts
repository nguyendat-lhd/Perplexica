/**
 * MCP Server-Sent Events (SSE) Endpoint
 * 
 * This endpoint implements the MCP Streamable HTTP transport specification.
 * It handles both SSE streaming (GET) and message posting (POST).
 * 
 * Compatible with MCP clients like Cursor that support HTTP/SSE transport.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerplexicaMCPServer } from '@/mcp/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize MCP server instance (shared across requests)
let mcpServerInstance: PerplexicaMCPServer | null = null;
let transportInstance: StreamableHTTPServerTransport | null = null;

function getMCPServer(): PerplexicaMCPServer {
  if (!mcpServerInstance) {
    mcpServerInstance = new PerplexicaMCPServer({
      name: 'perplexica-mcp-server',
      version: '1.0.0',
      codeModeEnabled: true,
      baseUrl: process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000',
    });
  }
  return mcpServerInstance;
}

function getTransport(): StreamableHTTPServerTransport {
  if (!transportInstance) {
    const server = getMCPServer().getServer();
    transportInstance = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: false, // Use SSE streaming
      allowedHosts: process.env.MCP_ALLOWED_HOSTS?.split(',') || undefined,
      allowedOrigins: process.env.MCP_ALLOWED_ORIGINS?.split(',') || undefined,
      enableDnsRebindingProtection: !!(
        process.env.MCP_ALLOWED_HOSTS || process.env.MCP_ALLOWED_ORIGINS
      ),
    });
    
    // Connect server to transport
    server.connect(transportInstance).catch((error) => {
      console.error('Failed to connect MCP server to transport:', error);
    });
  }
  return transportInstance;
}

/**
 * GET /api/mcp/v1/sse
 * Handle SSE connection for MCP protocol
 */
export async function GET(req: NextRequest) {
  try {
    const transport = getTransport();
    
    // Convert NextRequest to Node.js IncomingMessage-like object
    // Note: Next.js doesn't expose raw Node.js request/response objects
    // We need to use a workaround with Response streaming
    
    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create a mock response object that implements the necessary methods
          const mockRes = {
            writeHead: (status: number, headers: Record<string, string>) => {
              // Headers will be set via NextResponse
            },
            write: (chunk: string) => {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(chunk));
            },
            end: () => {
              controller.close();
            },
            on: () => {}, // Event listeners not needed
            once: () => {},
            removeListener: () => {},
            setHeader: () => {},
            getHeader: () => undefined,
            removeHeader: () => {},
            headersSent: false,
          };

          // Handle the SSE connection
          await transport.handleRequest(
            req as any, // NextRequest should be compatible enough
            mockRes as any,
            undefined, // No body for GET requests
          );
        } catch (error: any) {
          console.error('SSE handler error:', error);
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error: any) {
    console.error('GET /api/mcp/v1/sse error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mcp/v1/sse
 * Handle MCP message posting
 */
export async function POST(req: NextRequest) {
  try {
    const transport = getTransport();
    const body = await req.text();

    // Create a mock response object
    const mockRes = {
      writeHead: (status: number, headers: Record<string, string>) => {},
      write: (chunk: string) => {},
      end: () => {},
      on: () => {},
      once: () => {},
      removeListener: () => {},
      setHeader: () => {},
      getHeader: () => undefined,
      removeHeader: () => {},
      headersSent: false,
      statusCode: 200,
    };

    // Parse body if it's JSON
    let parsedBody: any = undefined;
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    // Handle the POST request
    await transport.handleRequest(req as any, mockRes as any, parsedBody);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/mcp/v1/sse error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/mcp/v1/sse
 * Close MCP session
 */
export async function DELETE(req: NextRequest) {
  try {
    // Clean up session if needed
    // The transport will handle session cleanup via onsessionclosed callback
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/mcp/v1/sse error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

