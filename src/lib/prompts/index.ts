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
import {
  aiAgentReviewApiResponsePrompt,
  aiAgentReviewApiRetrieverPrompt,
  aiAgentReviewApiRetrieverFewShots,
} from './aiAgentReviewApi';

const prompts = {
  webSearchResponsePrompt,
  webSearchRetrieverPrompt,
  webSearchRetrieverFewShots,
  writingAssistantPrompt,
  aiAgentReviewResponsePrompt,
  aiAgentReviewRetrieverPrompt,
  aiAgentReviewRetrieverFewShots,
  aiAgentReviewApiResponsePrompt,
  aiAgentReviewApiRetrieverPrompt,
  aiAgentReviewApiRetrieverFewShots,
};

export default prompts;
