# Plan Deploy MCP Server lên Railway

## Tổng quan

Plan này mô tả các bước và files cần thiết để deploy Perplexica MCP Server lên Railway platform.

## Files đã tạo

### 1. Configuration Files

- **`railway.json`**: Cấu hình Railway service
  - Build command: `npm install`
  - Start command: `npm run start:mcp`
  - Restart policy: ON_FAILURE với max 10 retries

- **`Procfile`**: Chỉ định process để chạy
  - `web: npm run start:mcp`

- **`package.json`**: 
  - Thêm script `start:mcp`: `tsx src/mcp/http-server.ts`
  - Thêm `engines`: `node >= 18.0.0`

### 2. Documentation

- **`docs/MCP_RAILWAY_DEPLOY.md`**: Hướng dẫn chi tiết deploy lên Railway
- **`RAILWAY_QUICKSTART_VI.md`**: Quick start guide tiếng Việt

## Kiến trúc Deployment

```
GitHub Repository
    ↓
Railway (Auto Deploy)
    ↓
Build: npm install
    ↓
Start: npm run start:mcp
    ↓
MCP HTTP Server (Port từ Railway)
    ↓
HTTPS Endpoint: https://xxx.up.railway.app/v1/sse
    ↓
Cursor Client
```

## Environment Variables cần thiết

### Required
- `PORT`: Railway tự động set (không cần config)
- `PERPLEXICA_BASE_URL`: URL của Perplexica API

### Optional (Security)
- `MCP_ALLOWED_HOSTS`: Danh sách hosts được phép
- `MCP_ALLOWED_ORIGINS`: Danh sách origins được phép

## Deployment Flow

### Phase 1: Preparation ✅
- [x] Tạo `railway.json`
- [x] Tạo `Procfile`
- [x] Thêm script `start:mcp` vào `package.json`
- [x] Thêm `engines` vào `package.json`
- [x] Viết documentation

### Phase 2: Railway Setup
- [ ] Tạo tài khoản Railway
- [ ] Connect GitHub repository
- [ ] Railway tự động detect và setup

### Phase 3: Configuration
- [ ] Set environment variables trên Railway
- [ ] Kiểm tra build logs
- [ ] Verify deployment

### Phase 4: Testing
- [ ] Test endpoint `/v1/sse`
- [ ] Verify SSE connection
- [ ] Test từ Cursor

### Phase 5: Production
- [ ] Setup custom domain (optional)
- [ ] Configure security headers
- [ ] Monitor logs và metrics

## Checklist Deploy

### Pre-Deployment
- [x] Code đã được commit và push lên GitHub
- [x] Files cấu hình đã được tạo
- [x] Documentation đã được viết

### Deployment
- [ ] Railway account đã được tạo
- [ ] Repository đã được connect
- [ ] Environment variables đã được set
- [ ] Build thành công
- [ ] Service đang chạy

### Post-Deployment
- [ ] Endpoint accessible
- [ ] Cursor đã được cấu hình
- [ ] Kết nối thành công từ Cursor
- [ ] Monitoring đã được setup

## Troubleshooting Guide

Xem chi tiết trong `docs/MCP_RAILWAY_DEPLOY.md` phần Troubleshooting.

## Next Steps

1. **Ngay lập tức**: 
   - Push code lên GitHub
   - Tạo Railway project
   - Deploy và test

2. **Sau khi deploy thành công**:
   - Cấu hình Cursor
   - Test kết nối
   - Monitor logs

3. **Production ready**:
   - Setup custom domain
   - Configure security
   - Setup alerts

## Tài liệu tham khảo

- Railway Docs: https://docs.railway.app/
- Railway Node.js Guide: https://docs.railway.app/guides/nodejs
- MCP Specification: https://modelcontextprotocol.io

## Notes

- Railway tự động cung cấp HTTPS
- Railway tự động set PORT environment variable
- Railway tự động scale dựa trên traffic
- Free tier có $5 credit/tháng

