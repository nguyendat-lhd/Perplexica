# Hướng dẫn Deploy MCP Server lên Railway

Railway là một platform đơn giản để deploy ứng dụng Node.js. Hướng dẫn này sẽ giúp bạn deploy Perplexica MCP Server lên Railway trong vài phút.

## Tổng quan

Railway sẽ:
- Tự động detect Node.js project
- Build và deploy tự động khi push code
- Cung cấp HTTPS và domain tự động
- Quản lý environment variables dễ dàng
- Auto-scaling và monitoring

## Chuẩn bị

### 1. Files đã được tạo sẵn

Các file sau đã được tạo để hỗ trợ Railway deployment:

- `railway.json` - Cấu hình Railway
- `Procfile` - Chỉ định command để chạy
- `package.json` - Đã có script `start:mcp`

### 2. Kiểm tra Environment Variables cần thiết

MCP server cần các biến môi trường sau:

- `PORT` - Railway tự động set (không cần config)
- `PERPLEXICA_BASE_URL` - URL của Perplexica API
- `MCP_ALLOWED_HOSTS` - (Optional) Danh sách hosts được phép
- `MCP_ALLOWED_ORIGINS` - (Optional) Danh sách origins được phép

## Bước 1: Tạo tài khoản Railway

1. Truy cập [Railway.app](https://railway.app/)
2. Đăng ký/Đăng nhập bằng GitHub
3. Xác nhận email nếu cần

## Bước 2: Tạo Project mới

### Option A: Deploy từ GitHub Repository (Khuyến nghị)

1. **Push code lên GitHub** (nếu chưa có):
   ```bash
   git add .
   git commit -m "Add Railway deployment config"
   git push origin main
   ```

2. **Trên Railway Dashboard**:
   - Click **"New Project"**
   - Chọn **"Deploy from GitHub repo"**
   - Chọn repository của bạn
   - Railway sẽ tự động detect và setup

3. **Railway sẽ tự động**:
   - Detect Node.js project
   - Chạy `npm install`
   - Chạy `npm run start:mcp` (từ Procfile hoặc railway.json)
   - Deploy và cung cấp URL

### Option B: Deploy từ Railway CLI

1. **Cài đặt Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Init project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

## Bước 3: Cấu hình Environment Variables

1. Vào **Settings** của service trên Railway
2. Click tab **Variables**
3. Thêm các biến sau:

### Required Variables

```
PERPLEXICA_BASE_URL=https://your-perplexica-api.com
```

**Lưu ý**: 
- Nếu Perplexica API cũng chạy trên Railway, có thể dùng internal service URL
- Nếu chạy local hoặc server khác, dùng public URL

### Optional Variables (Security)

```
MCP_ALLOWED_HOSTS=your-railway-domain.up.railway.app
MCP_ALLOWED_ORIGINS=https://your-railway-domain.up.railway.app
```

**Lưu ý**: Railway sẽ tự động cung cấp domain dạng `xxx.up.railway.app`. Bạn có thể:
- Dùng domain mặc định này
- Hoặc setup custom domain (xem bước 5)

## Bước 4: Kiểm tra Deployment

1. **Xem Logs**:
   - Vào tab **Deployments**
   - Click vào deployment mới nhất
   - Xem logs để đảm bảo không có lỗi

2. **Kiểm tra Service**:
   - Railway sẽ tự động cung cấp URL dạng: `https://xxx.up.railway.app`
   - Test endpoint:
     ```bash
     curl -N -H "Accept: text/event-stream" https://xxx.up.railway.app/v1/sse
     ```

3. **Kiểm tra Health**:
   - Nếu có lỗi, check logs trong Railway dashboard
   - Đảm bảo `PERPLEXICA_BASE_URL` đúng và accessible

## Bước 5: Setup Custom Domain (Optional)

1. Vào **Settings** → **Networking**
2. Click **"Generate Domain"** hoặc **"Custom Domain"**
3. Nếu dùng custom domain:
   - Add domain của bạn
   - Railway sẽ cung cấp DNS records để config
   - Update `MCP_ALLOWED_HOSTS` và `MCP_ALLOWED_ORIGINS` với domain mới

## Bước 6: Cấu hình Cursor

Sau khi deploy thành công, cấu hình Cursor:

1. **Lấy Railway URL**:
   - Vào Railway dashboard
   - Copy URL từ tab **Networking**
   - URL sẽ là: `https://xxx.up.railway.app/v1/sse`

2. **Cấu hình Cursor** (`~/.cursor/mcp.json`):
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

3. **Khởi động lại Cursor**

## Troubleshooting

### Lỗi: Build failed

**Nguyên nhân**: Dependencies không install được

**Giải pháp**:
- Check logs trong Railway để xem lỗi cụ thể
- Đảm bảo `package.json` có đầy đủ dependencies
- Có thể cần thêm `engines` vào `package.json`:
  ```json
  "engines": {
    "node": ">=18.0.0"
  }
  ```

### Lỗi: Port already in use

**Nguyên nhân**: Server không sử dụng PORT từ environment

**Giải pháp**: 
- Đảm bảo `http-server.ts` sử dụng `process.env.PORT` (đã có sẵn)
- Railway tự động set PORT, không cần config

### Lỗi: Cannot connect to Perplexica API

**Nguyên nhân**: `PERPLEXICA_BASE_URL` sai hoặc không accessible

**Giải pháp**:
- Kiểm tra `PERPLEXICA_BASE_URL` trong Railway Variables
- Nếu Perplexica API cũng trên Railway, dùng internal service URL
- Test API URL từ browser hoặc curl

### Lỗi: CORS

**Nguyên nhân**: Origin không được phép

**Giải pháp**:
- Thêm Railway domain vào `MCP_ALLOWED_ORIGINS`
- Hoặc set `MCP_ALLOWED_ORIGINS=*` để cho phép tất cả (chỉ dùng cho dev)

### Lỗi: Service không start

**Nguyên nhân**: Start command sai

**Giải pháp**:
- Kiểm tra `Procfile` có đúng không
- Hoặc check `railway.json` có `startCommand` đúng không
- Đảm bảo script `start:mcp` tồn tại trong `package.json`

## Monitoring và Logs

### Xem Logs

1. Vào Railway dashboard
2. Click vào service
3. Tab **Deployments** → Click deployment → Xem logs

### Metrics

Railway cung cấp metrics tự động:
- CPU usage
- Memory usage
- Network traffic
- Request count

Xem trong tab **Metrics** của service.

## Auto-Deploy

Railway tự động deploy khi:
- Push code lên GitHub (nếu connect GitHub repo)
- Manual trigger từ dashboard
- Railway CLI: `railway up`

## Cost và Limits

Railway có free tier với:
- $5 credit mỗi tháng
- 500 hours runtime
- 100GB bandwidth

Xem chi tiết tại [Railway Pricing](https://railway.app/pricing)

## Best Practices

1. **Environment Variables**:
   - Không commit secrets vào code
   - Sử dụng Railway Variables cho tất cả sensitive data

2. **Monitoring**:
   - Setup alerts trong Railway
   - Monitor logs thường xuyên

3. **Backup**:
   - Railway tự động backup code từ GitHub
   - Backup environment variables nếu cần

4. **Security**:
   - Luôn dùng HTTPS (Railway tự động)
   - Cấu hình `MCP_ALLOWED_HOSTS` và `MCP_ALLOWED_ORIGINS`
   - Không expose sensitive endpoints

## Tài liệu tham khảo

- [Railway Documentation](https://docs.railway.app/)
- [Railway Node.js Guide](https://docs.railway.app/guides/nodejs)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

## Quick Checklist

- [ ] Tạo tài khoản Railway
- [ ] Connect GitHub repository
- [ ] Set `PERPLEXICA_BASE_URL` environment variable
- [ ] (Optional) Set `MCP_ALLOWED_HOSTS` và `MCP_ALLOWED_ORIGINS`
- [ ] Deploy và kiểm tra logs
- [ ] Test endpoint `/v1/sse`
- [ ] Cấu hình Cursor với Railway URL
- [ ] Test kết nối từ Cursor

