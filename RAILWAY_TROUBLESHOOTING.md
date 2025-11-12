# Railway Deployment Troubleshooting Guide

## Lỗi 403 Forbidden từ SearXNG

### Triệu chứng
```
Error in preview mode: Error [AxiosError]: Request failed with status code 403
at async a (.next/server/app/api/images/route.js:1:571)
at async u (.next/server/app/api/discover/route.js:1:2337)
```

### Nguyên nhân

Lỗi 403 từ SearXNG có thể do:

1. **Rate Limiting**: SearXNG đang chặn quá nhiều requests từ cùng một IP
2. **Bot Detection**: SearXNG có thể đang chặn requests không có User-Agent hợp lệ
3. **SearXNG Configuration**: Cấu hình SearXNG có thể quá nghiêm ngặt
4. **Network Issues**: Vấn đề kết nối giữa services trên Railway

### Giải pháp

#### 1. Kiểm tra SearXNG Service đang chạy

```bash
# Kiểm tra logs của SearXNG service trên Railway
# Vào Railway Dashboard → SearXNG Service → Logs
```

Đảm bảo SearXNG service đang chạy và không có lỗi.

#### 2. Kiểm tra SEARXNG_API_URL Environment Variable

Trên Railway Dashboard → Perplexica Web App Service → Settings → Variables:

```
SEARXNG_API_URL=http://searxng.railway.internal:8080
```

**Lưu ý quan trọng**:
- Service name phải khớp với tên service SearXNG trên Railway
- Port phải đúng (mặc định là 8080)
- Dùng internal URL (`*.railway.internal`) thay vì public URL

#### 3. Cấu hình SearXNG để giảm rate limiting

Tạo hoặc cập nhật file `searxng/settings.yml`:

```yaml
use_default_settings: true

general:
  instance_name: 'searxng'

search:
  autocomplete: 'google'
  formats:
    - html
    - json

server:
  secret_key: 'a2fb23f1b02e6ee83875b09826990de0f6bd908b6638e8c10277d415f6ab852b'
  # Cho phép requests từ internal network
  bind_address: '0.0.0.0'
  port: 8080

# Giảm rate limiting cho internal requests
limiter:
  enabled: true
  ip_limit:
    # Tăng số requests cho phép
    link_token: true
    # Giảm strictness
    strict_limit: false

engines:
  - name: wolframalpha
    disabled: false
```

#### 4. Cấu hình SearXNG limiter

Cập nhật `searxng/limiter.toml`:

```toml
[botdetection.ip_limit]
# Activate link_token method
link_token = true

# Giảm strictness cho internal network
strict_limit = false
```

#### 5. Redeploy Services

Sau khi thay đổi cấu hình:

1. **Redeploy SearXNG service**:
   - Railway Dashboard → SearXNG Service → Deployments → Redeploy

2. **Redeploy Perplexica Web App**:
   - Railway Dashboard → Perplexica Web App → Deployments → Redeploy

#### 6. Kiểm tra kết nối

Test kết nối từ Perplexica app đến SearXNG:

```bash
# Trong Railway logs của Perplexica app, bạn sẽ thấy:
# SearXNG returned 403 Forbidden. URL: http://searxng.railway.internal:8080/search?...
```

Nếu vẫn thấy 403, kiểm tra:
- SearXNG service name có đúng không
- Port có đúng không
- SearXNG có đang chạy không

### Workaround: Graceful Error Handling

Code đã được cập nhật để xử lý lỗi 403 một cách graceful:

- **Discover route**: Trả về empty array thay vì crash
- **Images route**: Trả về error message rõ ràng
- **Error logging**: Log chi tiết để debug

### Kiểm tra Logs

1. **Perplexica Web App Logs**:
   ```
   Railway Dashboard → Perplexica Web App → Logs
   ```
   Tìm các dòng:
   - `SearXNG returned 403 Forbidden`
   - `Error in preview mode`
   - `Error searching for...`

2. **SearXNG Logs**:
   ```
   Railway Dashboard → SearXNG Service → Logs
   ```
   Tìm các dòng về:
   - Rate limiting
   - Blocked requests
   - Connection errors

## Lỗi npm start trên Railway

### Triệu chứng
```
npm error path /app
npm error command failed
npm error signal SIGTERM
npm error command sh -c next start
```

### Nguyên nhân

Railway có thể đang kill process quá sớm hoặc có vấn đề với start command.

### Giải pháp

#### 1. Kiểm tra railway.json

Đảm bảo `railway.json` ở root có cấu hình đúng:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

#### 2. Cấu hình trên Railway Dashboard

Thay vì dùng `railway.json`, cấu hình trực tiếp trên Dashboard:

1. **Service Settings** → **Deploy**
2. **Start Command**: `npm run start`
3. **Build Command**: `npm install && npm run build`
4. **Healthcheck Path**: `/`
5. **Healthcheck Timeout**: `100`

#### 3. Kiểm tra Port

Đảm bảo app đang listen trên port mà Railway cung cấp:

- Railway tự động set `PORT` environment variable
- Next.js sẽ tự động sử dụng `PORT` nếu có
- Nếu không, Next.js mặc định port 3000

#### 4. Kiểm tra Build Output

Đảm bảo build thành công:

```bash
# Check Railway build logs
# Railway Dashboard → Service → Deployments → Latest → Build Logs
```

Tìm các lỗi:
- `npm install` failures
- `npm run build` failures
- Missing dependencies

#### 5. Sử dụng start.sh Script

Nếu có `start.sh`, đảm bảo nó executable:

```bash
chmod +x start.sh
```

Và cấu hình Railway để dùng script này:

**Start Command**: `./start.sh`

## Debugging Tips

### 1. Kiểm tra Environment Variables

```bash
# Trong Railway logs, bạn có thể thêm:
console.log('SEARXNG_API_URL:', process.env.SEARXNG_API_URL);
```

### 2. Test SearXNG Connection

Thêm endpoint test trong code:

```typescript
// src/app/api/test-searxng/route.ts
import { searchSearxng } from '@/lib/searxng';

export const GET = async () => {
  try {
    const result = await searchSearxng('test', {});
    return Response.json({ success: true, result });
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message,
      status: error.response?.status 
    }, { status: 500 });
  }
};
```

Sau đó test: `https://your-app.railway.app/api/test-searxng`

### 3. Kiểm tra Network Connectivity

Đảm bảo cả 2 services trong cùng Railway project để có thể dùng internal URL.

## Liên hệ và Hỗ trợ

Nếu vẫn gặp vấn đề:

1. Check Railway Status: https://status.railway.app
2. Check Railway Docs: https://docs.railway.app
3. Check SearXNG Docs: https://docs.searxng.org
4. Open issue trên GitHub repo

