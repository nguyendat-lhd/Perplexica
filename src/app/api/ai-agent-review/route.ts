import { searchHandlers } from '@/lib/search';
import { getAvailableChatModelProviders, getAvailableEmbeddingModelProviders } from '@/lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import handleImageSearch from '@/lib/chains/imageSearchAgent';
import handleVideoSearch from '@/lib/chains/videoSearchAgent';

interface AgentMetadata {
  name: string;
  provider: string;
  provider_country?: string;
  description?: string;
  excerpt?: string;
  pricing?: string;
  website_url?: string;
  logo?: string;
  seo_title?: string;
  seo_description?: string;
  social_review?: string[];
}

function extractAgentMetadata(query: string, sources: any[]): AgentMetadata {
  // Extract agent name from query
  const agentName = extractAgentNameFromQuery(query);
  
  // Extract provider information
  const providerInfo = extractProviderInfo(sources);
  
  // Extract description and excerpt from sources
  const contentInfo = extractContentInfo(sources);
  
  // Extract URLs and additional info
  const urlInfo = extractUrlInfo(sources);
  
  return {
    name: agentName,
    provider: providerInfo.provider,
    provider_country: providerInfo.country,
    description: contentInfo.description,
    excerpt: contentInfo.excerpt,
    pricing: contentInfo.pricing,
    website_url: urlInfo.website,
    logo: urlInfo.logo,
    seo_title: `${agentName} - Đánh giá chi tiết AI Agent`,
    seo_description: contentInfo.excerpt || `Đánh giá toàn diện về ${agentName} - ${providerInfo.provider}`,
    social_review: contentInfo.socialReviews || []
  };
}

function extractAgentNameFromQuery(query: string): string {
  const patterns = [
    /ChatGPT|GPT-?4?|OpenAI/i,
    /Claude|Anthropic/i,
    /Bard|Gemini|Google/i,
    /Copilot|GitHub/i,
    /Jasper|Jasper AI/i,
    /Copy\.ai|CopyAI/i,
    /Notion AI/i,
    /Perplexity/i,
    /You\.com|You AI/i,
    /Character\.ai|Character AI/i,
    /Replika/i,
    /Synthesia/i,
    /Runway/i,
    /Midjourney/i,
    /DALL-E|DALL·E/i,
    /Stable Diffusion/i,
    /Nexcyra/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) return match[0];
  }
  
  return 'AI Agent';
}

function extractProviderInfo(sources: any[]): { provider: string; country?: string } {
  const providerMap: { [key: string]: { provider: string; country: string } } = {
    'chatgpt': { provider: 'OpenAI', country: 'USA' },
    'gpt': { provider: 'OpenAI', country: 'USA' },
    'openai': { provider: 'OpenAI', country: 'USA' },
    'claude': { provider: 'Anthropic', country: 'USA' },
    'anthropic': { provider: 'Anthropic', country: 'USA' },
    'bard': { provider: 'Google', country: 'USA' },
    'gemini': { provider: 'Google', country: 'USA' },
    'google': { provider: 'Google', country: 'USA' },
    'copilot': { provider: 'GitHub', country: 'USA' },
    'github': { provider: 'GitHub', country: 'USA' },
    'midjourney': { provider: 'Midjourney', country: 'USA' },
    'dall-e': { provider: 'OpenAI', country: 'USA' },
    'stable diffusion': { provider: 'Stability AI', country: 'UK' },
    'nexcyra': { provider: 'Nexcyra', country: 'USA' },
    'nexcyra.com': { provider: 'Nexcyra', country: 'USA' }
  };
  
  const content = sources.map(s => s.pageContent || '').join(' ').toLowerCase();
  
  for (const [key, info] of Object.entries(providerMap)) {
    if (content.includes(key)) {
      return info;
    }
  }
  
  return { provider: 'Unknown', country: 'Unknown' };
}

function extractContentInfo(sources: any[]): { 
  description?: string; 
  excerpt?: string; 
  pricing?: string; 
  socialReviews?: string[] 
} {
  const content = sources.map(s => s.pageContent || '').join(' ');
  
  // Extract description (first 500 characters of meaningful content)
  const description = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500)
    .trim();
  
  // Extract excerpt (first 200 characters)
  const excerpt = description.substring(0, 200).trim();
  
  // Extract pricing information
  const pricingMatch = content.match(/(?:pricing|price|cost|free|paid|subscription)[^.]{0,100}/i);
  const pricing = pricingMatch ? pricingMatch[0].trim() : undefined;
  
  // Extract social reviews (simulated)
  const socialReviews = [
    "Đánh giá tích cực từ người dùng",
    "Được cộng đồng đánh giá cao",
    "Nhiều phản hồi tích cực"
  ];
  
  return {
    description: description || undefined,
    excerpt: excerpt || undefined,
    pricing: pricing || undefined,
    socialReviews: socialReviews
  };
}

function extractUrlInfo(sources: any[]): { website?: string; logo?: string } {
  const urls = sources
    .map(s => s.metadata?.url)
    .filter(Boolean);
  
  const website = urls.find(url => 
    url && (
      url.includes('openai.com') ||
      url.includes('anthropic.com') ||
      url.includes('google.com') ||
      url.includes('github.com') ||
      url.includes('midjourney.com') ||
      url.includes('nexcyra.com')
    )
  );
  
  return {
    website: website || undefined,
    logo: undefined // Would need to extract from images
  };
}

interface ChatModel {
  provider: string;
  name: string;
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

    const searchHandler = searchHandlers['aiAgentReview'];

    if (!searchHandler) {
      return Response.json({ message: 'AI Agent Review not available' }, { status: 400 });
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

    // Get Images if requested
    let images: any[] = [];
    if (body.includeImages) {
      try {
        const imageQuery = `${body.query} giao diện ảnh chụp màn hình demo logo`;
        const imageResult = await handleImageSearch(
          {
            chat_history: history,
            query: imageQuery,
          },
          llm,
        );
        images = imageResult.images || [];
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    }

    // Get Videos if requested
    let videos: any[] = [];
    if (body.includeVideos) {
      try {
        const videoQuery = `${body.query} hướng dẫn demo đánh giá tutorial`;
        const videoResult = await handleVideoSearch(
          {
            chat_history: history,
            query: videoQuery,
          },
          llm,
        );
        videos = videoResult.videos || [];
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    }

    // Extract metadata from sources and query
    const metadata = extractAgentMetadata(body.query, reviewResult.sources);

    return Response.json({
      message: reviewResult.message,
      sources: reviewResult.sources,
      images: images.length > 0 ? images : undefined,
      videos: videos.length > 0 ? videos : undefined,
      metadata: metadata,
    }, { status: 200 });

  } catch (err) {
    console.error('An error occurred while processing AI Agent Review request:', err);
    return Response.json(
      { message: 'An error occurred while processing AI Agent Review request' },
      { status: 500 },
    );
  }
};
