# ✅ Fix: SearXNG URL Priority - Always Use config.toml

## Vấn đề

Trước đây code đang ưu tiên `SEARXNG_API_URL` environment variable từ docker-compose trước `config.toml`, dẫn đến:
- ❌ Docker-compose set `SEARXNG_API_URL=http://searxng:8080` (internal URL)
- ❌ Code dùng env var thay vì `config.toml` với URL `http://13.228.19.21:4000`
- ❌ Không thể override bằng config.toml

## Giải pháp

### 1. Đổi thứ tự ưu tiên trong code

**File**: `src/lib/config.ts`

**Trước**:
```typescript
export const getSearxngApiEndpoint = () =>
  process.env.SEARXNG_API_URL || loadConfig().API_ENDPOINTS.SEARXNG;
```

**Sau**:
```typescript
export const getSearxngApiEndpoint = () => {
  // Priority: config.toml first, then environment variable as fallback
  // This ensures config.toml is always used when available
  const configValue = loadConfig().API_ENDPOINTS?.SEARXNG;
  if (configValue && configValue.trim() !== '') {
    return configValue;
  }
  // Fallback to environment variable if config.toml is empty
  return process.env.SEARXNG_API_URL || '';
};
```

**Thay đổi**:
- ✅ **config.toml được ưu tiên trước**
- ✅ Env var chỉ là fallback nếu config.toml trống
- ✅ Đảm bảo luôn dùng URL từ config.toml khi có giá trị

### 2. Xóa SEARXNG_API_URL khỏi docker-compose files

**Files đã cập nhật**:

1. ✅ `docker-compose.yaml`
   - Commented out `SEARXNG_API_URL=http://searxng:8080`

2. ✅ `aws-cloudformation/docker-compose-full.yml`
   - Commented out `SEARXNG_API_URL=http://searxng:8080`

3. ✅ `aws-cloudformation/perplexica-simple-ec2.yaml`
   - Commented out `SEARXNG_API_URL=http://searxng:8080`

4. ✅ `aws-cloudformation/perplexica-stack.yaml`
   - Commented out `SEARXNG_API_URL` environment variable

## Kết quả

### Priority Order (Mới)

1. ✅ **config.toml** → `[API_ENDPOINTS]` → `SEARXNG = "http://13.228.19.21:4000"`
2. ⚠️ **Environment Variable** → `SEARXNG_API_URL` (chỉ khi config.toml trống)

### Behavior

- ✅ **Luôn dùng config.toml** khi có giá trị
- ✅ **Env var chỉ là fallback** nếu config.toml trống hoặc không có
- ✅ **Có thể override** bằng cách update config.toml
- ✅ **Không bị override** bởi docker-compose env vars

## Verification

### Test Logic

```javascript
// config.toml value
const configValue = "http://13.228.19.21:4000";

// docker-compose env var
const envValue = "http://searxng:8080";

// New logic
function getSearxngApiEndpoint() {
  if (configValue && configValue.trim() !== '') {
    return configValue; // ✅ Returns config.toml value
  }
  return envValue || '';
}

// Result: "http://13.228.19.21:4000" ✅
```

## Files Changed

1. ✅ `src/lib/config.ts` - Changed priority order
2. ✅ `docker-compose.yaml` - Removed SEARXNG_API_URL
3. ✅ `aws-cloudformation/docker-compose-full.yml` - Removed SEARXNG_API_URL
4. ✅ `aws-cloudformation/perplexica-simple-ec2.yaml` - Removed SEARXNG_API_URL
5. ✅ `aws-cloudformation/perplexica-stack.yaml` - Removed SEARXNG_API_URL

## Usage

### config.toml (dòng 43-44)
```toml
[API_ENDPOINTS]
SEARXNG = "http://13.228.19.21:4000"
```

### Code sẽ luôn dùng giá trị này

```typescript
// src/lib/searxng.ts:137
let searxngURL = getSearxngApiEndpoint();
// ✅ Returns: "http://13.228.19.21:4000" (from config.toml)
```

## Benefits

1. ✅ **Consistent**: Luôn dùng config.toml khi có
2. ✅ **Flexible**: Có thể thay đổi URL bằng cách update config.toml
3. ✅ **No override**: Docker-compose không thể override config.toml
4. ✅ **Backward compatible**: Vẫn fallback về env var nếu config.toml trống

## Migration Notes

- ✅ **No breaking changes**: Code vẫn hoạt động với env var nếu config.toml trống
- ✅ **Recommended**: Luôn set giá trị trong config.toml để đảm bảo consistency
- ✅ **Docker**: config.toml được mount vào container, sẽ được đọc đúng

## Testing

Để verify:
1. Set giá trị trong config.toml: `SEARXNG = "http://13.228.19.21:4000"`
2. Check logs khi search: URL sẽ là `http://13.228.19.21:4000`
3. Không bị override bởi docker-compose env vars

---

**Status**: ✅ **FIXED** - Code luôn dùng config.toml với priority cao nhất

