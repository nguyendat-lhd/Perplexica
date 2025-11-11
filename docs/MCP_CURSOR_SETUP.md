# Hướng dẫn Sử dụng Perplexica MCP Server với Cursor

Cursor IDE hỗ trợ MCP (Model Context Protocol) để tích hợp các tools và services vào AI assistant. Hướng dẫn này sẽ giúp bạn setup Perplexica MCP server với Cursor.

## Yêu cầu

- Cursor IDE đã được cài đặt
- Perplexica đang chạy tại `http://localhost:3000` (hoặc URL khác)
- Node.js và npm đã được cài đặt

## Cách 1: Sử dụng MCP Server qua stdio (Recommended)

### Bước 1: Cấu hình Cursor

1. Mở Cursor Settings
2. Tìm phần **MCP Servers** hoặc **Model Context Protocol**
3. Thêm cấu hình mới:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "npm",
      "args": ["run", "mcp:server"],
      "cwd": "/path/to/Perplexica",
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

**Lưu ý**: Thay `/path/to/Perplexica` bằng đường dẫn thực tế đến thư mục Perplexica của bạn.

### Bước 2: Khởi động Perplexica

Đảm bảo Perplexica đang chạy:

```bash
# Nếu dùng Docker
docker compose up -d

# Hoặc nếu chạy trực tiếp
npm run dev
```

### Bước 3: Restart Cursor

Restart Cursor để load cấu hình MCP mới.

### Bước 4: Sử dụng trong Cursor

Sau khi restart, bạn có thể sử dụng Perplexica tools trong Cursor chat:

```
@perplexica_search query="What is Perplexica?" focusMode="webSearch"
```

## Cách 2: Sử dụng qua HTTP API

Nếu stdio không hoạt động, bạn có thể sử dụng HTTP API endpoint.

### Bước 1: Đảm bảo API endpoint đang chạy

```bash
# Test API endpoint
curl http://localhost:3000/api/mcp
```

### Bước 2: Sử dụng trong Code

Bạn có thể gọi MCP API từ code trong Cursor:

```typescript
// Example: Sử dụng Perplexica API trong Cursor
const response = await fetch('http://localhost:3000/api/mcp/execute-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: `
      const result = await api.search({
        query: "What is Perplexica?",
        focusMode: "webSearch"
      });
      console.log(result.message);
    `
  })
});

const result = await response.json();
console.log(result);
```

## Cách 3: Sử dụng Code Mode trong Cursor

Code Mode cho phép bạn viết TypeScript code để sử dụng Perplexica API.

### Bước 1: Get Code Mode API

```bash
curl http://localhost:3000/api/mcp?mode=code-mode-api
```

### Bước 2: Sử dụng trong Cursor Chat

Bạn có thể yêu cầu Cursor AI viết code sử dụng Perplexica:

```
Hãy viết code để search "latest AI trends" sử dụng Perplexica API
```

Cursor sẽ generate code như:

```typescript
import { PerplexicaAPI } from './api';

const api = new PerplexicaAPI('http://localhost:3000');

const result = await api.search({
  query: "latest AI trends",
  focusMode: "webSearch",
  optimizationMode: "balanced"
});

console.log(result.message);
console.log('Sources:', result.sources);
```

## Cấu hình chi tiết cho Cursor

### Cấu hình đầy đủ trong settings.json

Tạo hoặc chỉnh sửa file `~/.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "npm",
      "args": ["run", "mcp:server"],
      "cwd": "/Users/nguyendat/Working/mcp/Perplexica",
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000",
        "NODE_ENV": "production"
      },
      "description": "Perplexica AI-powered search engine MCP server"
    }
  }
}
```

### Sử dụng đường dẫn tuyệt đối

Để đảm bảo hoạt động tốt, sử dụng đường dẫn tuyệt đối:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "/usr/local/bin/node",
      "args": [
        "/Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx",
        "/Users/nguyendat/Working/mcp/Perplexica/src/mcp/index.ts"
      ],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Testing MCP Server

### Test 1: Kiểm tra server có chạy không

```bash
# Trong terminal
npm run mcp:server
```

Nếu thấy message "Perplexica MCP Server started", server đã hoạt động.

### Test 2: Test qua HTTP API

```bash
# Get server info
curl http://localhost:3000/api/mcp

# Expected response:
# {
#   "name": "perplexica-mcp-server",
#   "version": "1.0.0",
#   "codeModeEnabled": true,
#   "tools": [...]
# }
```

### Test 3: Test tool calling

```bash
curl -X POST http://localhost:3000/api/mcp/execute-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const result = await api.search({ query: \"test\", focusMode: \"webSearch\" }); return result;"
  }'
```

## Sử dụng trong Cursor Chat

### Example 1: Search

```
@perplexica_search query="What is machine learning?" focusMode="webSearch"
```

### Example 2: Search với optimization mode

```
@perplexica_search query="Latest AI news" focusMode="webSearch" optimizationMode="speed"
```

### Example 3: Image search

```
@perplexica_search_images query="cute cats"
```

### Example 4: Video search

```
@perplexica_search_videos query="how to cook pasta"
```

### Example 5: Get available models

```
@perplexica_get_models
```

## Troubleshooting

### Lỗi: "Cannot find module"

**Nguyên nhân**: Dependencies chưa được cài đặt hoặc đường dẫn sai.

**Giải pháp**:
```bash
cd /path/to/Perplexica
npm install
```

### Lỗi: "Connection refused"

**Nguyên nhân**: Perplexica API không đang chạy.

**Giải pháp**:
```bash
# Kiểm tra Perplexica có đang chạy không
curl http://localhost:3000/api/config

# Nếu không, khởi động lại
docker compose up -d
# hoặc
npm run dev
```

### Lỗi: "Command not found: npm"

**Nguyên nhân**: npm không có trong PATH của Cursor.

**Giải pháp**: Sử dụng đường dẫn đầy đủ đến npm:
```json
{
  "command": "/usr/local/bin/npm",
  "args": ["run", "mcp:server"]
}
```

Hoặc sử dụng node trực tiếp:
```json
{
  "command": "node",
  "args": [
    "node_modules/.bin/tsx",
    "src/mcp/index.ts"
  ]
}
```

### MCP Server không xuất hiện trong Cursor

**Giải pháp**:
1. Kiểm tra file cấu hình có đúng format JSON không
2. Restart Cursor hoàn toàn
3. Check Cursor logs để xem lỗi cụ thể
4. Đảm bảo đường dẫn `cwd` là tuyệt đối và đúng

### Code execution timeout

**Nguyên nhân**: Code chạy quá lâu (timeout mặc định 30 giây).

**Giải pháp**: Optimize code hoặc break thành các calls nhỏ hơn.

## Advanced Usage

### Custom Base URL

Nếu Perplexica chạy trên URL khác:

```json
{
  "env": {
    "PERPLEXICA_BASE_URL": "http://your-server:3000"
  }
}
```

### Development Mode

Để dễ debug, sử dụng development mode:

```json
{
  "command": "npm",
  "args": ["run", "mcp:dev"]
}
```

### Multiple Instances

Bạn có thể chạy nhiều instances với config khác nhau:

```json
{
  "mcpServers": {
    "perplexica-local": {
      "command": "npm",
      "args": ["run", "mcp:server"],
      "cwd": "/path/to/Perplexica",
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    },
    "perplexica-prod": {
      "command": "npm",
      "args": ["run", "mcp:server"],
      "cwd": "/path/to/Perplexica",
      "env": {
        "PERPLEXICA_BASE_URL": "https://your-production-url.com"
      }
    }
  }
}
```

## Best Practices

1. **Luôn sử dụng đường dẫn tuyệt đối** trong cấu hình
2. **Test server trước** khi configure trong Cursor
3. **Check logs** nếu có vấn đề
4. **Sử dụng environment variables** cho các config khác nhau
5. **Restart Cursor** sau khi thay đổi cấu hình

## Tài liệu tham khảo

- [MCP Code Mode Documentation](./docs/MCP_CODE_MODE.md)
- [Perplexica API Guide](./docs/API/API_GUIDE_VI.md)
- [Cursor MCP Documentation](https://docs.cursor.com/mcp)

## Support

Nếu gặp vấn đề:
1. Check logs trong Cursor
2. Test MCP server độc lập
3. Verify Perplexica API đang chạy
4. Check file cấu hình JSON format


