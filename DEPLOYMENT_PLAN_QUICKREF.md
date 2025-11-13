# Quick Reference: Plan Deploy Perplexica - 3 Phương án

## Tổng quan nhanh

Có 3 phương án deploy chính:
1. **Docker** - Local hoặc trên server
2. **Railway MCP** - Chỉ MCP server trên Railway
3. **Railway Full** - Cả app trên Railway

## 5 Scenarios kết hợp

### Scenario 1: Docker Local + Railway MCP ⭐ Development
```
Local: Docker Compose (App + SearxNG)
Railway: MCP Server
Cost: ~$0-5/tháng
```

### Scenario 2: Docker Server + Railway MCP ⭐ Production với Server
```
Server: Docker Compose (App + SearxNG)
Railway: MCP Server
Cost: ~$10-25/tháng
```

### Scenario 3: Railway Full + MCP ⭐ Production Cloud
```
Railway: Next.js App + MCP Server
SearxNG: External hoặc Railway
Cost: ~$10-20/tháng
```

### Scenario 4: Railway All Services ⭐ Production Hoàn toàn Cloud
```
Railway: Next.js App + MCP Server + SearxNG
Cost: ~$15-25/tháng
```

### Scenario 5: Hybrid ⭐ Flexible
```
Docker/Railway: App
Railway: MCP Server
External: SearxNG
Cost: ~$5-15/tháng
```

## So sánh nhanh

| Scenario | Cost | Complexity | Scalability | Best For |
|----------|------|------------|-------------|----------|
| 1 | Thấp | Thấp | Thấp | Development |
| 2 | Trung bình | Trung bình | Trung bình | Production với server |
| 3 | Trung bình | Thấp | Cao | Production cloud |
| 4 | Cao | Thấp | Cao | Production hoàn toàn cloud |
| 5 | Thấp-Trung | Trung bình | Trung bình | Flexible setup |

## Quick Start cho mỗi Scenario

### Scenario 1: Docker Local + Railway MCP
1. `docker compose up -d` (local)
2. Railway MCP đã có sẵn
3. Set `PERPLEXICA_BASE_URL` = local URL (nếu cần public)
4. Update Cursor config

### Scenario 2: Docker Server + Railway MCP
1. Deploy Docker Compose lên server
2. Setup Nginx + SSL
3. Railway MCP → Set `PERPLEXICA_BASE_URL` = domain
4. Update Cursor config

### Scenario 3: Railway Full + MCP
1. Railway → New Service → Next.js App
2. Railway → MCP Service (đã có)
3. Set `PERPLEXICA_BASE_URL` = App URL
4. Update Cursor config

### Scenario 4: Railway All Services
1. Railway → SearxNG Service
2. Railway → Next.js App Service
3. Railway → MCP Service
4. Config internal networking
5. Update Cursor config

### Scenario 5: Hybrid
1. Deploy App (Docker hoặc Railway)
2. Railway → MCP Service
3. Config SearxNG (external hoặc Railway)
4. Update Cursor config

## Checklist chung

- [ ] Chọn scenario phù hợp
- [ ] Deploy app (Docker hoặc Railway)
- [ ] Deploy MCP server (Railway)
- [ ] Config `PERPLEXICA_BASE_URL`
- [ ] Config SearxNG (nếu cần)
- [ ] Set environment variables
- [ ] Test app accessible
- [ ] Test MCP endpoint
- [ ] Update Cursor config
- [ ] Test từ Cursor

## Migration Path

- **Local → Server**: Scenario 1 → Scenario 2
- **Server → Cloud**: Scenario 2 → Scenario 3
- **Cloud → Full Cloud**: Scenario 3 → Scenario 4

## Xem chi tiết

Xem plan đầy đủ: `docs/DEPLOYMENT_PLAN_COMPREHENSIVE.md`






