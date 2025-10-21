# 🧪 Hướng dẫn Test Timeout

## ⚠️ VẤN ĐỀ

API vẫn timeout ở 30s mặc dù đã config `maxDuration = 300`

## 🔧 ĐÃ THỰC HIỆN

### 1. Thêm config vào route
```typescript
// src/app/api/ai-agent-review/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes
```

### 2. Tạo test endpoint
```
src/app/api/test-timeout/route.ts
```

### 3. Update next.config.mjs
Thêm experimental config

## 🧪 CÁCH TEST

### Bước 1: Restart server (BẮT BUỘC!)

```bash
# Stop server hiện tại
pkill -f next

# Restart
npm run dev

# Hoặc nếu dùng PM2
pm2 restart perplexica
```

### Bước 2: Test endpoint đơn giản (40s delay)

```bash
# Test qua curl (macOS)
curl "http://localhost:3000/api/test-timeout?delay=40"

# Hoặc qua Insomnia
GET http://localhost:3000/api/test-timeout?delay=40
```

**Kỳ vọng:**
- ✅ Response sau 40s với status 200
- ❌ Nếu timeout ở 30s → Vấn đề ở Next.js config

### Bước 3: Nếu test-timeout OK, test AI agent API

```bash
# Test qua Insomnia
POST http://localhost:3000/api/ai-agent-review
Content-Type: application/json

{
  "query": "ChatGPT",
  "includeImages": false,
  "includeVideos": false
}
```

## 🔍 TROUBLESHOOTING

### Nếu vẫn timeout ở 30s:

#### Option 1: Kiểm tra Next.js version
```bash
npm ls next
# Nếu < 13.5.0 → maxDuration không được support
```

#### Option 2: Thử runtime edge
```typescript
export const runtime = 'edge'; // thay vì 'nodejs'
export const maxDuration = 300;
```

#### Option 3: Tắt production mode
```bash
# Development mode có timeout dài hơn
npm run dev

# Production mode có timeout ngắn hơn
npm run build && npm start
```

#### Option 4: Check server logs
```bash
# Xem logs khi request
tail -f .next/server.log

# Hoặc PM2 logs
pm2 logs perplexica --lines 100
```

#### Option 5: Kiểm tra reverse proxy

Nếu có nginx/apache:
```nginx
# nginx.conf
location /api {
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
}
```

## 📊 DEBUG CHECKLIST

- [ ] Server đã restart?
- [ ] Test endpoint `/api/test-timeout?delay=40` có work không?
- [ ] Có log errors trong console không?
- [ ] Đang chạy dev mode hay production mode?
- [ ] Next.js version >= 13.5.0?
- [ ] Có reverse proxy (nginx, etc) không?
- [ ] Insomnia timeout setting >= 300s?

## 🎯 KẾT QUẢ EXPECTED

### Test 1: test-timeout endpoint
```bash
GET /api/test-timeout?delay=40

Response after 40s:
{
  "success": true,
  "message": "Completed after 40.xx seconds",
  "requestedDelay": 40,
  "actualDelay": "40.xx",
  "timestamp": "2025-10-21T..."
}
```

### Test 2: ai-agent-review (no images/videos)
```bash
POST /api/ai-agent-review
{ "query": "ChatGPT", "includeImages": false, "includeVideos": false }

Response after 30-60s:
{
  "message": "...",
  "sources": [...],
  "images": [],
  "videos": [],
  "metadata": {...}
}
```

### Test 3: ai-agent-review (with images/videos)
```bash
POST /api/ai-agent-review
{ "query": "ChatGPT", "includeImages": true, "includeVideos": true }

Response after 90-120s:
{
  "message": "...",
  "sources": [...],
  "images": [...],
  "videos": [...],
  "metadata": {...}
}
```

## 🚨 NẾU VẪN KHÔNG WORK

Hãy thử approach khác - Tách images/videos thành separate endpoints:

```typescript
// POST /api/ai-agent-review - Chỉ message & sources (nhanh)
// GET /api/ai-agent-review/images?query=... - Riêng images
// GET /api/ai-agent-review/videos?query=... - Riêng videos
```

Hoặc sử dụng streaming response thay vì waiting:

```typescript
// Stream results as they come
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

---

**NOTE:** Hãy chạy test và report kết quả:
1. Test endpoint timeout có work không?
2. Server logs hiển thị gì?
3. Exact error message là gì?

