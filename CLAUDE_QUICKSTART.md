# Quick Start: Chạy MCP Server với Claude Desktop

Hướng dẫn nhanh để setup Perplexica MCP server với Claude Desktop.

## Bước 1: Đảm bảo Perplexica đang chạy

```bash
# Nếu dùng Docker
docker compose up -d

# Hoặc chạy trực tiếp
npm run dev
```

## Bước 2: Test MCP Server

```bash
# Test server có hoạt động không
npm run mcp:server
```

Nếu thấy "Perplexica MCP Server started", server đã sẵn sàng. Nhấn `Ctrl+C` để dừng.

## Bước 3: Tìm đường dẫn tsx

```bash
# Trong thư mục Perplexica
npm bin
# Hoặc
which tsx
```

Ghi lại đường dẫn để sử dụng trong bước tiếp theo.

## Bước 4: Cấu hình Claude Desktop

### Vị trí file cấu hình

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Tạo file cấu hình

1. Tạo thư mục nếu chưa có:
   ```bash
   # macOS
   mkdir -p ~/Library/Application\ Support/Claude
   ```

2. Tạo hoặc chỉnh sửa file `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "perplexica": {
         "command": "/Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx",
         "args": [
           "/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"
         ],
         "env": {
           "PERPLEXICA_BASE_URL": "http://localhost:3000"
         }
       }
     }
   }
   ```

   **Lưu ý**: Thay `/Users/nguyendat/Working/mcp/Perplexica` bằng đường dẫn thực tế đến thư mục Perplexica của bạn.

## Bước 5: Restart Claude Desktop

Đóng hoàn toàn và mở lại Claude Desktop để load cấu hình MCP mới.

## Bước 6: Sử dụng

Sau khi restart, bạn có thể sử dụng Perplexica trong Claude Desktop:

```
Tìm kiếm "What is Perplexica?" sử dụng Perplexica
```

Hoặc:

```
Hãy tìm kiếm thông tin về machine learning sử dụng Perplexica với chế độ academic search
```

## Troubleshooting

### Server không start

```bash
# Kiểm tra dependencies
npm install

# Test server độc lập
npm run mcp:server
```

### Claude Desktop không nhận diện server

1. Kiểm tra file cấu hình JSON format đúng
2. Đảm bảo đường dẫn là tuyệt đối và đúng
3. Restart Claude Desktop hoàn toàn
4. Kiểm tra logs trong:
   - **macOS**: `~/Library/Logs/Claude/`
   - **Windows**: `%APPDATA%\Claude\Logs\`

### Lỗi "Cannot find module"

```bash
cd /path/to/Perplexica
npm install
```

### Lỗi "Connection refused"

```bash
# Kiểm tra Perplexica có đang chạy không
curl http://localhost:3000/api/config

# Nếu không, khởi động lại
docker compose up -d
# hoặc
npm run dev
```

## Xem thêm

- [Hướng dẫn chi tiết](./docs/MCP_CLAUDE_SETUP.md)
- [MCP Code Mode Documentation](./docs/MCP_CODE_MODE.md)
- [Perplexica API Guide](./docs/API/API_GUIDE_VI.md)

