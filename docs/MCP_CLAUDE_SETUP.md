# Hướng dẫn Setup và Sử dụng Perplexica MCP Server với Claude Desktop

Hướng dẫn chi tiết để cấu hình và sử dụng Perplexica MCP server với Claude Desktop client.

## Yêu cầu

- **Claude Desktop** đã được cài đặt ([Download tại đây](https://claude.ai/download))
- **Perplexica** đang chạy tại `http://localhost:3000` (hoặc URL khác)
- **Node.js** (v18 trở lên) và **npm** đã được cài đặt
- **tsx** đã được cài đặt (sẽ được cài tự động khi chạy `npm install`)

## Bước 1: Đảm bảo Perplexica đang chạy

Trước khi cấu hình Claude Desktop, bạn cần đảm bảo Perplexica đang chạy:

```bash
# Nếu dùng Docker
docker compose up -d

# Hoặc chạy trực tiếp
npm run dev
```

Kiểm tra Perplexica có hoạt động:

```bash
curl http://localhost:3000/api/config
```

Nếu thấy response JSON, Perplexica đã sẵn sàng.

## Bước 2: Test MCP Server độc lập

Test MCP server trước khi cấu hình Claude Desktop:

```bash
cd /path/to/Perplexica
npm run mcp:server
```

Nếu thấy message "Perplexica MCP Server started" (hoặc không có output nếu chạy qua stdio), server đã hoạt động. Nhấn `Ctrl+C` để dừng.

## Bước 3: Tìm đường dẫn đến tsx

Claude Desktop cần đường dẫn tuyệt đối đến `tsx`. Tìm đường dẫn:

```bash
# Trong thư mục Perplexica
npm bin
# Hoặc
which tsx
# Hoặc đường dẫn cụ thể
ls -la node_modules/.bin/tsx
```

Ghi lại đường dẫn này để sử dụng trong bước tiếp theo.

## Bước 4: Cấu hình Claude Desktop

### Vị trí file cấu hình

Claude Desktop sử dụng file cấu hình JSON để quản lý MCP servers:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Tạo hoặc chỉnh sửa file cấu hình

1. Tạo thư mục nếu chưa có:
   ```bash
   # macOS
   mkdir -p ~/Library/Application\ Support/Claude
   
   # Windows (PowerShell)
   New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
   
   # Linux
   mkdir -p ~/.config/Claude
   ```

2. Tạo hoặc chỉnh sửa file `claude_desktop_config.json`:

   **macOS/Linux:**
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   # hoặc
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

   **Windows:**
   ```powershell
   notepad "$env:APPDATA\Claude\claude_desktop_config.json"
   ```

### Cấu hình MCP Server

Thêm cấu hình Perplexica vào file `claude_desktop_config.json`. File này có thể đã có các MCP servers khác, chỉ cần thêm `perplexica` vào object `mcpServers`:

#### Option 1: Sử dụng tsx trực tiếp (Khuyến nghị)

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

#### Option 2: Sử dụng node với tsx

Nếu không tìm thấy `tsx` trong `node_modules/.bin`, bạn có thể sử dụng `node` với `tsx` được cài global:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "node",
      "args": [
        "/usr/local/bin/tsx",
        "/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"
      ],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

#### Option 3: Sử dụng shell script wrapper

Tạo file script wrapper để dễ quản lý:

**macOS/Linux** (`mcp-server.sh`):
```bash
#!/bin/bash
cd /Users/nguyendat/Working/mcp/Perplexica
exec node_modules/.bin/tsx src/mcp/server-entry.ts
```

Cấu hình trong Claude Desktop:
```json
{
  "mcpServers": {
    "perplexica": {
      "command": "/bin/bash",
      "args": [
        "/Users/nguyendat/Working/mcp/Perplexica/mcp-server.sh"
      ],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

**Windows** (`mcp-server.bat`):
```batch
@echo off
cd /d C:\path\to\Perplexica
node_modules\.bin\tsx src\mcp\server-entry.ts
```

Cấu hình:
```json
{
  "mcpServers": {
    "perplexica": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "C:\\path\\to\\Perplexica\\mcp-server.bat"
      ],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Ví dụ file cấu hình đầy đủ

Nếu bạn đã có các MCP servers khác, file sẽ trông như thế này:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    },
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

## Bước 5: Restart Claude Desktop

Sau khi cấu hình xong:

1. **Đóng hoàn toàn Claude Desktop** (không chỉ minimize)
2. **Mở lại Claude Desktop**
3. Claude Desktop sẽ tự động load cấu hình MCP mới

## Bước 6: Kiểm tra kết nối

Sau khi restart Claude Desktop:

1. Mở một conversation mới
2. Kiểm tra xem Perplexica tools có sẵn không bằng cách:
   - Nhập một câu hỏi yêu cầu tìm kiếm
   - Hoặc xem trong Claude's available tools (nếu có UI hiển thị)

## Bước 7: Sử dụng Perplexica trong Claude Desktop

### Ví dụ 1: Tìm kiếm cơ bản

```
Hãy tìm kiếm thông tin về "What is Perplexica?" sử dụng Perplexica
```

Claude sẽ tự động sử dụng tool `perplexica_search` để tìm kiếm.

### Ví dụ 2: Tìm kiếm với focus mode cụ thể

```
Tìm kiếm các bài nghiên cứu học thuật về "machine learning" sử dụng Perplexica với chế độ academic search
```

### Ví dụ 3: Tìm kiếm hình ảnh

```
Tìm kiếm hình ảnh về "cute cats" sử dụng Perplexica
```

### Ví dụ 4: Tìm kiếm video

```
Tìm kiếm video hướng dẫn "how to cook pasta" sử dụng Perplexica
```

### Ví dụ 5: Lấy danh sách models

```
Cho tôi biết các models có sẵn trong Perplexica
```

## Các Tools có sẵn

Perplexica MCP server cung cấp các tools sau:

1. **perplexica_search** - Tìm kiếm AI-powered với nhiều focus modes
   - `query`: Câu hỏi tìm kiếm
   - `focusMode`: `webSearch`, `academicSearch`, `writingAssistant`, `wolframAlphaSearch`, `youtubeSearch`, `redditSearch`
   - `optimizationMode`: `speed`, `balanced`, `quality` (tùy chọn)

2. **perplexica_chat** - Chat với Perplexica
   - `chatId`: ID của chat session
   - `messageId`: ID của message
   - `content`: Nội dung message
   - `focusMode`: Focus mode tương tự search

3. **perplexica_search_images** - Tìm kiếm hình ảnh
   - `query`: Câu hỏi tìm kiếm

4. **perplexica_search_videos** - Tìm kiếm video
   - `query`: Câu hỏi tìm kiếm

5. **perplexica_get_models** - Lấy danh sách models có sẵn

6. **perplexica_get_config** - Lấy cấu hình hiện tại

## Cấu hình nâng cao

### Sử dụng Base URL khác

Nếu Perplexica chạy trên URL khác (ví dụ: production server):

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "/path/to/tsx",
      "args": ["/path/to/server-entry.ts"],
      "env": {
        "PERPLEXICA_BASE_URL": "https://your-perplexica-server.com"
      }
    }
  }
}
```

### Chạy nhiều instances

Bạn có thể cấu hình nhiều instances với các base URL khác nhau:

```json
{
  "mcpServers": {
    "perplexica-local": {
      "command": "/path/to/tsx",
      "args": ["/path/to/server-entry.ts"],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    },
    "perplexica-prod": {
      "command": "/path/to/tsx",
      "args": ["/path/to/server-entry.ts"],
      "env": {
        "PERPLEXICA_BASE_URL": "https://production-server.com"
      }
    }
  }
}
```

## Troubleshooting

### Lỗi: "Cannot find module" hoặc "Command not found"

**Nguyên nhân**: Đường dẫn đến `tsx` hoặc file không đúng, hoặc dependencies chưa được cài đặt.

**Giải pháp**:
```bash
# Cài đặt dependencies
cd /path/to/Perplexica
npm install

# Kiểm tra tsx có tồn tại không
ls -la node_modules/.bin/tsx

# Nếu không có, cài tsx global
npm install -g tsx
```

### Lỗi: "Connection refused" hoặc "ECONNREFUSED"

**Nguyên nhân**: Perplexica API không đang chạy hoặc URL không đúng.

**Giải pháp**:
```bash
# Kiểm tra Perplexica có đang chạy không
curl http://localhost:3000/api/config

# Nếu không, khởi động lại
docker compose up -d
# hoặc
npm run dev

# Kiểm tra URL trong env variable có đúng không
echo $PERPLEXICA_BASE_URL
```

### MCP Server không xuất hiện trong Claude Desktop

**Giải pháp**:
1. Kiểm tra file cấu hình có đúng format JSON không (sử dụng JSON validator)
2. Đảm bảo đường dẫn là tuyệt đối và đúng
3. Restart Claude Desktop hoàn toàn (đóng và mở lại)
4. Kiểm tra Claude Desktop logs:
   - **macOS**: `~/Library/Logs/Claude/`
   - **Windows**: `%APPDATA%\Claude\Logs\`
   - **Linux**: `~/.config/Claude/logs/`

### Lỗi: "Failed to start MCP server"

**Nguyên nhân**: Có lỗi khi khởi động server.

**Giải pháp**:
1. Test server độc lập:
   ```bash
   cd /path/to/Perplexica
   npm run mcp:server
   ```
2. Kiểm tra logs để xem lỗi cụ thể
3. Đảm bảo Node.js version >= 18:
   ```bash
   node --version
   ```

### Claude không sử dụng Perplexica tools

**Nguyên nhân**: Claude có thể không tự động nhận diện khi nào cần sử dụng tools.

**Giải pháp**:
1. Yêu cầu rõ ràng: "Sử dụng Perplexica để tìm kiếm..."
2. Kiểm tra xem tools có được list không bằng cách hỏi Claude: "Bạn có những tools nào?"
3. Thử restart Claude Desktop

### Lỗi timeout

**Nguyên nhân**: Request mất quá nhiều thời gian.

**Giải pháp**:
1. Kiểm tra kết nối mạng
2. Đảm bảo Perplexica đang chạy và responsive
3. Sử dụng `optimizationMode: "speed"` cho các queries đơn giản

## Best Practices

1. **Luôn sử dụng đường dẫn tuyệt đối** trong cấu hình
2. **Test server trước** khi cấu hình trong Claude Desktop
3. **Kiểm tra logs** nếu có vấn đề
4. **Sử dụng environment variables** cho các config khác nhau
5. **Restart Claude Desktop** sau khi thay đổi cấu hình
6. **Giữ file cấu hình trong version control** (nếu làm việc nhóm)

## Tài liệu tham khảo

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Desktop Documentation](https://claude.ai/docs)
- [Perplexica API Guide](./API/API_GUIDE_VI.md)
- [MCP Code Mode Documentation](./MCP_CODE_MODE.md)
- [Cursor Setup Guide](./MCP_CURSOR_SETUP.md)

## Support

Nếu gặp vấn đề:

1. Kiểm tra logs trong Claude Desktop
2. Test MCP server độc lập với `npm run mcp:server`
3. Verify Perplexica API đang chạy
4. Kiểm tra file cấu hình JSON format
5. Đảm bảo đường dẫn là tuyệt đối và đúng

## Ví dụ sử dụng thực tế

### Nghiên cứu học thuật

```
Hãy tìm kiếm các bài nghiên cứu học thuật về "transformer architecture in NLP" 
sử dụng Perplexica với chế độ academic search và tóm tắt các findings chính.
```

### Tìm kiếm thông tin web

```
Tìm kiếm thông tin mới nhất về "AI developments 2024" sử dụng Perplexica 
và cho tôi biết 5 điểm quan trọng nhất.
```

### Tìm kiếm trên Reddit

```
Tìm kiếm các discussion trên Reddit về "best programming languages 2024" 
sử dụng Perplexica và tổng hợp các ý kiến phổ biến.
```

### Tìm kiếm video hướng dẫn

```
Tìm kiếm video hướng dẫn về "how to setup Next.js project" sử dụng Perplexica 
và cho tôi danh sách các video tốt nhất.
```

