import {
  webSearchResponsePrompt,
  webSearchRetrieverFewShots,
  webSearchRetrieverPrompt,
} from './webSearch';
import { writingAssistantPrompt } from './writingAssistant';
import {
  aiAgentReviewResponsePrompt,
  aiAgentReviewRetrieverPrompt,
  aiAgentReviewRetrieverFewShots,
} from './aiAgentReview';

const prompts = {
  webSearchResponsePrompt,
  webSearchRetrieverPrompt,
  webSearchRetrieverFewShots,
  writingAssistantPrompt,
  aiAgentReviewResponsePrompt,
  aiAgentReviewRetrieverPrompt,
  aiAgentReviewRetrieverFewShots,
};

export default prompts;
