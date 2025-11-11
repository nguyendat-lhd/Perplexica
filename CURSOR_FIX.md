# Fix cho lỗi "Could not read package.json" khi chạy MCP với Cursor

## Vấn đề

Cursor không respect `cwd` khi chạy `npm run`, dẫn đến lỗi:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

## Giải pháp

### Giải pháp 1: Sử dụng tsx trực tiếp (Khuyến nghị)

Cập nhật file `~/.cursor/mcp_settings.json`:

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

**Thay đường dẫn** `/Users/nguyendat/Working/mcp/Perplexica` bằng đường dẫn thực tế của bạn.

### Giải pháp 2: Sử dụng shell script wrapper

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

### Giải pháp 3: Sử dụng node với tsx

Nếu tsx được cài global:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "tsx",
      "args": ["/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Tìm đường dẫn tsx

```bash
# Trong thư mục Perplexica
cd /Users/nguyendat/Working/mcp/Perplexica

# Kiểm tra tsx local
ls -la node_modules/.bin/tsx

# Hoặc tìm tsx global
which tsx

# Đường dẫn đầy đủ sẽ là:
echo "$(pwd)/node_modules/.bin/tsx"
```

## Test cấu hình

Sau khi cập nhật cấu hình:

1. **Restart Cursor** hoàn toàn
2. **Check logs**: Help > Toggle Developer Tools > Console
3. **Test server**: Nếu thấy "Perplexica MCP Server started" trong logs, đã thành công

## Files đã tạo

- `mcp-server.sh` - Shell script wrapper
- `src/mcp/server-entry.ts` - Entry point có thể chạy trực tiếp

