# Quick Start: Deploy MCP Server cho Cursor

Hướng dẫn nhanh để deploy Perplexica MCP Server và kết nối với Cursor qua HTTP.

## Bước 1: Chạy MCP HTTP Server

```bash
# Development
npm run mcp:http-server

# Hoặc với PM2 (production)
pm2 start npm --name "perplexica-mcp" -- run mcp:http-server
```

Server sẽ chạy tại `http://localhost:3001` (hoặc port bạn cấu hình).

## Bước 2: Deploy lên Server

### Option A: Deploy trực tiếp

```bash
# Trên server
git clone <your-repo>
cd Perplexica
npm install
npm run build

# Chạy với PM2
pm2 start npm --name "perplexica-mcp" -- run mcp:http-server
pm2 save
```

### Option B: Với Nginx Reverse Proxy

1. Cấu hình Nginx (xem `docs/MCP_DEPLOY.md`)
2. Setup SSL với Let's Encrypt
3. Server sẽ accessible tại `https://mcp.your-domain.com/v1/sse`

## Bước 3: Cấu hình Cursor

Mở file `~/.cursor/mcp.json` và thêm:

```json
{
  "mcpServers": {
    "perplexica": {
      "url": "https://mcp.your-domain.com/v1/sse",
      "type": "http"
    }
  },
  "inputs": []
}
```

**Lưu ý:** 
- Thay `https://mcp.your-domain.com/v1/sse` bằng URL thực tế của bạn
- Nếu test local: `http://localhost:3001/v1/sse`
- URL phải kết thúc bằng `/v1/sse`

## Bước 4: Khởi động lại Cursor

Sau khi cấu hình, khởi động lại Cursor để kết nối.

## Test Kết nối

```bash
# Test SSE endpoint
curl -N -H "Accept: text/event-stream" http://localhost:3001/v1/sse
```

Nếu thấy output SSE stream, server đã hoạt động đúng!

## Xem thêm

- Chi tiết đầy đủ: `docs/MCP_DEPLOY.md`
- Ví dụ cấu hình: `cursor-mcp-http-config.json.example`

