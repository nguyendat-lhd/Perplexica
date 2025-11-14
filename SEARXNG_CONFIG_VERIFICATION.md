# ✅ Verification: SearXNG URL Configuration

## Code Flow Analysis

### 1. Entry Point: `src/lib/searxng.ts`

**Line 137**: 
```typescript
let searxngURL = getSearxngApiEndpoint();
```

### 2. Config Function: `src/lib/config.ts`

**Lines 156-157**:
```typescript
export const getSearxngApiEndpoint = () =>
  process.env.SEARXNG_API_URL || loadConfig().API_ENDPOINTS.SEARXNG;
```

**Priority Order**:
1. ✅ **First**: `process.env.SEARXNG_API_URL` (environment variable)
2. ✅ **Fallback**: `loadConfig().API_ENDPOINTS.SEARXNG` (from config.toml)

### 3. Config Loading: `src/lib/config.ts`

**Lines 70-136**: `loadConfig()` function
- Reads from `config.toml` file in project root
- Path: `path.join(process.cwd(), 'config.toml')`
- Parses TOML format
- Returns `Config` object with `API_ENDPOINTS.SEARXNG`

## ✅ Verification Result

### Code đang dùng đúng config.toml

**Flow**:
```
searchSearxng() 
  → getSearxngApiEndpoint()
    → process.env.SEARXNG_API_URL (if set)
    → OR loadConfig().API_ENDPOINTS.SEARXNG (from config.toml)
      → Reads config.toml from project root
      → Returns API_ENDPOINTS.SEARXNG value
```

### Current Config Value

From `config.toml` (lines 43-44):
```toml
[API_ENDPOINTS]
SEARXNG = "http://13.228.19.21:4000"
```

### Usage in Code

**File**: `src/lib/searxng.ts:137`
- Calls `getSearxngApiEndpoint()`
- Gets value from config.toml if no env var
- Uses it to build search URL: `${searxngURL}/search?format=json`

## ✅ Conclusion

**Code đang dùng đúng URL từ config.toml (dòng 43-44)**

- ✅ Function `getSearxngApiEndpoint()` đọc từ `config.toml`
- ✅ Path: `config.toml` trong project root
- ✅ Section: `[API_ENDPOINTS]`
- ✅ Key: `SEARXNG`
- ✅ Current value: `"http://13.228.19.21:4000"`

## ⚠️ Notes

1. **Environment Variable Priority**: 
   - Nếu có `SEARXNG_API_URL` env var → dùng env var
   - Nếu không có → dùng config.toml

2. **Config File Location**:
   - Must be in project root: `./config.toml`
   - Server-side only (not available in browser)

3. **Format**:
   - TOML format
   - Section: `[API_ENDPOINTS]`
   - Key: `SEARXNG = "http://..."`

## 🔍 How to Verify at Runtime

Add logging to verify:

```typescript
// In src/lib/searxng.ts:137
let searxngURL = getSearxngApiEndpoint();
console.log('[SearXNG Config] Using URL:', searxngURL);
console.log('[SearXNG Config] Source:', process.env.SEARXNG_API_URL ? 'ENV' : 'config.toml');
```

## ✅ Final Verification

- ✅ Code reads from `config.toml`
- ✅ Path is correct: `./config.toml`
- ✅ Section is correct: `[API_ENDPOINTS]`
- ✅ Key is correct: `SEARXNG`
- ✅ Current value matches: `"http://13.228.19.21:4000"`

**Status**: ✅ **CONFIRMED** - Code đang dùng đúng URL từ config.toml

