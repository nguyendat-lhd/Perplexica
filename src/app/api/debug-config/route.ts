import { NextResponse } from 'next/server';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
  getGeminiApiKey,
} from '@/lib/config';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customOpenaiApiKey = getCustomOpenaiApiKey();
    const customOpenaiApiUrl = getCustomOpenaiApiUrl();
    const customOpenaiModelName = getCustomOpenaiModelName();
    const geminiApiKey = getGeminiApiKey();

    let chatProviders: any = {};
    let embeddingProviders: any = {};
    let providersError = null;

    try {
      chatProviders = await getAvailableChatModelProviders();
      embeddingProviders = await getAvailableEmbeddingModelProviders();
    } catch (err: any) {
      providersError = err.message || String(err);
    }

    return NextResponse.json({
      config: {
        customOpenaiConfigured: !!(
          customOpenaiApiKey &&
          customOpenaiApiUrl &&
          customOpenaiModelName
        ),
        customOpenaiApiUrl: customOpenaiApiUrl ? 'SET' : 'NOT SET',
        customOpenaiApiKey: customOpenaiApiKey ? 'SET' : 'NOT SET',
        customOpenaiModelName: customOpenaiModelName || 'NOT SET',
        geminiApiKey: geminiApiKey ? 'SET' : 'NOT SET',
      },
      availableProviders: {
        chat: Object.keys(chatProviders),
        embedding: Object.keys(embeddingProviders),
      },
      chatModels: Object.entries(chatProviders).reduce(
        (acc, [provider, models]) => {
          acc[provider] = Object.keys(models as any);
          return acc;
        },
        {} as Record<string, string[]>,
      ),
      embeddingModels: Object.entries(embeddingProviders).reduce(
        (acc, [provider, models]) => {
          acc[provider] = Object.keys(models as any);
          return acc;
        },
        {} as Record<string, string[]>,
      ),
      providersError,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || String(error),
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}





