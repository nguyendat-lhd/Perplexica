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

// Simple in-memory cache to prevent duplicate requests
interface CacheEntry {
  results: { results: SearxngSearchResult[]; suggestions: string[] };
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache TTL

// Generate cache key from query and options
const generateCacheKey = (query: string, opts?: SearxngSearchOptions): string => {
  const optsStr = opts ? JSON.stringify(opts) : '';
  return `${query}:${optsStr}`;
};

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}, CACHE_TTL);

// Helper function to check if error is a rate limit error
const isRateLimitError = (status: number, errorData: any): boolean => {
  if (status === 429) {
    return true;
  }
  
  if (status === 403) {
    // Check if error message indicates rate limiting
    const errorMessage = errorData?.error || errorData?.message || '';
    const errorString = String(errorMessage).toLowerCase();
    
    // Common rate limit indicators from SearXNG/Brave
    if (
      errorString.includes('too many request') ||
      errorString.includes('rate limit') ||
      errorString.includes('suspended_time') ||
      errorString.includes('too many requests')
    ) {
      return true;
    }
  }
  
  return false;
};

// Helper function to make request with retry logic
// IMPORTANT: Does NOT retry on rate limit errors (403, 429) to prevent making the problem worse
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

      // Check if this is a rate limit error - DO NOT RETRY on rate limits
      if (isRateLimitError(res.status, res.data)) {
        console.warn(`SearXNG returned rate limit error (${res.status}). Not retrying to avoid making the problem worse.`);
        // Return immediately without retrying
        return res;
      }

      // If 403 but not a rate limit error, and not last attempt, wait and retry
      // (Some 403s might be temporary bot detection issues)
      if (res.status === 403 && attempt < maxRetries) {
        console.warn(`SearXNG returned 403 (non-rate-limit), retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
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
  // Check cache first to avoid duplicate requests
  const cacheKey = generateCacheKey(query, opts);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[SearXNG Cache Hit] Query: ${query.substring(0, 50)}...`);
    return cached.results;
  }

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
      
      // Check for rate limit errors first
      if (isRateLimitError(res.status, res.data)) {
        const suspendedTime = res.data?.suspended_time || res.data?.suspendedTime || 'unknown';
        console.error(`SearXNG rate limit error (${res.status}). URL: ${url.toString()}, Error: ${errorMessage}, Suspended time: ${suspendedTime}`);
        throw new Error(`SearXNG rate limit exceeded (suspended_time=${suspendedTime}). Please wait before making more requests. Original error: ${errorMessage}`);
      }
      
      if (res.status === 403) {
        console.error(`SearXNG returned 403 Forbidden. URL: ${url.toString()}, Error: ${errorMessage}`);
        throw new Error(`SearXNG rejected the request (403 Forbidden). This may be due to rate limiting or SearXNG bot detection. Please configure SearXNG to disable bot detection or use a different instance. Original error: ${errorMessage}`);
      }
      
      if (res.status === 429) {
        throw new Error(`SearXNG rate limit exceeded (429). Please wait before making more requests. Error: ${errorMessage}`);
      }
      
      throw new Error(`SearXNG returned error ${res.status}: ${errorMessage}`);
    }

    const results: SearxngSearchResult[] = res.data.results || [];
    const suggestions: string[] = res.data.suggestions || [];

    const searchResults = { results, suggestions };
    
    // Cache successful results
    searchCache.set(cacheKey, {
      results: searchResults,
      timestamp: Date.now(),
    });

    return searchResults;
  } catch (error: any) {
    // Handle connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Cannot connect to SearXNG at ${searxngURL}. Please check SEARXNG_API_URL configuration.`);
    }
    
    // Handle rate limit errors (check first before generic 403)
    if (error.response && isRateLimitError(error.response.status, error.response.data)) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Rate limit exceeded';
      const suspendedTime = error.response?.data?.suspended_time || error.response?.data?.suspendedTime || 'unknown';
      console.error(`SearXNG rate limit error. URL: ${url.toString()}, Status: ${error.response.status}, Error: ${errorMessage}, Suspended time: ${suspendedTime}`);
      throw new Error(`SearXNG rate limit exceeded (suspended_time=${suspendedTime}). Please wait before making more requests. Original error: ${errorMessage}`);
    }
    
    // Handle 403 Forbidden errors (non-rate-limit)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Forbidden';
      console.error(`SearXNG returned 403 Forbidden. URL: ${url.toString()}, Error: ${errorMessage}`);
      throw new Error(`SearXNG rejected the request (403 Forbidden). This may be due to rate limiting or SearXNG bot detection. Please configure SearXNG to disable bot detection or use a different instance. Original error: ${errorMessage}`);
    }
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Too many requests';
      throw new Error(`SearXNG rate limit exceeded (429). Please wait before making more requests. Error: ${errorMessage}`);
    }
    
    // Handle other HTTP errors
    if (error.response?.status) {
      throw new Error(`SearXNG returned error ${error.response.status}: ${error.response.statusText || error.message}`);
    }
    
    // Re-throw other errors
    throw error;
  }
};
