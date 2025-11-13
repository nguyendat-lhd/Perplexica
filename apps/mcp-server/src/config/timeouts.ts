/**
 * Timeout Configuration for MCP Server
 */

export const TIMEOUT_CONFIG = {
  // API request timeouts (in milliseconds)
  SEARCH: 180000,        // 3 minutes for regular search (increased from 2 minutes)
  STREAM: 300000,        // 5 minutes for streaming requests (increased from 3 minutes)
  STREAM_DURATION: 420000, // 7 minutes maximum stream duration (increased from 5 minutes)
  IMAGE_SEARCH: 180000,  // 3 minutes for image search (increased from 1.5 minutes)
  VIDEO_SEARCH: 180000,  // 3 minutes for video search (increased from 1.5 minutes)
  MODELS: 60000,         // 1 minute for models endpoint (increased from 30 seconds)
  CONFIG: 60000,         // 1 minute for config endpoint (increased from 30 seconds)

  // Connection timeouts
  CONNECT: 15000,        // 15 seconds to establish connection (increased from 10 seconds)

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,     // 1 second between retries
} as const;

/**
 * Default timeout values for different operations
 */
export const DEFAULT_TIMEOUTS = {
  chat: TIMEOUT_CONFIG.STREAM,
  search: TIMEOUT_CONFIG.SEARCH,
  searchStream: TIMEOUT_CONFIG.STREAM,
  searchImages: TIMEOUT_CONFIG.IMAGE_SEARCH,
  searchVideos: TIMEOUT_CONFIG.VIDEO_SEARCH,
  getModels: TIMEOUT_CONFIG.MODELS,
  getConfig: TIMEOUT_CONFIG.CONFIG,
} as const;