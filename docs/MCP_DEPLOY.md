# Hướng dẫn Deploy MCP Server lên Server

Tài liệu này hướng dẫn cách deploy Perplexica MCP Server lên server để Cursor có thể kết nối qua HTTP/SSE, tương tự như cách kết nối với MCP Jira.

## Tổng quan

Perplexica MCP Server hỗ trợ 2 cách triển khai:

1. **Standalone HTTP Server** (Khuyến nghị cho production): Chạy như một HTTP server độc lập
2. **Next.js API Route**: Tích hợp vào Next.js app (đang phát triển)

## Cách 1: Standalone HTTP Server (Khuyến nghị)

### Bước 1: Chuẩn bị Server

Đảm bảo server của bạn có:
- Node.js 18+ 
- npm hoặc yarn
- Port mở (mặc định: 3001)

### Bước 2: Clone và Build Project

```bash
# Clone repository
git clone <your-repo-url>
cd Perplexica

# Cài đặt dependencies
npm install
# hoặc
yarn install

# Build project (nếu cần)
npm run build
```

### Bước 3: Cấu hình Environment Variables

Tạo file `.env` hoặc set environment variables:

```bash
# Port cho MCP HTTP server (mặc định: 3001)
PORT=3001

# URL của Perplexica API (nếu deploy riêng)
PERPLEXICA_BASE_URL=http://localhost:3000

# Security (tùy chọn)
MCP_ALLOWED_HOSTS=your-domain.com,api.your-domain.com
MCP_ALLOWED_ORIGINS=https://your-domain.com
```

### Bước 4: Chạy MCP HTTP Server

#### Development

```bash
npm run mcp:http-server
```

#### Production với PM2

```bash
# Cài đặt PM2
npm install -g pm2

# Chạy với PM2
pm2 start npm --name "perplexica-mcp" -- run mcp:http-server

# Hoặc với tsx trực tiếp
pm2 start node_modules/.bin/tsx --name "perplexica-mcp" -- src/mcp/http-server.ts

# Lưu cấu hình PM2
pm2 save
pm2 startup
```

#### Production với systemd

Tạo file `/etc/systemd/system/perplexica-mcp.service`:

```ini
[Unit]
Description=Perplexica MCP HTTP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Perplexica
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="PERPLEXICA_BASE_URL=http://localhost:3000"
ExecStart=/usr/bin/npm run mcp:http-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Sau đó:

```bash
sudo systemctl daemon-reload
sudo systemctl enable perplexica-mcp
sudo systemctl start perplexica-mcp
sudo systemctl status perplexica-mcp
```

### Bước 5: Cấu hình Reverse Proxy (Nginx)

Nếu bạn muốn expose qua domain với HTTPS:

```nginx
server {
    listen 80;
    server_name mcp.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE specific settings
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400;
    }
}
```

Sau đó cấu hình SSL với Let's Encrypt:

```bash
sudo certbot --nginx -d mcp.your-domain.com
```

### Bước 6: Cấu hình Firewall

```bash
# Mở port 3001 (hoặc port bạn đã chọn)
sudo ufw allow 3001/tcp

# Hoặc chỉ cho phép từ localhost nếu dùng reverse proxy
sudo ufw allow from 127.0.0.1 to any port 3001
```

## Cách 2: Docker Deployment

### Tạo Dockerfile cho MCP Server

Tạo file `Dockerfile.mcp`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --production || yarn install --frozen-lockfile --production

# Copy source code
COPY . .

# Build project
RUN npm run build || yarn build

# Expose MCP server port
EXPOSE 3001

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Start MCP HTTP server
CMD ["npm", "run", "mcp:http-server"]
```

### Build và Run Docker Container

```bash
# Build image
docker build -f Dockerfile.mcp -t perplexica-mcp:latest .

# Run container
docker run -d \
  --name perplexica-mcp \
  -p 3001:3001 \
  -e PORT=3001 \
  -e PERPLEXICA_BASE_URL=http://localhost:3000 \
  --restart unless-stopped \
  perplexica-mcp:latest

# View logs
docker logs -f perplexica-mcp
```

### Docker Compose

Thêm vào `docker-compose.yaml`:

```yaml
services:
  perplexica-mcp:
    build:
      context: .
      dockerfile: Dockerfile.mcp
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - PERPLEXICA_BASE_URL=http://perplexica-api:3000
      - MCP_ALLOWED_HOSTS=your-domain.com
      - MCP_ALLOWED_ORIGINS=https://your-domain.com
    restart: unless-stopped
    networks:
      - perplexica-network
```

## Cấu hình Cursor

Sau khi deploy MCP server, cấu hình Cursor để kết nối:

### 1. Mở Cursor Settings

- Mở Cursor
- Đi tới **Settings** → **Features** → **Model Context Protocol**
- Hoặc chỉnh sửa file cấu hình trực tiếp: `~/.cursor/mcp.json`

### 2. Thêm Cấu hình MCP Server

Thêm vào file `mcp.json`:

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
- Nếu deploy local, có thể dùng `http://localhost:3001/v1/sse`
- Đảm bảo URL kết thúc bằng `/v1/sse`

### 3. Khởi động lại Cursor

Sau khi cấu hình, khởi động lại Cursor để kết nối với MCP server.

## Kiểm tra Kết nối

### Test từ Terminal

```bash
# Test SSE endpoint
curl -N -H "Accept: text/event-stream" \
     https://mcp.your-domain.com/v1/sse

# Test với POST request
curl -X POST https://mcp.your-domain.com/v1/sse \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Kiểm tra Logs

```bash
# PM2
pm2 logs perplexica-mcp

# systemd
sudo journalctl -u perplexica-mcp -f

# Docker
docker logs -f perplexica-mcp
```

## Troubleshooting

### Lỗi: Connection refused

- Kiểm tra MCP server có đang chạy không
- Kiểm tra firewall có chặn port không
- Kiểm tra reverse proxy configuration

### Lỗi: CORS

- Thêm domain của bạn vào `MCP_ALLOWED_ORIGINS`
- Kiểm tra CORS headers trong response

### Lỗi: Session không được tạo

- Kiểm tra logs để xem có lỗi gì không
- Đảm bảo request có header `Accept: text/event-stream` cho GET requests

### Lỗi: 404 Not Found

- Đảm bảo URL kết thúc bằng `/v1/sse`
- Kiểm tra reverse proxy có route đúng không

## Security Best Practices

1. **Sử dụng HTTPS**: Luôn sử dụng HTTPS trong production
2. **Cấu hình Allowed Hosts/Origins**: Giới hạn domains có thể kết nối
3. **Firewall**: Chỉ mở port cần thiết
4. **Rate Limiting**: Cân nhắc thêm rate limiting nếu cần
5. **Authentication**: Có thể thêm authentication nếu cần bảo mật cao hơn

## Monitoring

### Health Check Endpoint

Có thể thêm health check endpoint vào `http-server.ts`:

```typescript
if (req.url === '/health') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', sessions: activeSessions.size }));
  return;
}
```

### Metrics

Có thể tích hợp với monitoring tools như:
- Prometheus
- Grafana
- Datadog
- New Relic

## Tài liệu tham khảo

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Cursor MCP Setup](https://docs.cursor.com/mcp)

