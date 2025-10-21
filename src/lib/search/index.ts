import MetaSearchAgent from './metaSearchAgent';
import prompts from '../prompts';

console.log('Available focus modes:', Object.keys({
  webSearch: 'webSearch',
  academicSearch: 'academicSearch', 
  writingAssistant: 'writingAssistant',
  wolframAlphaSearch: 'wolframAlphaSearch',
  youtubeSearch: 'youtubeSearch',
  redditSearch: 'redditSearch',
  aiAgentReview: 'aiAgentReview',
  aiAgentReviewApi: 'aiAgentReviewApi'
}));

export const searchHandlers: Record<string, MetaSearchAgent> = {
  webSearch: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    queryGeneratorFewShots: prompts.webSearchRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
  academicSearch: new MetaSearchAgent({
    activeEngines: ['arxiv', 'google scholar', 'pubmed'],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    queryGeneratorFewShots: prompts.webSearchRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: true,
  }),
  writingAssistant: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    queryGeneratorFewShots: [],
    responsePrompt: prompts.writingAssistantPrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: false,
  }),
  wolframAlphaSearch: new MetaSearchAgent({
    activeEngines: ['wolframalpha'],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    queryGeneratorFewShots: prompts.webSearchRetrieverFewShots,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: true,
  }),
  youtubeSearch: new MetaSearchAgent({
    activeEngines: ['youtube'],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    queryGeneratorFewShots: prompts.webSearchRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
  redditSearch: new MetaSearchAgent({
    activeEngines: ['reddit'],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    queryGeneratorFewShots: prompts.webSearchRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
  aiAgentReview: new MetaSearchAgent({
    activeEngines: ['google', 'bing', 'duckduckgo'],
    queryGeneratorPrompt: prompts.aiAgentReviewRetrieverPrompt,
    responsePrompt: prompts.aiAgentReviewResponsePrompt,
    queryGeneratorFewShots: prompts.aiAgentReviewRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
  aiAgentReviewApi: new MetaSearchAgent({
    activeEngines: ['google', 'bing', 'duckduckgo'],
    queryGeneratorPrompt: prompts.aiAgentReviewApiRetrieverPrompt,
    responsePrompt: prompts.aiAgentReviewApiResponsePrompt,
    queryGeneratorFewShots: prompts.aiAgentReviewApiRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
};
