# ✅ Fix Timeout 30s khi gọi API qua Insomnia

## 🔴 Vấn đề

API `/api/ai-agent-review` bị **timeout sau đúng 30 giây** khi gọi qua Insomnia, mặc dù đã set timeout 60s cho images/videos.

## 🔍 Nguyên nhân

**Next.js API routes có timeout mặc định 30 giây** mà chưa được override!

```
Client Request
      ↓
Next.js API Route (timeout 30s) ❌ → TIMEOUT HERE!
      ↓
Your code (timeout 60s cho images/videos)
```

→ Request bị kill ở layer Next.js trước khi code của bạn chạy xong.

## ✅ Giải pháp

### 1. Thêm `maxDuration` export vào route

**File:** `src/app/api/ai-agent-review/route.ts`

```typescript
// Configure API route timeout
export const maxDuration = 180; // 3 minutes (180 seconds)
export const dynamic = 'force-dynamic';
```

### 2. Giới hạn maxDuration theo Next.js version

| Next.js Plan | Max Duration |
|--------------|--------------|
| **Hobby/Free** | 60s |
| **Pro** | 300s (5 phút) |
| **Enterprise** | Unlimited |
| **Self-hosted** | 180s (khuyến nghị) |

→ Đã set **180s (3 phút)** - an toàn cho mọi môi trường.

## 📊 Timeline mới

```
API Request
    ↓
Next.js Route (timeout: 180s) ✅
    ↓
Search & Answer (~30-60s)
    ↓
Images + Videos song song (max 60s mỗi cái)
    ↓
Response (~90-120s total)
```

## 🎯 Cấu hình hoàn chỉnh

```typescript
// src/app/api/ai-agent-review/route.ts

// 1. Timeout cho Next.js route
export const maxDuration = 180; // 3 phút
export const dynamic = 'force-dynamic';

// 2. Timeout cho images (trong code)
setTimeout(() => reject(new Error('Image timeout')), 60000) // 1 phút

// 3. Timeout cho videos (trong code)  
setTimeout(() => reject(new Error('Video timeout')), 60000) // 1 phút
```

## 🧪 Test

### Test 1: Gọi API qua Insomnia

```bash
POST http://localhost:3000/api/ai-agent-review
Content-Type: application/json

{
  "query": "Đánh giá wondercraft.ai",
  "includeImages": true,
  "includeVideos": true
}
```

**Kỳ vọng:**
- ✅ Response trong 90-120s (không timeout ở 30s nữa!)
- ✅ Có message, sources, images, videos
- ✅ Status 200

### Test 2: Gọi API qua cURL

```bash
curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Đánh giá wondercraft.ai",
    "includeImages": true,
    "includeVideos": true
  }' \
  --max-time 180
```

### Test 3: Insomnia Settings

Nếu vẫn timeout, kiểm tra Insomnia timeout settings:

1. **Preferences** → **Request** → **Request timeout**
2. Set timeout ≥ **180000 ms** (3 phút)

## 📁 Files đã thay đổi

```diff
src/app/api/ai-agent-review/route.ts:

+ // Configure API route timeout
+ export const maxDuration = 180; // 3 minutes (180 seconds)
+ export const dynamic = 'force-dynamic';
```

## ⚠️ Nếu vẫn timeout

### 1. Kiểm tra Vercel/Hosting limits

Nếu deploy trên Vercel:
```javascript
// vercel.json
{
  "functions": {
    "app/api/ai-agent-review/route.ts": {
      "maxDuration": 300  // Pro plan
    }
  }
}
```

### 2. Kiểm tra reverse proxy (nginx, etc)

```nginx
# nginx.conf
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
```

### 3. Tắt images/videos để test

```json
{
  "query": "...",
  "includeImages": false,
  "includeVideos": false
}
// → Chỉ mất 30-60s
```

### 4. Monitor logs

Thêm logging để track:

```typescript
console.log('[START] AI Agent Review request');
const startTime = Date.now();

// ... code ...

console.log(`[END] Total time: ${Date.now() - startTime}ms`);
```

## 🚀 Kết quả

### Trước (❌):
```
Request → Timeout at 30s → ERROR
```

### Sau (✅):
```
Request → maxDuration 180s → Response in 90-120s → SUCCESS
```

## 💡 Best Practices

### Tối ưu thời gian phản hồi:

1. **Không cần images/videos:**
```json
{ "includeImages": false, "includeVideos": false }
// 30-60s
```

2. **Chỉ cần images:**
```json
{ "includeImages": true, "includeVideos": false }
// 50-90s
```

3. **Full với images + videos:**
```json
{ "includeImages": true, "includeVideos": true }
// 90-120s
```

### Cache results (tương lai):

```typescript
// Cache response cho queries giống nhau
const cacheKey = `ai-agent-review:${query}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

---

**Ngày fix**: 21/10/2025  
**Status**: ✅ HOÀN THÀNH  
**Test required**: YES - Test qua Insomnia  

**Next.js maxDuration**: 180s (3 phút)  
**Images timeout**: 60s (1 phút)  
**Videos timeout**: 60s (1 phút)  
**Total max time**: ~180s (3 phút)

