# MCP Server với Code Mode - Hướng dẫn Setup

Tài liệu này hướng dẫn cách setup và sử dụng MCP Server với Code Mode cho Perplexica, dựa trên [Cloudflare's Code Mode approach](https://blog.cloudflare.com/code-mode/).

## Tổng quan

Code Mode là một cách tiếp cận mới để sử dụng MCP. Thay vì expose tools trực tiếp cho LLM, chúng ta convert MCP tools thành TypeScript API và để LLM viết code để gọi API đó.

### Lợi ích của Code Mode

1. **LLMs xử lý tốt hơn**: LLMs có nhiều kinh nghiệm với TypeScript hơn là tool calling
2. **Hiệu quả hơn**: LLM có thể viết code để chain nhiều calls mà không cần feed qua neural network mỗi lần
3. **Linh hoạt hơn**: Code có thể xử lý logic phức tạp hơn so với tool calling đơn giản

## Cấu trúc

```
src/mcp/
├── types/           # Type definitions
├── tools/           # MCP tool definitions
├── code-mode/       # Code Mode implementation
│   ├── api.ts       # TypeScript API wrapper
│   └── executor.ts  # Code execution sandbox
├── server.ts        # MCP server implementation
└── index.ts         # Entry point
```

## Setup

### 1. Cài đặt dependencies

Dependencies đã được cài đặt:
- `@modelcontextprotocol/sdk` - MCP SDK
- `vm2` - Sandbox để execute code an toàn
- `tsx` - TypeScript execution

### 2. Chạy MCP Server

#### Standalone Server (stdio)

```bash
npm run mcp:server
```

Server sẽ chạy qua stdio và có thể được kết nối bởi MCP clients.

#### Qua HTTP API

MCP server cũng được expose qua HTTP API tại `/api/mcp`:

```bash
# Get server info
curl http://localhost:3000/api/mcp

# Get Code Mode API
curl http://localhost:3000/api/mcp?mode=code-mode-api

# Execute code
curl -X POST http://localhost:3000/api/mcp/execute-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const result = await api.search({ query: \"What is Perplexica?\", focusMode: \"webSearch\" }); console.log(result.message);"
  }'
```

## Sử dụng Code Mode

### TypeScript API

Code Mode expose một TypeScript API class `PerplexicaAPI`:

```typescript
import { PerplexicaAPI } from './api';

const api = new PerplexicaAPI('http://localhost:3000');

// Perform search
const result = await api.search({
  query: "What is Perplexica?",
  focusMode: "webSearch",
  optimizationMode: "balanced"
});

console.log(result.message);
console.log('Sources:', result.sources);
```

### Available Methods

- `api.search(params)` - Perform AI-powered search
- `api.searchStream(params)` - Stream search results
- `api.chat(params)` - Send chat message
- `api.searchImages(params)` - Search for images
- `api.searchVideos(params)` - Search for videos
- `api.getModels()` - Get available models
- `api.getConfig()` - Get configuration

### Example: Chain Multiple Calls

```typescript
// LLM có thể viết code để chain nhiều calls
const api = new PerplexicaAPI();

// Search first
const searchResult = await api.search({
  query: "latest AI trends",
  focusMode: "webSearch"
});

// Then search for images related to the topic
const images = await api.searchImages({
  query: searchResult.message.split(' ').slice(0, 5).join(' ')
});

// Combine results
console.log('Search:', searchResult.message);
console.log('Related images:', images.images);
```

## MCP Tools

MCP server cũng hỗ trợ traditional tool calling:

### Available Tools

1. **perplexica_search** - Perform AI-powered search
2. **perplexica_chat** - Send chat message
3. **perplexica_search_images** - Search for images
4. **perplexica_search_videos** - Search for videos
5. **perplexica_get_models** - Get available models
6. **perplexica_get_config** - Get configuration

## Configuration

Set environment variable để thay đổi base URL:

```bash
export PERPLEXICA_BASE_URL=http://localhost:3000
```

## Security

Code execution được sandboxed bằng `vm2`:
- Không có access đến filesystem
- Không có access đến network (ngoài Perplexica API)
- Timeout 30 giây
- Limited console access

## Integration với MCP Clients

### Claude Desktop

Thêm vào `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "perplexica": {
      "command": "node",
      "args": ["/path/to/perplexica/src/mcp/index.ts"],
      "env": {
        "PERPLEXICA_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Custom Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['src/mcp/index.ts'],
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0',
}, {
  capabilities: {},
});

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools);

// Call tool
const result = await client.callTool({
  name: 'perplexica_search',
  arguments: {
    query: 'What is Perplexica?',
    focusMode: 'webSearch',
  },
});

console.log(result);
```

## Troubleshooting

### Server không start

- Kiểm tra `PERPLEXICA_BASE_URL` environment variable
- Đảm bảo Perplexica API đang chạy tại URL đó
- Check logs để xem lỗi cụ thể

### Code execution fails

- Kiểm tra code syntax
- Đảm bảo code sử dụng đúng API methods
- Check timeout (mặc định 30 giây)

## Tài liệu tham khảo

- [Cloudflare Code Mode Blog Post](https://blog.cloudflare.com/code-mode/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/servers)


