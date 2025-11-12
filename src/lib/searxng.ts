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
    });

    const results: SearxngSearchResult[] = res.data.results || [];
    const suggestions: string[] = res.data.suggestions || [];

    return { results, suggestions };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Cannot connect to SearXNG at ${searxngURL}. Please check SEARXNG_API_URL configuration.`);
    }
    throw error;
  }
};
