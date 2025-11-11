# Quick Start: Deploy MCP Server lên Railway

Hướng dẫn nhanh để deploy Perplexica MCP Server lên Railway.

## Bước 1: Chuẩn bị Code

Đảm bảo các file sau đã có trong repo:
- ✅ `railway.json`
- ✅ `Procfile`
- ✅ `package.json` có script `start:mcp`

## Bước 2: Push lên GitHub

```bash
git add .
git commit -m "Add Railway deployment"
git push origin main
```

## Bước 3: Deploy trên Railway

1. Truy cập [railway.app](https://railway.app/)
2. Login với GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Chọn repository của bạn
5. Railway sẽ tự động deploy

## Bước 4: Cấu hình Environment Variables

Vào **Settings** → **Variables**, thêm:

```
PERPLEXICA_BASE_URL=https://your-perplexica-api.com
```

(Optional) Security:
```
MCP_ALLOWED_HOSTS=xxx.up.railway.app
MCP_ALLOWED_ORIGINS=https://xxx.up.railway.app
```

## Bước 5: Lấy URL và Cấu hình Cursor

1. Vào tab **Networking** trên Railway
2. Copy URL (dạng `https://xxx.up.railway.app`)
3. Cấu hình Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "perplexica": {
      "url": "https://xxx.up.railway.app/v1/sse",
      "type": "http"
    }
  },
  "inputs": []
}
```

4. Khởi động lại Cursor

## Test

```bash
curl -N -H "Accept: text/event-stream" https://xxx.up.railway.app/v1/sse
```

## Xem thêm

Chi tiết đầy đủ: `docs/MCP_RAILWAY_DEPLOY.md`

