import { BedrockChat } from '@langchain/community/chat_models/bedrock/web';
import { getBedrockAccessKeyId, getBedrockSecretAccessKey, getBedrockRegion } from '../config';
import { ChatModel } from '.';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export const PROVIDER_INFO = {
  key: 'bedrock',
  displayName: 'AWS Bedrock',
};

// Common Bedrock models - users can also specify custom model IDs
const bedrockChatModels: Record<string, string>[] = [
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

export const loadBedrockChatModels = async () => {
  const accessKeyId = getBedrockAccessKeyId();
  const secretAccessKey = getBedrockSecretAccessKey();
  const region = getBedrockRegion();

  if (!accessKeyId || !secretAccessKey || !region) return {};

  try {
    const chatModels: Record<string, ChatModel> = {};

    bedrockChatModels.forEach((model) => {
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

