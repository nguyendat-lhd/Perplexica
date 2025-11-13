/**
 * Timeout Configuration for MCP Server
 */

export const TIMEOUT_CONFIG = {
  // API request timeouts (in milliseconds)
  SEARCH: 120000,        // 2 minutes for regular search
  STREAM: 180000,        // 3 minutes for streaming requests
  STREAM_DURATION: 300000, // 5 minutes maximum stream duration
  IMAGE_SEARCH: 90000,   // 1.5 minutes for image search
  VIDEO_SEARCH: 90000,   // 1.5 minutes for video search
  MODELS: 30000,         // 30 seconds for models endpoint
  CONFIG: 30000,         // 30 seconds for config endpoint

  // Connection timeouts
  CONNECT: 10000,        // 10 seconds to establish connection

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