/**
 * POST /api/mcp/execute-code
 * Execute code in Code Mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeCode } from '@/mcp/code-mode/executor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

