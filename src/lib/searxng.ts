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

// Helper function to make request with retry logic
const makeRequestWithRetry = async (
  url: string,
  headers: Record<string, string>,
  maxRetries: number = 2,
  retryDelay: number = 1000,
): Promise<any> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: 10000,
        headers,
        maxRedirects: 5, // Allow redirects
        // Don't throw on 4xx, we'll handle it manually
        validateStatus: (status) => status < 500,
      });

      // If successful, return response
      if (res.status < 400) {
        return res;
      }

      // If 403 and not last attempt, wait and retry
      if (res.status === 403 && attempt < maxRetries) {
        console.warn(`SearXNG returned 403, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      // Return response even if 4xx (we'll handle it)
      return res;
    } catch (error: any) {
      // If connection error and not last attempt, retry
      if ((error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') && attempt < maxRetries) {
        console.warn(`Connection error, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

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

  // Create headers that mimic a real browser
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': `${searxngURL}/`,
    'Origin': searxngURL,
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
  };

  try {
    const res = await makeRequestWithRetry(url.toString(), headers, 2, 1000);

    // Check for 4xx errors manually
    if (res.status >= 400 && res.status < 500) {
      const errorMessage = res.data?.error || res.data?.message || `HTTP ${res.status}`;
      if (res.status === 403) {
        console.error(`SearXNG returned 403 Forbidden after retries. URL: ${url.toString()}, Error: ${errorMessage}`);
        throw new Error(`SearXNG rejected the request (403 Forbidden). This may be due to rate limiting or SearXNG bot detection. Please configure SearXNG to disable bot detection or use a different instance. Original error: ${errorMessage}`);
      }
      throw new Error(`SearXNG returned error ${res.status}: ${errorMessage}`);
    }

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
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Forbidden';
      console.error(`SearXNG returned 403 Forbidden. URL: ${url.toString()}, Error: ${errorMessage}`);
      throw new Error(`SearXNG rejected the request (403 Forbidden). This may be due to rate limiting or SearXNG bot detection. Please configure SearXNG to disable bot detection or use a different instance. Original error: ${errorMessage}`);
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
