# Quick Start: Chạy MCP Server với Cursor

Hướng dẫn nhanh để setup Perplexica MCP server với Cursor IDE.

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

Nếu thấy "Perplexica MCP Server started", server đã sẵn sàng.

## Bước 3: Cấu hình Cursor

### Cách 1: Qua Settings UI

1. Mở Cursor Settings (Cmd/Ctrl + ,)
2. Tìm "MCP" hoặc "Model Context Protocol"
3. Click "Add Server"
4. Điền thông tin:
   - **Name**: `perplexica`
   - **Command**: Đường dẫn đầy đủ đến `tsx` (ví dụ: `/Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx`)
   - **Args**: Đường dẫn đầy đủ đến `src/mcp/server-entry.ts` (ví dụ: `/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts`)
   - **Environment Variables**: 
     - `PERPLEXICA_BASE_URL=http://localhost:3000`
   
   **Lưu ý**: Sử dụng đường dẫn tuyệt đối cho cả Command và Args để tránh lỗi `cwd`.

### Cách 2: Qua Config File (Recommended)

Tạo hoặc chỉnh sửa file cấu hình MCP của Cursor:

**macOS/Linux**: `~/.cursor/mcp_settings.json`  
**Windows**: `%APPDATA%\Cursor\mcp_settings.json`

#### Option 1: Sử dụng tsx trực tiếp (Khuyến nghị)

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "/Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx",
      "args": ["/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

#### Option 2: Sử dụng shell script wrapper

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

#### Option 3: Sử dụng npm với cwd (Có thể không hoạt động)

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "npm",
      "args": ["run", "mcp:server"],
      "cwd": "/Users/nguyendat/Working/mcp/Perplexica",
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

**Lưu ý**: 
- Thay `/Users/nguyendat/Working/mcp/Perplexica` bằng đường dẫn thực tế đến thư mục Perplexica của bạn
- Option 1 là cách đáng tin cậy nhất vì không phụ thuộc vào `cwd`
- Để tìm đường dẫn đến tsx: `which tsx` hoặc `npm bin -g`

## Bước 4: Restart Cursor

Đóng và mở lại Cursor để load cấu hình MCP mới.

## Bước 5: Sử dụng

Sau khi restart, bạn có thể sử dụng Perplexica tools trong Cursor chat:

```
Tìm kiếm "What is Perplexica?" sử dụng Perplexica
```

Hoặc sử dụng tool trực tiếp:

```
@perplexica_search query="What is Perplexica?" focusMode="webSearch"
```

## Troubleshooting

### Server không start

```bash
# Kiểm tra dependencies
npm install

# Test server độc lập
npm run mcp:server
```

### Cursor không nhận diện server

1. Kiểm tra file cấu hình JSON format đúng
2. Đảm bảo đường dẫn `cwd` là tuyệt đối và đúng
3. Check Cursor logs: Help > Toggle Developer Tools > Console
4. Restart Cursor hoàn toàn

### Lỗi "Cannot find module"

```bash
cd /path/to/Perplexica
npm install
```

### Lỗi "Could not read package.json" hoặc "ENOENT"

Lỗi này xảy ra khi Cursor không chạy command trong đúng thư mục. Giải pháp:

1. **Sử dụng đường dẫn tuyệt đối** thay vì `npm run`:
   ```json
   {
     "command": "/full/path/to/node_modules/.bin/tsx",
     "args": ["/full/path/to/src/mcp/server-entry.ts"]
   }
   ```

2. **Hoặc sử dụng shell script wrapper**:
   ```json
   {
     "command": "/bin/bash",
     "args": ["/full/path/to/mcp-server.sh"]
   }
   ```

3. **Tìm đường dẫn tsx**:
   ```bash
   # Trong thư mục Perplexica
   npm bin
   # Hoặc
   which tsx
   ```

## Xem thêm

- [Hướng dẫn chi tiết](./docs/MCP_CURSOR_SETUP.md)
- [MCP Code Mode Documentation](./docs/MCP_CODE_MODE.md)


