# Hướng dẫn Deploy Cả Perplexica App lên Railway

## Tổng quan

Hiện tại bạn đã deploy MCP server riêng lên Railway. Hướng dẫn này sẽ giúp bạn deploy **cả Perplexica Next.js app** lên Railway, với các options khác nhau.

## Kiến trúc Deployment

Có 2 cách tiếp cận:

### Option 1: Deploy 2 Services Riêng Biệt (Khuyến nghị)
- **Service 1**: Perplexica Next.js App (port 3000)
- **Service 2**: MCP HTTP Server (port 3001)

**Ưu điểm**:
- Tách biệt concerns
- Scale độc lập
- Dễ quản lý và debug

### Option 2: Deploy 1 Service với Multiple Processes
- Chạy cả Next.js app và MCP server trong cùng một service

**Ưu điểm**:
- Đơn giản hơn
- Chỉ cần 1 service

**Nhược điểm**:
- Khó scale riêng biệt
- Nếu một process crash, cả hai đều bị ảnh hưởng

## Option 1: Deploy 2 Services Riêng Biệt (Khuyến nghị)

### Bước 1: Tạo Service cho Next.js App

1. **Trên Railway Dashboard**:
   - Vào project hiện tại
   - Click **"New Service"**
   - Chọn **"Deploy from GitHub repo"**
   - Chọn cùng repository

2. **Cấu hình Service**:
   - Railway sẽ tự động detect Next.js
   - Nếu không, vào **Settings** → **Deploy**:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - Hoặc để Railway tự detect (thường sẽ tự động)

3. **Environment Variables**:
   - Vào **Settings** → **Variables**
   - Thêm các biến cần thiết cho Next.js app:
     - Database URLs
     - API Keys
     - Các config khác mà app cần

### Bước 2: Cấu hình Service cho MCP Server

1. **Giữ nguyên service MCP hiện tại** hoặc tạo service mới:
   - Service name: `perplexica-mcp`
   - **Start Command**: `npm run start:mcp`
   - **Environment Variables**:
     - `PERPLEXICA_BASE_URL`: URL của Next.js app service
     - `PORT`: Railway tự động set

2. **Lấy Internal Service URL**:
   - Railway cung cấp internal service URL dạng: `http://service-name:port`
   - Hoặc dùng public URL: `https://your-app.up.railway.app`

### Bước 3: Cấu hình Networking

1. **Next.js App Service**:
   - Railway tự động tạo public URL
   - Có thể setup custom domain trong **Settings** → **Networking**

2. **MCP Server Service**:
   - Railway tự động tạo public URL
   - URL sẽ là: `https://mcp-service.up.railway.app`
   - Endpoint: `https://mcp-service.up.railway.app/v1/sse`

### Bước 4: Cấu hình Environment Variables

#### Next.js App Service:
```
DATABASE_URL=...
API_KEYS=...
# Các biến khác mà app cần
```

#### MCP Server Service:
```
PERPLEXICA_BASE_URL=https://your-nextjs-app.up.railway.app
MCP_ALLOWED_HOSTS=your-mcp-service.up.railway.app
MCP_ALLOWED_ORIGINS=https://cursor.sh,app://cursor
```

**Lưu ý**: 
- Nếu cả 2 services trong cùng Railway project, có thể dùng internal URL
- Railway internal URL format: `http://service-name:port`

### Bước 5: Update Cursor Config

Sau khi deploy MCP service, update Cursor config với URL mới:

```json
{
  "mcpServers": {
    "perplexica": {
      "url": "https://your-mcp-service.up.railway.app/v1/sse",
      "type": "http"
    }
  }
}
```

## Option 2: Deploy 1 Service với Multiple Processes

### Cách 1: Sử dụng Concurrent Processes

1. **Cài đặt concurrently**:
   ```bash
   npm install --save-dev concurrently
   ```

2. **Tạo script trong package.json**:
   ```json
   "start:all": "concurrently \"npm start\" \"npm run start:mcp\""
   ```

3. **Cấu hình Railway**:
   - **Start Command**: `npm run start:all`
   - Railway sẽ chạy cả 2 processes

**Lưu ý**: 
- Cần đảm bảo cả 2 processes không conflict về port
- MCP server sẽ dùng PORT từ Railway
- Next.js app sẽ dùng port khác (có thể set qua env var)

### Cách 2: Chạy MCP qua Next.js API Route

1. **Sử dụng API route đã có** (`src/app/api/mcp/v1/sse/route.ts`)
2. **Deploy chỉ Next.js app**:
   - **Start Command**: `npm start`
   - MCP endpoint sẽ accessible qua: `https://your-app.up.railway.app/api/mcp/v1/sse`

**Lưu ý**: 
- Cần đảm bảo API route hoạt động đúng với Next.js production mode
- Có thể cần điều chỉnh code để tương thích

## So sánh các Options

| Tiêu chí | Option 1 (2 Services) | Option 2 (1 Service) |
|----------|----------------------|----------------------|
| Độ phức tạp | Trung bình | Đơn giản |
| Scale | Dễ scale riêng | Phải scale cả 2 |
| Cost | 2 services | 1 service |
| Debugging | Dễ debug riêng | Khó debug hơn |
| Reliability | Tốt hơn | Nếu một crash, cả 2 bị ảnh hưởng |

## Khuyến nghị

**Nên dùng Option 1** (2 Services riêng biệt) vì:
- Tách biệt concerns
- Dễ quản lý và maintain
- Có thể scale riêng biệt
- Nếu một service có vấn đề, service kia vẫn hoạt động

## Các bước thực hiện (Option 1)

### 1. Tạo Service cho Next.js App

1. Railway Dashboard → Project → **New Service**
2. **Deploy from GitHub repo** → Chọn repository
3. Railway tự động detect Next.js
4. Vào **Settings** → **Deploy**:
   - Verify **Build Command**: `npm install && npm run build`
   - Verify **Start Command**: `npm start`

### 2. Cấu hình Environment Variables cho Next.js App

Vào **Settings** → **Variables**, thêm:
- Database URLs
- API Keys (OpenAI, Anthropic, etc.)
- Các config khác

### 3. Cấu hình MCP Server Service

1. Vào service MCP hiện tại
2. **Settings** → **Variables**:
   - `PERPLEXICA_BASE_URL`: URL của Next.js app service
     - Nếu cùng project: `http://perplexica-app:3000`
     - Hoặc public URL: `https://your-app.up.railway.app`

### 4. Lấy URLs

1. **Next.js App URL**:
   - Railway Dashboard → Next.js service → **Networking**
   - Copy URL: `https://xxx.up.railway.app`

2. **MCP Server URL**:
   - Railway Dashboard → MCP service → **Networking**
   - Copy URL: `https://yyy.up.railway.app`
   - Endpoint: `https://yyy.up.railway.app/v1/sse`

### 5. Update Cursor Config

Update `~/.cursor/mcp.json` với MCP URL mới (nếu có thay đổi).

### 6. Test

1. **Test Next.js App**:
   - Mở browser: `https://your-app.up.railway.app`
   - Đảm bảo app load đúng

2. **Test MCP Server**:
   ```bash
   curl -N -H "Accept: text/event-stream" \
        https://your-mcp-service.up.railway.app/v1/sse
   ```

3. **Test từ Cursor**:
   - Restart Cursor
   - Thử sử dụng MCP tools

## Troubleshooting

### Next.js App không build được

**Nguyên nhân**: Thiếu dependencies hoặc build errors

**Giải pháp**:
- Check build logs trong Railway
- Đảm bảo tất cả dependencies đã được install
- Check `next.config.mjs` có đúng không

### Next.js App không start

**Nguyên nhân**: Port conflict hoặc missing env vars

**Giải pháp**:
- Railway tự động set PORT, không cần config
- Đảm bảo tất cả env vars đã được set
- Check logs để xem lỗi cụ thể

### MCP Server không kết nối được với Next.js App

**Nguyên nhân**: `PERPLEXICA_BASE_URL` sai

**Giải pháp**:
- Nếu cùng project: dùng internal URL `http://service-name:port`
- Nếu khác project: dùng public URL `https://your-app.up.railway.app`
- Test URL từ browser hoặc curl

### Database không hoạt động

**Nguyên nhân**: Database URL sai hoặc không accessible

**Giải pháp**:
- Railway có thể cung cấp database service
- Hoặc dùng external database
- Đảm bảo DATABASE_URL đúng format

## Cost Estimation

Railway pricing:
- Free tier: $5 credit/tháng
- Mỗi service tính phí riêng
- Option 1: 2 services = 2x cost
- Option 2: 1 service = 1x cost

## Best Practices

1. **Environment Variables**:
   - Không commit secrets vào code
   - Sử dụng Railway Variables
   - Backup env vars nếu cần

2. **Monitoring**:
   - Xem logs thường xuyên
   - Setup alerts nếu có
   - Monitor metrics

3. **Security**:
   - Luôn dùng HTTPS (Railway tự động)
   - Cấu hình CORS đúng cách
   - Không expose sensitive endpoints

4. **Backup**:
   - Railway tự động backup code từ GitHub
   - Backup database nếu có
   - Backup env vars

## Tài liệu tham khảo

- Railway Documentation: https://docs.railway.app/
- Railway Next.js Guide: https://docs.railway.app/guides/nextjs
- Railway Multiple Services: https://docs.railway.app/develop/services

## Checklist

### Option 1 (2 Services):
- [ ] Tạo service cho Next.js app
- [ ] Cấu hình build và start commands
- [ ] Set environment variables cho Next.js app
- [ ] Cấu hình MCP server service
- [ ] Set PERPLEXICA_BASE_URL cho MCP server
- [ ] Lấy URLs cho cả 2 services
- [ ] Update Cursor config với MCP URL
- [ ] Test Next.js app
- [ ] Test MCP server
- [ ] Test từ Cursor

### Option 2 (1 Service):
- [ ] Cài đặt concurrently (nếu cần)
- [ ] Tạo script start:all
- [ ] Cấu hình Railway với start:all
- [ ] Set environment variables
- [ ] Test cả 2 processes
- [ ] Test từ Cursor








