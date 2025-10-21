import { searchHandlers } from '../../../lib/search';
import { getAvailableChatModelProviders, getAvailableEmbeddingModelProviders } from '../../../lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '../../../lib/config';
import handleImageSearch from '../../../lib/chains/imageSearchAgent';
import handleVideoSearch from '../../../lib/chains/videoSearchAgent';

// Configure API route - Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (300 seconds)

interface ChatModel {
  provider: string;
  name: string;
  customOpenAIKey?: string;
  customOpenAIBaseURL?: string;
}

interface EmbeddingModel {
  provider: string;
  name: string;
}

interface AIAgentReviewBody {
  query: string;
  history: Array<[string, string]>;
  chatModel?: ChatModel;
  embeddingModel?: EmbeddingModel;
  includeImages?: boolean;
  includeVideos?: boolean;
  systemInstructions?: string;
}

export const POST = async (req: Request) => {
  try {
    const body: AIAgentReviewBody = await req.json();

    if (!body.query) {
      return Response.json(
        { message: 'Missing query' },
        { status: 400 },
      );
    }

    body.history = body.history || [];
    body.includeImages = body.includeImages ?? true;
    body.includeVideos = body.includeVideos ?? true;

    const history: BaseMessage[] = body.history.map((msg) => {
      return msg[0] === 'human'
        ? new HumanMessage({ content: msg[1] })
        : new AIMessage({ content: msg[1] });
    });

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.name ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    const embeddingModelProvider =
      body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0];
    const embeddingModel =
      body.embeddingModel?.name ||
      Object.keys(embeddingModelProviders[embeddingModelProvider])[0];

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        modelName: body.chatModel?.name || getCustomOpenaiModelName(),
        apiKey: body.chatModel?.customOpenAIKey || getCustomOpenaiApiKey(),
        temperature: 0.7,
        configuration: {
          baseURL:
            body.chatModel?.customOpenAIBaseURL || getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel]
        .model as unknown as BaseChatModel | undefined;
    }

    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][
        embeddingModel
      ].model as Embeddings | undefined;
    }

    if (!llm || !embeddings) {
      return Response.json(
        { message: 'Invalid model selected' },
        { status: 400 },
      );
    }

    const searchHandler = searchHandlers['aiAgentReviewApi'];

    if (!searchHandler) {
      return Response.json({ message: 'AI Agent Review API not available' }, { status: 400 });
    }

    // Get AI Agent Review
    const emitter = await searchHandler.searchAndAnswer(
      body.query,
      history,
      llm,
      embeddings,
      'balanced',
      [],
      body.systemInstructions || '',
    );

    // Process AI Agent Review
    const reviewResult = await new Promise<{
      message: string;
      sources: any[];
    }>((resolve, reject) => {
      let message = '';
      let sources: any[] = [];

      emitter.on('data', (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'response') {
            message += parsedData.data;
          } else if (parsedData.type === 'sources') {
            sources = parsedData.data;
          }
        } catch (error) {
          reject(new Error('Error parsing data'));
        }
      });

      emitter.on('end', () => {
        resolve({ message, sources });
      });

      emitter.on('error', (error: any) => {
        reject(error);
      });
    });

    // Get Images and Videos in parallel (if requested)
    const [images, videos] = await Promise.all([
      // Fetch images
      body.includeImages
        ? (async () => {
            try {
              const imageQuery = `${body.query} giao diện ảnh chụp màn hình demo logo`;
              const imageResult = await Promise.race([
                handleImageSearch(
                  {
                    chat_history: history,
                    query: imageQuery,
                  },
                  llm,
                ),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Image search timeout')), 60000),
                ),
              ]);
              return imageResult || [];
            } catch (error) {
              console.error('Error fetching images:', error);
              return [];
            }
          })()
        : Promise.resolve([]),
      
      // Fetch videos
      body.includeVideos
        ? (async () => {
            try {
              const videoQuery = `${body.query} hướng dẫn demo đánh giá tutorial`;
              const videoResult = await Promise.race([
                handleVideoSearch(
                  {
                    chat_history: history,
                    query: videoQuery,
                  },
                  llm,
                ),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Video search timeout')), 60000),
                ),
              ]);
              return videoResult || [];
            } catch (error) {
              console.error('Error fetching videos:', error);
              return [];
            }
          })()
        : Promise.resolve([]),
    ]);

    return Response.json({
      message: reviewResult.message,
      sources: reviewResult.sources,
      images: Array.isArray(images) && images.length > 0 ? images : [],
      videos: Array.isArray(videos) && videos.length > 0 ? videos : [],
    }, { status: 200 });

  } catch (err) {
    console.error('An error occurred while processing AI Agent Review request:', err);
    return Response.json(
      { message: 'An error occurred while processing AI Agent Review request' },
      { status: 500 },
    );
  }
};

