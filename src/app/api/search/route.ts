import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { ChatOpenAI } from '@langchain/openai';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { searchHandlers } from '@/lib/search';

interface chatModel {
  provider: string;
  name: string;
  customOpenAIKey?: string;
  customOpenAIBaseURL?: string;
}

interface embeddingModel {
  provider: string;
  name: string;
}

interface ChatRequestBody {
  optimizationMode: 'speed' | 'balanced';
  focusMode: string;
  chatModel?: chatModel;
  embeddingModel?: embeddingModel;
  query: string;
  history: Array<[string, string]>;
  stream?: boolean;
  systemInstructions?: string;
}

export const POST = async (req: Request) => {
  try {
    const body: ChatRequestBody = await req.json();

    if (!body.focusMode || !body.query) {
      return Response.json(
        { message: 'Missing focus mode or query' },
        { status: 400 },
      );
    }

    body.history = body.history || [];
    body.optimizationMode = body.optimizationMode || 'balanced';
    body.stream = body.stream || false;

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

    const searchHandler: MetaSearchAgentType = searchHandlers[body.focusMode];

    if (!searchHandler) {
      return Response.json({ message: 'Invalid focus mode' }, { status: 400 });
    }

    const emitter = await searchHandler.searchAndAnswer(
      body.query,
      history,
      llm,
      embeddings,
      body.optimizationMode,
      [],
      body.systemInstructions || '',
    );

    if (!body.stream) {
      return new Promise(
        (
          resolve: (value: Response) => void,
          reject: (value: Response) => void,
        ) => {
          let message = '';
          let sources: any[] = [];
          let images: any[] = [];
          let videos: any[] = [];

          emitter.on('data', (data: string) => {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.type === 'response') {
                message += parsedData.data;
              } else if (parsedData.type === 'sources') {
                sources = parsedData.data;
              } else if (parsedData.type === 'images') {
                images = parsedData.data;
              } else if (parsedData.type === 'videos') {
                videos = parsedData.data;
              }
            } catch (error) {
              reject(
                Response.json(
                  { message: 'Error parsing data' },
                  { status: 500 },
                ),
              );
            }
          });

          emitter.on('end', () => {
            // Extract metadata for AI Agent Review mode
            let metadata = undefined;
            if (body.focusMode === 'aiAgentReview') {
              metadata = extractAgentMetadata(body.query, sources, message);
            }
            
            resolve(Response.json({ 
              message, 
              sources, 
              images: images.length > 0 ? images : undefined,
              videos: videos.length > 0 ? videos : undefined,
              metadata: metadata
            }, { status: 200 }));
          });

          emitter.on('error', (error: any) => {
            reject(
              Response.json(
                { message: 'Search error', error },
                { status: 500 },
              ),
            );
          });
        },
      );
    }

    const encoder = new TextEncoder();

    const abortController = new AbortController();
    const { signal } = abortController;

    const stream = new ReadableStream({
      start(controller) {
        let sources: any[] = [];

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'init',
              data: 'Stream connected',
            }) + '\n',
          ),
        );

        signal.addEventListener('abort', () => {
          emitter.removeAllListeners();

          try {
            controller.close();
          } catch (error) {}
        });

        emitter.on('data', (data: string) => {
          if (signal.aborted) return;

          try {
            const parsedData = JSON.parse(data);

            if (parsedData.type === 'response') {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'response',
                    data: parsedData.data,
                  }) + '\n',
                ),
              );
            } else if (parsedData.type === 'sources') {
              sources = parsedData.data;
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'sources',
                    data: sources,
                  }) + '\n',
                ),
              );
            }
          } catch (error) {
            controller.error(error);
          }
        });

        emitter.on('end', () => {
          if (signal.aborted) return;

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
              }) + '\n',
            ),
          );
          controller.close();
        });

        emitter.on('error', (error: any) => {
          if (signal.aborted) return;

          controller.error(error);
        });
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error(`Error in getting search results: ${err.message}`);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

interface AgentMetadata {
  name: string;
  provider: string;
  provider_country?: string;
  excerpt?: string;
  pricing?: string;
  website_url?: string;
  logo?: string;
  seo_title?: string;
  seo_description?: string;
}

function extractAgentMetadata(query: string, sources: any[], message?: string): AgentMetadata {
  const agentName = extractAgentNameFromQuery(query);
  const providerInfo = extractProviderInfo(sources, query);
  const contentInfo = extractContentInfo(sources);
  const urlInfo = extractUrlInfo(sources);
  
  // Extract metadata from LLM response
  let excerpt = '';
  let seoDescription = '';
  let seoTitle = '';

  if (message) {
    // Try to extract JSON metadata from the end of the message
    const jsonMatch = message.match(/```json\s*\{[^}]*\}\s*```/s);
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[0].replace(/```json\s*|\s*```/g, '');
        const metadata = JSON.parse(jsonStr);
        excerpt = metadata.excerpt || '';
        seoDescription = metadata.seo_description || '';
        seoTitle = metadata.seo_title || '';
      } catch (error) {
        console.error('Error parsing metadata JSON:', error);
      }
    }

    // Fallback: create metadata if not found in JSON
    if (!excerpt || !seoDescription || !seoTitle) {
      // Clean message content (keep Vietnamese characters)
      const cleanMessage = message
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Split into sentences and filter out negative/unhelpful content
      const sentences = cleanMessage.split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .filter(s => {
          const lower = s.toLowerCase();
          // Filter out negative phrases
          return !lower.includes('không thể') && 
                 !lower.includes('không có') && 
                 !lower.includes('không tìm thấy') &&
                 !lower.includes('không cung cấp') &&
                 !lower.includes('cần cung cấp') &&
                 !lower.includes('vui lòng cung cấp');
        });

      if (!excerpt) {
        if (sentences.length > 0) {
          // Create intelligent summary for excerpt (first 2-3 sentences)
          excerpt = sentences.slice(0, 2).join('. ').trim();
          if (excerpt.length > 200) {
            excerpt = excerpt.substring(0, 200).trim();
          }
        } else {
          // Fallback: create generic description based on agent name
          excerpt = `${agentName} là một AI agent chuyên nghiệp với khả năng xử lý và phân tích thông tin thông minh.`;
        }
      }

      if (!seoDescription) {
        if (sentences.length > 0) {
          // Create intelligent summary for seo_description (first 3-4 sentences)
          seoDescription = sentences.slice(0, 3).join('. ').trim();
          if (seoDescription.length > 300) {
            seoDescription = seoDescription.substring(0, 300).trim();
          }
        } else {
          // Fallback: create generic SEO description
          seoDescription = `${agentName} là một AI agent tiên tiến được thiết kế để hỗ trợ và tối ưu hóa các tác vụ chuyên môn. Với khả năng xử lý ngôn ngữ tự nhiên và phân tích dữ liệu thông minh, ${agentName} mang lại hiệu quả cao trong việc giải quyết các vấn đề phức tạp.`;
        }
      }

      if (!seoTitle) {
        seoTitle = `${agentName} - Đánh giá chi tiết AI Agent`;
      }
    }
  }
  
  return {
    name: agentName,
    provider: providerInfo.provider,
    provider_country: providerInfo.country,
    excerpt: excerpt || contentInfo.excerpt,
    pricing: contentInfo.pricing,
    website_url: urlInfo.website,
    logo: urlInfo.logo,
    seo_title: seoTitle || `${agentName} - Đánh giá chi tiết AI Agent`,
    seo_description: seoDescription || `Đánh giá toàn diện về ${agentName} - ${providerInfo.provider}`,
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
    /Nexcyra/i,
    /F5Bot/i,
    /BeaverX/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) return match[0];
  }
  
  return 'AI Agent';
}

function extractProviderInfo(sources: any[], query?: string): { provider: string; country?: string } {
  // Phân tích kết quả search để tìm thông tin provider
  const content = sources.map(s => s.pageContent || '').join(' ').toLowerCase();
  
  // Tìm kiếm thông tin từ search results
  if (content.includes('openai') || content.includes('chatgpt') || content.includes('gpt')) {
    return { provider: 'OpenAI', country: 'USA' };
  }
  if (content.includes('anthropic') || content.includes('claude')) {
    return { provider: 'Anthropic', country: 'USA' };
  }
  if (content.includes('google') || content.includes('bard') || content.includes('gemini')) {
    return { provider: 'Google', country: 'USA' };
  }
  if (content.includes('github') || content.includes('copilot')) {
    return { provider: 'GitHub', country: 'USA' };
  }
  if (content.includes('midjourney')) {
    return { provider: 'Midjourney', country: 'USA' };
  }
  if (content.includes('stability ai') || content.includes('stable diffusion')) {
    return { provider: 'Stability AI', country: 'UK' };
  }
  
  // Không tìm thấy thông tin trong search results
  return { provider: 'Chưa tìm thấy', country: 'Chưa xác định' };
}

function extractContentInfo(sources: any[]): { 
  excerpt?: string; 
  pricing?: string; 
} {
  const content = sources.map(s => s.pageContent || '').join(' ');
  
  // Extract excerpt (first 200 characters of clean text)
  const excerpt = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
    .substring(0, 200)
    .trim();
  
  // Extract pricing information
  const pricingMatch = content.match(/(?:pricing|price|cost|free|paid|subscription)[^.]{0,100}/i);
  const pricing = pricingMatch ? pricingMatch[0].trim() : undefined;
  
  return {
    excerpt: excerpt || undefined,
    pricing: pricing || undefined,
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
    logo: undefined
  };
}
