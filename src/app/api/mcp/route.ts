/**
 * MCP API Endpoint
 * 
 * Exposes MCP server functionality via HTTP API
 * This allows integration with MCP clients over HTTP
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerplexicaMCPServer } from '@/mcp/server';
import { executeCode, generateCodeModeTemplate } from '@/mcp/code-mode/executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize MCP server instance
const mcpServer = new PerplexicaMCPServer({
  name: 'perplexica-mcp-server',
  version: '1.0.0',
  codeModeEnabled: true,
  baseUrl: process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000',
});

/**
 * GET /api/mcp
 * Get MCP server information and Code Mode API
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    if (mode === 'code-mode-api') {
      // Return TypeScript API code for Code Mode
      return NextResponse.json({
        code: mcpServer.getCodeModeAPI(),
        template: generateCodeModeTemplate(),
      });
    }

    // Return server info
    return NextResponse.json({
      name: 'perplexica-mcp-server',
      version: '1.0.0',
      codeModeEnabled: true,
      tools: [
        'perplexica_search',
        'perplexica_chat',
        'perplexica_search_images',
        'perplexica_search_videos',
        'perplexica_get_models',
        'perplexica_get_config',
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mcp
 * Execute code in Code Mode (when action=execute-code)
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    if (action === 'execute-code') {
      const body = await req.json();
      const { code, apiBaseUrl } = body;

      if (!code) {
        return NextResponse.json(
          { error: 'Code is required' },
          { status: 400 },
        );
      }

      const result = await executeCode(
        code,
        apiBaseUrl || 'http://localhost:3000',
      );

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

