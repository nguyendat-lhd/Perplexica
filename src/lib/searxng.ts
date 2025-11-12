import axios from 'axios';
import { getSearxngApiEndpoint } from './config';

interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  let searxngURL = getSearxngApiEndpoint();

  if (!searxngURL) {
    throw new Error('SearXNG API URL is not configured. Please set SEARXNG_API_URL environment variable or configure in config.toml');
  }

  // Normalize URL: if it doesn't start with http:// or https://, add http://
  // Also handle cases like "searxng:8080" or "searxng.railway.internal:8080"
  if (!searxngURL.startsWith('http://') && !searxngURL.startsWith('https://')) {
    searxngURL = `http://${searxngURL}`;
  }

  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      const value = opts[key as keyof SearxngSearchOptions];
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
        return;
      }
      url.searchParams.append(key, value as string);
    });
  }

  try {
    const res = await axios.get(url.toString(), {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Perplexica/1.0; +https://github.com/ItzCrazyKns/Perplexica)',
        'Accept': 'application/json',
      },
    });

    const results: SearxngSearchResult[] = res.data.results || [];
    const suggestions: string[] = res.data.suggestions || [];

    return { results, suggestions };
  } catch (error: any) {
    // Handle connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Cannot connect to SearXNG at ${searxngURL}. Please check SEARXNG_API_URL configuration.`);
    }
    
    // Handle 403 Forbidden errors (rate limiting or blocked requests)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || 'Forbidden';
      console.error(`SearXNG returned 403 Forbidden. URL: ${url.toString()}, Error: ${errorMessage}`);
      throw new Error(`SearXNG rejected the request (403 Forbidden). This may be due to rate limiting or SearXNG configuration. Please check your SearXNG instance settings. Original error: ${errorMessage}`);
    }
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      throw new Error('SearXNG rate limit exceeded. Please wait a moment before trying again.');
    }
    
    // Handle other HTTP errors
    if (error.response?.status) {
      throw new Error(`SearXNG returned error ${error.response.status}: ${error.response.statusText || error.message}`);
    }
    
    // Re-throw other errors
    throw error;
  }
};
