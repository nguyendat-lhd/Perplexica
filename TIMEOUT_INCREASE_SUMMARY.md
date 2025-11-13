# MCP Server Timeout Configuration Update

## Overview
Timeout limits have been increased to provide more time for complex AI operations and reduce premature timeouts.

## Updated Timeouts

### ✅ **Main Search Operations: 3 minutes** (increased from 2 minutes)
- **API endpoint**: `/api/search`
- **Tool**: `perplexica_search`
- **Usage**: Standard web search, academic search, etc.

### ✅ **Streaming Operations: 5 minutes** (increased from 3 minutes)
- **API endpoints**: `/api/search` (stream), `/api/chat`
- **Tools**: `perplexica_search` (streaming), `perplexica_chat`
- **Usage**: Real-time streaming responses

### ✅ **Stream Duration: 7 minutes** (increased from 5 minutes)
- **Maximum time**: Stream can remain active
- **Usage**: Long-running chat or search streams

### ✅ **Media Search: 3 minutes** (increased from 1.5 minutes)
- **API endpoints**: `/api/images`, `/api/videos`
- **Tools**: `perplexica_search_images`, `perplexica_search_videos`
- **Usage**: Image and video search operations

### ✅ **Configuration Endpoints: 1 minute** (increased from 30 seconds)
- **API endpoints**: `/api/models`, `/api/config`
- **Tools**: `perplexica_get_models`, `perplexica_get_config`
- **Usage**: Retrieving available models and configuration

### ✅ **Connection Timeout: 15 seconds** (increased from 10 seconds)
- **Purpose**: Initial connection establishment
- **Usage**: All HTTP requests to Perplexica API

## Configuration File

All timeouts are centrally configured in `src/config/timeouts.ts`:

```typescript
export const TIMEOUT_CONFIG = {
  SEARCH: 180000,        // 3 minutes for regular search
  STREAM: 300000,        // 5 minutes for streaming requests
  STREAM_DURATION: 420000, // 7 minutes maximum stream duration
  IMAGE_SEARCH: 180000,  // 3 minutes for image search
  VIDEO_SEARCH: 180000,  // 3 minutes for video search
  MODELS: 60000,         // 1 minute for models endpoint
  CONFIG: 60000,         // 1 minute for config endpoint
  CONNECT: 15000,        // 15 seconds to establish connection
} as const;
```

## Error Messages Updated

All timeout error messages have been updated to reflect the new durations:

- `Search request timed out after 3 minutes`
- `Search stream request timed out after 5 minutes`
- `Chat request timed out after 5 minutes`
- `Image search request timed out after 3 minutes`
- `Video search request timed out after 3 minutes`
- `Get models request timed out after 1 minute`
- `Get config request timed out after 1 minute`

## Benefits

### 🎯 **Reduced Timeouts**
- Less likely to timeout on complex queries
- Better handling of slow AI model responses
- More reliable for large document processing

### 🔧 **Centralized Configuration**
- Easy to adjust timeouts in one place
- Consistent timeout handling across all operations
- Clear documentation of timeout values

### 📊 **Better User Experience**
- Fewer "request timed out" errors
- More time for comprehensive search results
- Improved reliability for long-running operations

## Files Modified

1. **`src/config/timeouts.ts`** - Updated timeout values
2. **`src/code-mode/api.ts`** -
   - Replaced hard-coded timeouts with config values
   - Updated error messages
   - Added TIMEOUT_CONFIG import

## Validation

- ✅ TypeScript compilation successful
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ All error messages updated
- ✅ Configuration centralized

## Usage Impact

These changes are **transparent to MCP clients** - they will simply experience fewer timeouts and have more time for complex operations to complete successfully.

The increased timeouts are particularly beneficial for:
- Complex academic searches
- Large document processing
- Slow AI model responses
- Network latency issues
- High server load scenarios