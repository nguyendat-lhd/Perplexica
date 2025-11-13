# Debug: "No server info found" trong Cursor

## Vấn đề

Cursor hiển thị lỗi "No server info found" khi cố kết nối với MCP server.

## Nguyên nhân có thể

1. **Server không start được** - Có lỗi khi khởi động server
2. **Cấu hình không đúng** - Đường dẫn hoặc command sai
3. **Server crash ngay sau khi start** - Có exception không được handle
4. **MCP protocol không đúng** - Server không gửi đúng initialize message

## Cách debug

### Bước 1: Test server độc lập

```bash
cd /Users/nguyendat/Working/mcp/Perplexica
node_modules/.bin/tsx src/mcp/server-entry.ts
```

Nếu server start được, bạn sẽ thấy message "Perplexica MCP Server started" (hoặc không có output nếu chạy qua stdio).

### Bước 2: Kiểm tra cấu hình Cursor

Mở file `~/.cursor/mcp_settings.json` và đảm bảo:

1. **Đường dẫn đúng**:
   ```json
   {
     "command": "/Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx",
     "args": ["/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"]
   }
   ```

2. **File tồn tại**:
   ```bash
   ls -la /Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx
   ls -la /Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts
   ```

### Bước 3: Check Cursor logs

1. Mở Cursor
2. Help > Toggle Developer Tools
3. Xem Console tab
4. Tìm các lỗi liên quan đến MCP

### Bước 4: Test với echo để verify cấu hình

Tạo file test:

```bash
echo '#!/bin/bash
echo "Test script running"
echo "PWD: $(pwd)"
echo "Args: $@"' > /tmp/test-mcp.sh
chmod +x /tmp/test-mcp.sh
```

Cấu hình tạm thời trong Cursor:

```json
{
  "mcpServers": {
    "test": {
      "command": "/bin/bash",
      "args": ["/tmp/test-mcp.sh"]
    }
  }
}
```

Nếu test script chạy được, vấn đề nằm ở server code. Nếu không, vấn đề ở cấu hình Cursor.

## Giải pháp

### Giải pháp 1: Sử dụng node trực tiếp

Nếu tsx không hoạt động, thử compile và chạy với node:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "node",
      "args": [
        "--loader", "ts-node/esm",
        "/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"
      ]
    }
  }
}
```

### Giải pháp 2: Sử dụng shell script wrapper

Đã có sẵn file `mcp-server.sh`:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "/bin/bash",
      "args": ["/Users/nguyendat/Working/mcp/Perplexica/mcp-server.sh"],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Giải pháp 3: Check dependencies

```bash
cd /Users/nguyendat/Working/mcp/Perplexica
npm install
```

### Giải pháp 4: Verify Perplexica API đang chạy

```bash
curl http://localhost:3000/api/config
```

Nếu không có response, Perplexica chưa chạy. Khởi động:

```bash
docker compose up -d
# hoặc
npm run dev
```

## Logs để check

Trong Cursor Developer Tools, tìm các messages:
- `Starting new stdio process` - Cursor đang cố start server
- `Client closed` - Server đã đóng connection
- `No server info found` - Server không gửi thông tin về capabilities

## Next Steps

1. Test server độc lập trước
2. Verify cấu hình Cursor
3. Check logs chi tiết
4. Thử các giải pháp trên theo thứ tự








