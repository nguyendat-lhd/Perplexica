import { NextResponse } from 'next/server';
import { getAvailableChatModelProviders } from '@/lib/providers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-bedrock
 * Test Bedrock model invocation
 */
export async function GET() {
  try {
    const chatModelProviders = await getAvailableChatModelProviders();
    const bedrockProvider = chatModelProviders['bedrock'];

    if (!bedrockProvider || Object.keys(bedrockProvider).length === 0) {
      return NextResponse.json(
        {
          error: 'No Bedrock models available',
          availableProviders: Object.keys(chatModelProviders),
        },
        { status: 404 },
      );
    }

    // Get the APAC model
    const modelKey = 'apac.anthropic.claude-sonnet-4-20250514-v1:0';
    const model = bedrockProvider[modelKey];

    if (!model) {
      return NextResponse.json(
        {
          error: `Model ${modelKey} not found`,
          availableModels: Object.keys(bedrockProvider),
        },
        { status: 404 },
      );
    }

    // Test invocation
    try {
      const response = await model.model.invoke('Say hello in one sentence.');
      
      return NextResponse.json({
        success: true,
        model: modelKey,
        displayName: model.displayName,
        response: response.content,
        message: 'Bedrock model is working correctly!',
      });
    } catch (invokeError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model invocation failed',
          message: invokeError.message,
          stack: invokeError.stack,
          model: modelKey,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to test Bedrock',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}

