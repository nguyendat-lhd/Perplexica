import { BedrockChat } from '@langchain/community/chat_models/bedrock/web';
// Custom BedrockEmbeddings wrapper for Cohere support (using AWS SDK directly)
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockAccessKeyId, getBedrockSecretAccessKey, getBedrockRegion } from '../config';
import { ChatModel, EmbeddingModel } from '.';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';

/**
 * Custom BedrockEmbeddings wrapper that supports both Titan and Cohere models
 * Cohere models require different input format: { texts: [...], input_type: "search_query" }
 * Follows the same pattern as HuggingFaceTransformersEmbeddings
 */
class BedrockEmbeddings extends Embeddings {
  private client: BedrockRuntimeClient;
  private model: string;
  private isCohereModel: boolean;

  constructor(params: {
    region: string;
    model: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }) {
    // Initialize Embeddings properly - pass empty object to initialize caller
    // Same pattern as HuggingFaceTransformersEmbeddings
    super({});
    this.model = params.model;
    // Detect Cohere models (including inference profile format)
    this.isCohereModel = params.model.startsWith('cohere.') || 
                         params.model.includes('cohere') ||
                         params.model.includes('embed-v4');
    
    this.client = new BedrockRuntimeClient({
      region: params.region,
      credentials: params.credentials,
    });
  }

  async embedQuery(text: string): Promise<number[]> {
    // Use caller.call() directly - caller is always initialized by super()
    // Same pattern as HuggingFaceTransformersEmbeddings.runEmbedding()
    return this.caller.call(async () => {
      return this._embedText(text);
    });
  }

  private async _embedText(text: string): Promise<number[]> {
    try {
      const cleanedText = text.replace(/\n/g, ' ');
      
      let body: string;
      if (this.isCohereModel) {
        // Cohere format: { texts: [...], input_type: "search_query" }
        body = JSON.stringify({
          texts: [cleanedText],
          input_type: 'search_query',
        });
      } else {
        // Titan format: { inputText: ... }
        body = JSON.stringify({ inputText: cleanedText });
      }

      const res = await this.client.send(
        new InvokeModelCommand({
          modelId: this.model,
          body: body,
          contentType: 'application/json',
          accept: 'application/json',
        })
      );

      const responseBody = new TextDecoder().decode(res.body);
      const parsed = JSON.parse(responseBody);

      // Cohere returns { embeddings: [[...]] }, Titan returns { embedding: [...] }
      if (this.isCohereModel && parsed.embeddings) {
        return parsed.embeddings[0];
      } else if (parsed.embedding) {
        return parsed.embedding;
      } else {
        throw new Error('Unexpected response format from Bedrock');
      }
    } catch (error: any) {
      console.error('Bedrock embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedQuery(text)));
  }
}

export const PROVIDER_INFO = {
  key: 'bedrock',
  displayName: 'AWS Bedrock',
};

// Common Bedrock models - users can also specify custom model IDs
const bedrockChatModels: Record<string, string>[] = [
  {
    displayName: 'Claude Sonnet 4 (APAC)',
    key: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',
  },
  {
    displayName: 'Claude Sonnet 4',
    key: 'anthropic.claude-sonnet-4-20250514-v1:0',
  },
  {
    displayName: 'Claude 3.5 Sonnet',
    key: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  },
  {
    displayName: 'Claude 3 Opus',
    key: 'anthropic.claude-3-opus-20240229-v1:0',
  },
  {
    displayName: 'Claude 3 Sonnet',
    key: 'anthropic.claude-3-sonnet-20240229-v1:0',
  },
  {
    displayName: 'Claude 3 Haiku',
    key: 'anthropic.claude-3-haiku-20240307-v1:0',
  },
  {
    displayName: 'Claude 3.5 Haiku',
    key: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  },
  {
    displayName: 'Titan Text G1 - Large',
    key: 'amazon.titan-text-lite-v1',
  },
  {
    displayName: 'Titan Text G1 - Express',
    key: 'amazon.titan-text-express-v1',
  },
  {
    displayName: 'Llama 3 70B',
    key: 'meta.llama3-70b-instruct-v1:0',
  },
  {
    displayName: 'Llama 3 8B',
    key: 'meta.llama3-8b-instruct-v1:0',
  },
  {
    displayName: 'Mistral Large',
    key: 'mistral.mistral-large-2402-v1:0',
  },
  {
    displayName: 'Mistral 7B',
    key: 'mistral.mistral-7b-instruct-v1:0',
  },
];

// Common Bedrock embedding models
// Note: Titan models are not available in ap-southeast-1
// Custom wrapper supports Cohere models with correct input format
// cohere.embed-v4:0 requires inference profile identifier: global.cohere.embed-v4:0
const bedrockEmbeddingModels: Record<string, string>[] = [
  {
    displayName: 'Cohere Embed v4',
    key: 'global.cohere.embed-v4:0', // Inference profile identifier for cohere.embed-v4:0
  },
  {
    displayName: 'Cohere Embed English',
    key: 'cohere.embed-english-v3',
  },
  {
    displayName: 'Cohere Embed Multilingual',
    key: 'cohere.embed-multilingual-v3',
  },
];

export const loadBedrockChatModels = async () => {
  const accessKeyId = getBedrockAccessKeyId();
  const secretAccessKey = getBedrockSecretAccessKey();
  const region = getBedrockRegion()?.split(' ')[0]?.trim(); // Remove comments

  if (!accessKeyId || !secretAccessKey || !region) {
    console.log('Bedrock: Missing credentials or region', { accessKeyId: !!accessKeyId, secretAccessKey: !!secretAccessKey, region });
    return {};
  }

  try {
    const chatModels: Record<string, ChatModel> = {};

    // Filter models based on region
    // For ap-southeast-1, only use models with 'apac.' prefix or models that work in this region
    const isAPACRegion = region === 'ap-southeast-1';
    
    bedrockChatModels.forEach((model) => {
      // Skip Claude Sonnet 4 without apac prefix in APAC regions
      if (isAPACRegion && model.key === 'anthropic.claude-sonnet-4-20250514-v1:0') {
        console.log(`Skipping ${model.key} - not supported in ${region}, use apac.anthropic.claude-sonnet-4-20250514-v1:0 instead`);
        return;
      }
      
      chatModels[model.key] = {
        displayName: model.displayName,
        model: new BedrockChat({
          region: region,
          model: model.key,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          },
          temperature: 0.7,
        }) as unknown as BaseChatModel,
      };
    });

    return chatModels;
  } catch (err) {
    console.error(`Error loading Bedrock models: ${err}`);
    return {};
  }
};

export const loadBedrockEmbeddingModels = async () => {
  const accessKeyId = getBedrockAccessKeyId();
  const secretAccessKey = getBedrockSecretAccessKey();
  const region = getBedrockRegion()?.split(' ')[0]?.trim(); // Remove comments

  console.log('Loading Bedrock embedding models:', {
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretAccessKey,
    region: region,
  });

  if (!accessKeyId || !secretAccessKey || !region) {
    console.log('Bedrock embedding: Missing credentials or region');
    return {};
  }

  try {
    const embeddingModels: Record<string, EmbeddingModel> = {};

    bedrockEmbeddingModels.forEach((model) => {
      try {
        embeddingModels[model.key] = {
          displayName: model.displayName,
          model: new BedrockEmbeddings({
            region: region,
            model: model.key,
            credentials: {
              accessKeyId: accessKeyId,
              secretAccessKey: secretAccessKey,
            },
          }) as unknown as Embeddings,
        };
        console.log(`✅ Loaded Bedrock embedding model: ${model.key}`);
      } catch (modelErr: any) {
        console.error(`Error loading model ${model.key}:`, modelErr.message);
      }
    });

    console.log(`Bedrock embedding models loaded: ${Object.keys(embeddingModels).length}`);
    return embeddingModels;
  } catch (err: any) {
    console.error(`Error loading Bedrock embedding models:`, err);
    console.error('Error stack:', err.stack);
    return {};
  }
};

