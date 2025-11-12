# Quick Start: Deploy Cả Perplexica App lên Railway

## Tổng quan

Hiện tại bạn chỉ deploy MCP server. Hướng dẫn này giúp deploy **cả Perplexica Next.js app** lên Railway.

## Option 1: Deploy 2 Services Riêng (Khuyến nghị) ⭐

### Bước 1: Tạo Service cho Next.js App

1. Railway Dashboard → Project → **New Service**
2. **Deploy from GitHub repo** → Chọn repository
3. Railway tự động detect Next.js
4. Verify **Start Command**: `npm start`

### Bước 2: Set Environment Variables

**Next.js App Service** → Settings → Variables:
- Database URLs
- API Keys
- Các config khác

**MCP Server Service** → Settings → Variables:
- `PERPLEXICA_BASE_URL`: URL của Next.js app
  - Cùng project: `http://perplexica-app:3000`
  - Hoặc public: `https://your-app.up.railway.app`

### Bước 3: Lấy URLs

- **Next.js App**: `https://xxx.up.railway.app`
- **MCP Server**: `https://yyy.up.railway.app/v1/sse`

### Bước 4: Update Cursor

Update `~/.cursor/mcp.json` với MCP URL mới (nếu có thay đổi).

## Option 2: Deploy 1 Service (Đơn giản hơn)

### Cách 1: Dùng Concurrently

1. Install: `npm install --save-dev concurrently`
2. Thêm script: `"start:all": "concurrently \"npm start\" \"npm run start:mcp\""`
3. Railway Start Command: `npm run start:all`

### Cách 2: Dùng Next.js API Route

- Deploy chỉ Next.js app
- MCP endpoint: `https://your-app.up.railway.app/api/mcp/v1/sse`
- Update Cursor với URL này

## So sánh

| | Option 1 (2 Services) | Option 2 (1 Service) |
|---|---|---|
| Độ phức tạp | Trung bình | Đơn giản |
| Cost | 2x | 1x |
| Scale | Dễ scale riêng | Phải scale cả 2 |
| Reliability | Tốt hơn | Nếu một crash, cả 2 bị ảnh hưởng |

## Khuyến nghị

**Nên dùng Option 1** vì:
- Tách biệt concerns
- Dễ quản lý
- Có thể scale riêng
- Reliability tốt hơn

## Checklist

- [ ] Tạo service cho Next.js app
- [ ] Set environment variables
- [ ] Cấu hình PERPLEXICA_BASE_URL cho MCP
- [ ] Lấy URLs
- [ ] Update Cursor config
- [ ] Test cả 2 services

## Xem chi tiết

Xem hướng dẫn đầy đủ: `docs/DEPLOY_FULL_APP_RAILWAY.md`


