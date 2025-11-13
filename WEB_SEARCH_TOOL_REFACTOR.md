# Web Search Tool Refactor

## Problem Identified
The MCP server had two redundant search tools:
1. `web_search` - Simple tool with only `query` parameter
2. `perplexica_search` - Full-featured tool with multiple options

## Solution Implemented

### ✅ Removed `web_search` Tool
- **Removed from**: `src/tools/index.ts`
  - Deleted `webSearchTool` definition
  - Removed from `allTools` export array

### ✅ Removed `handleWebSearch` Method
- **Removed from**: `src/server.ts`
  - Deleted `case 'web_search':` from switch statement
  - Deleted `handleWebSearch()` private method

### ✅ Enhanced `perplexica_search` Tool
- **Updated description** in `src/tools/index.ts`:
  - Clarified it's the main search tool
  - Added usage instructions for basic web search
  - Made it clear that only `query` parameter is needed for basic search

- **Added default values** in `src/server.ts`:
  - `focusMode: 'webSearch'` (if not provided)
  - `optimizationMode: 'balanced'` (if not provided)

## Benefits

### 🔄 **Simplified API**
- Only one search tool to maintain and document
- No confusion between two similar tools
- Cleaner codebase

### 🎯 **Backward Compatible**
- Basic web search still works with just `query` parameter
- Advanced features available when needed
- Existing clients continue to work

### 📋 **Usage Examples**

**Basic Web Search** (what `web_search` used to do):
```json
{
  "name": "perplexica_search",
  "arguments": {
    "query": "What is Perplexica?"
  }
}
```

**Advanced Search** (unique to `perplexica_search`):
```json
{
  "name": "perplexica_search",
  "arguments": {
    "query": "AI research papers",
    "focusMode": "academicSearch",
    "optimizationMode": "quality",
    "history": [["user", "previous question"], ["assistant", "previous answer"]]
  }
}
```

## Files Changed
- `src/tools/index.ts` - Removed `webSearchTool`, updated description
- `src/server.ts` - Removed `handleWebSearch` method, added default values
- Documentation updated accordingly

## Validation
- ✅ TypeScript compilation successful
- ✅ All tests pass
- ✅ No breaking changes for existing functionality
- ✅ Simplified tool discovery for MCP clients