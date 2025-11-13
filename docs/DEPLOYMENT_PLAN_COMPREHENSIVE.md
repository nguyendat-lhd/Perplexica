# Plan Deploy Perplexica - Kết hợp Docker, Railway MCP, và Railway Full App

## Tổng quan

Plan này tổng hợp 3 phương án deploy Perplexica:
1. **Docker Deployment** - Deploy local hoặc trên server với Docker
2. **Railway MCP Server** - Chỉ deploy MCP server lên Railway
3. **Railway Full App** - Deploy cả Next.js app lên Railway

## Kiến trúc hiện tại

### Docker Deployment (Hiện có)
- **Services**: 
  - `searxng`: Search engine service (port 4000)
  - `app`: Next.js app (port 3000)
- **Volumes**: 
  - `backend-dbstore`: Database storage
  - `uploads`: File uploads
- **Network**: `perplexica-network`
- **Config**: `config.toml` (mounted as volume)

### Railway MCP Server (Đã deploy)
- **Service**: MCP HTTP Server
- **Port**: Railway tự động assign
- **Endpoint**: `/v1/sse`
- **URL**: `https://perplexica-production-1bd4.up.railway.app/v1/sse`

### Railway Full App (Chưa deploy)
- **Service**: Next.js App
- **Port**: Railway tự động assign
- **URL**: Sẽ được tạo khi deploy

## Các Scenarios Deployment

### Scenario 1: Docker Local + Railway MCP (Hiện tại)

**Kiến trúc**:
```
Local Machine:
  ├── Docker Compose
  │   ├── SearxNG (port 4000)
  │   └── Perplexica App (port 3000)
  │
Railway:
  └── MCP Server (port tự động)
      └── Kết nối với Perplexica App qua PERPLEXICA_BASE_URL
```

**Ưu điểm**:
- App chạy local, kiểm soát tốt
- MCP server trên cloud, dễ access từ Cursor
- Cost thấp (chỉ 1 Railway service)

**Nhược điểm**:
- App chỉ accessible từ local
- Cần VPN/port forwarding để access từ xa

**Use Case**: Development, testing, hoặc khi chỉ cần MCP server accessible từ cloud.

**Cấu hình**:
- Docker: Chạy như hiện tại
- Railway MCP: Set `PERPLEXICA_BASE_URL=http://your-public-ip:3000` hoặc dùng ngrok/tunneling

---

### Scenario 2: Docker trên Server + Railway MCP

**Kiến trúc**:
```
Server (VPS/Cloud):
  ├── Docker Compose
  │   ├── SearxNG (port 4000)
  │   └── Perplexica App (port 3000)
  │       └── Public IP/Domain
  │
Railway:
  └── MCP Server
      └── Kết nối với Perplexica App qua public URL
```

**Ưu điểm**:
- App accessible từ internet
- MCP server trên cloud
- Kiểm soát tốt với Docker
- Có thể scale riêng

**Nhược điểm**:
- Cần quản lý server
- Cần setup reverse proxy (Nginx)
- Cần SSL certificate

**Use Case**: Production với server riêng, muốn kiểm soát infrastructure.

**Cấu hình**:
- Server: Deploy Docker Compose
- Nginx: Reverse proxy với SSL
- Railway MCP: Set `PERPLEXICA_BASE_URL=https://your-domain.com`

---

### Scenario 3: Railway Full App + Railway MCP (2 Services)

**Kiến trúc**:
```
Railway:
  ├── Service 1: Perplexica Next.js App
  │   └── URL: https://app.up.railway.app
  │
  └── Service 2: MCP Server
      └── URL: https://mcp.up.railway.app/v1/sse
      └── PERPLEXICA_BASE_URL = Service 1 URL
```

**Ưu điểm**:
- Tất cả trên cloud, không cần server
- Railway quản lý scaling, monitoring
- Dễ deploy và maintain
- Tự động HTTPS

**Nhược điểm**:
- Cost cao hơn (2 services)
- SearxNG cần deploy riêng hoặc dùng external

**Use Case**: Production hoàn toàn trên cloud, không muốn quản lý server.

**Cấu hình**:
- Railway Service 1: Next.js App
- Railway Service 2: MCP Server
- SearxNG: Deploy riêng hoặc dùng external service

---

### Scenario 4: Railway Full App + Railway MCP + Railway SearxNG (3 Services)

**Kiến trúc**:
```
Railway:
  ├── Service 1: Perplexica Next.js App
  ├── Service 2: MCP Server
  └── Service 3: SearxNG (Docker image)
```

**Ưu điểm**:
- Tất cả trên Railway
- Dễ quản lý và scale
- Không cần server riêng

**Nhược điểm**:
- Cost cao nhất (3 services)
- SearxNG có thể tốn nhiều resources

**Use Case**: Production hoàn toàn trên Railway, muốn tất cả services trong một platform.

**Cấu hình**:
- Railway Service 1: Next.js App
- Railway Service 2: MCP Server
- Railway Service 3: SearxNG Docker image

---

### Scenario 5: Hybrid - Docker App + Railway MCP + External SearxNG

**Kiến trúc**:
```
Server/Docker:
  └── Perplexica App (port 3000)
      └── Kết nối với External SearxNG

Railway:
  └── MCP Server
      └── Kết nối với Perplexica App

External:
  └── SearxNG Service (có thể là public instance)
```

**Ưu điểm**:
- Linh hoạt trong việc chọn SearxNG
- Có thể dùng public SearxNG instance
- Cost thấp

**Nhược điểm**:
- Phụ thuộc vào external service
- Có thể có latency

**Use Case**: Khi muốn dùng public SearxNG hoặc SearxNG đã có sẵn.

---

## So sánh các Scenarios

| Scenario | Cost | Complexity | Scalability | Control | Use Case |
|----------|------|------------|-------------|---------|----------|
| 1: Docker Local + Railway MCP | Thấp | Thấp | Thấp | Cao | Development |
| 2: Docker Server + Railway MCP | Trung bình | Trung bình | Trung bình | Cao | Production với server |
| 3: Railway Full + MCP | Trung bình-Cao | Thấp | Cao | Trung bình | Production cloud |
| 4: Railway All Services | Cao | Thấp | Cao | Trung bình | Production hoàn toàn cloud |
| 5: Hybrid | Thấp-Trung bình | Trung bình | Trung bình | Trung bình | Flexible setup |

## Plan chi tiết cho từng Scenario

### Scenario 1: Docker Local + Railway MCP

**Bước 1: Setup Docker Local**
- Chạy `docker compose up -d`
- Verify app tại `http://localhost:3000`
- Config `config.toml` với API keys

**Bước 2: Expose App ra Internet (nếu cần)**
- Option A: Dùng ngrok/tunneling
  - `ngrok http 3000`
  - Lấy public URL
- Option B: Port forwarding trên router
  - Forward port 3000
  - Lấy public IP

**Bước 3: Cấu hình Railway MCP**
- Set `PERPLEXICA_BASE_URL` = public URL của app
- Test kết nối

**Bước 4: Cấu hình Cursor**
- Update `mcp.json` với Railway MCP URL
- Restart Cursor

---

### Scenario 2: Docker Server + Railway MCP

**Bước 1: Setup Server**
- Deploy Docker Compose lên server
- Setup Nginx reverse proxy
- Config SSL với Let's Encrypt
- Verify app accessible qua domain

**Bước 2: Cấu hình Railway MCP**
- Set `PERPLEXICA_BASE_URL` = domain của app
- Test kết nối

**Bước 3: Cấu hình Cursor**
- Update `mcp.json` với Railway MCP URL
- Restart Cursor

---

### Scenario 3: Railway Full App + Railway MCP

**Bước 1: Deploy Next.js App lên Railway**
- Tạo service mới trên Railway
- Deploy từ GitHub repo
- Set environment variables
- Verify app URL

**Bước 2: Deploy SearxNG (nếu cần)**
- Option A: Deploy SearxNG lên Railway (service thứ 3)
- Option B: Dùng external SearxNG service
- Config `SEARXNG_API_URL` trong Next.js app

**Bước 3: Cấu hình Railway MCP**
- Set `PERPLEXICA_BASE_URL` = Next.js app URL
- Test kết nối

**Bước 4: Cấu hình Cursor**
- Update `mcp.json` với Railway MCP URL
- Restart Cursor

---

### Scenario 4: Railway All Services

**Bước 1: Deploy SearxNG lên Railway**
- Tạo service mới
- Deploy Docker image: `docker.io/searxng/searxng:latest`
- Expose port 8080
- Lấy internal URL

**Bước 2: Deploy Next.js App**
- Tạo service mới
- Set `SEARXNG_API_URL` = SearxNG internal URL
- Deploy và verify

**Bước 3: Deploy MCP Server**
- Tạo service mới hoặc dùng service hiện có
- Set `PERPLEXICA_BASE_URL` = Next.js app URL
- Verify

**Bước 4: Cấu hình Cursor**
- Update `mcp.json`
- Restart Cursor

---

### Scenario 5: Hybrid

**Bước 1: Setup Perplexica App**
- Deploy Docker hoặc Railway
- Config `SEARXNG_API_URL` = external SearxNG URL

**Bước 2: Cấu hình Railway MCP**
- Set `PERPLEXICA_BASE_URL` = app URL
- Verify

**Bước 3: Cấu hình Cursor**
- Update `mcp.json`
- Restart Cursor

---

## Migration Path

### Từ Scenario 1 → Scenario 2
1. Setup server với Docker
2. Deploy Docker Compose
3. Setup Nginx + SSL
4. Update Railway MCP `PERPLEXICA_BASE_URL`
5. Test

### Từ Scenario 1 → Scenario 3
1. Tạo Railway service cho Next.js app
2. Deploy app lên Railway
3. Setup SearxNG (Railway hoặc external)
4. Update Railway MCP `PERPLEXICA_BASE_URL`
5. Test

### Từ Scenario 2 → Scenario 3
1. Tạo Railway service cho Next.js app
2. Migrate data từ Docker volumes
3. Deploy app lên Railway
4. Update Railway MCP `PERPLEXICA_BASE_URL`
5. Test và shutdown Docker server

---

## Cost Estimation

### Scenario 1: Docker Local + Railway MCP
- Docker: Free (local)
- Railway MCP: ~$5/tháng (free tier)
- **Total**: ~$0-5/tháng

### Scenario 2: Docker Server + Railway MCP
- Server: $5-20/tháng (VPS)
- Railway MCP: ~$5/tháng
- **Total**: ~$10-25/tháng

### Scenario 3: Railway Full + MCP
- Railway App: ~$5-10/tháng
- Railway MCP: ~$5/tháng
- SearxNG: Free (external) hoặc ~$5/tháng (Railway)
- **Total**: ~$10-20/tháng

### Scenario 4: Railway All Services
- Railway App: ~$5-10/tháng
- Railway MCP: ~$5/tháng
- Railway SearxNG: ~$5/tháng
- **Total**: ~$15-25/tháng

---

## Recommendations

### Development/Testing
→ **Scenario 1**: Docker Local + Railway MCP
- Đơn giản, cost thấp
- Dễ debug và test

### Small Production
→ **Scenario 2**: Docker Server + Railway MCP
- Kiểm soát tốt
- Cost hợp lý
- Có thể scale

### Medium Production
→ **Scenario 3**: Railway Full + MCP
- Dễ quản lý
- Auto-scaling
- Không cần maintain server

### Large Production
→ **Scenario 4**: Railway All Services
- Tất cả trên một platform
- Dễ scale
- Monitoring tập trung

---

## Checklist cho mỗi Scenario

### Scenario 1 Checklist
- [ ] Docker Compose chạy local
- [ ] App accessible tại localhost:3000
- [ ] Railway MCP service đã deploy
- [ ] Set PERPLEXICA_BASE_URL (nếu cần public access)
- [ ] Cursor config đã update
- [ ] Test kết nối

### Scenario 2 Checklist
- [ ] Server đã setup
- [ ] Docker Compose deployed
- [ ] Nginx + SSL configured
- [ ] App accessible qua domain
- [ ] Railway MCP configured
- [ ] Cursor config updated
- [ ] Test kết nối

### Scenario 3 Checklist
- [ ] Railway Next.js app deployed
- [ ] SearxNG configured (Railway hoặc external)
- [ ] Railway MCP configured
- [ ] Environment variables set
- [ ] Cursor config updated
- [ ] Test tất cả services

### Scenario 4 Checklist
- [ ] Railway SearxNG deployed
- [ ] Railway Next.js app deployed
- [ ] Railway MCP configured
- [ ] Internal networking configured
- [ ] Cursor config updated
- [ ] Test tất cả services

---

## Troubleshooting Guide

### Docker Issues
- **App không start**: Check logs `docker compose logs app`
- **Port conflict**: Check ports 3000, 4000 đã được dùng chưa
- **Volume issues**: Check permissions và disk space

### Railway Issues
- **Build failed**: Check build logs, verify dependencies
- **Service không start**: Check start command và env vars
- **Connection issues**: Verify URLs và networking

### MCP Connection Issues
- **Cannot connect**: Check PERPLEXICA_BASE_URL đúng chưa
- **CORS errors**: Set MCP_ALLOWED_ORIGINS
- **Timeout**: Check app có accessible không

---

## Next Steps

1. **Chọn Scenario phù hợp** với use case của bạn
2. **Follow checklist** cho scenario đó
3. **Test thoroughly** trước khi production
4. **Monitor** logs và metrics
5. **Optimize** dựa trên usage patterns

---

## Tài liệu tham khảo

- Docker Deployment: `docs/installation/DOCKER_SETUP_VI.md`
- Railway MCP Deploy: `docs/MCP_RAILWAY_DEPLOY.md`
- Railway Full App: `docs/DEPLOY_FULL_APP_RAILWAY.md`
- Railway Docs: https://docs.railway.app/
- Docker Compose Docs: https://docs.docker.com/compose/





