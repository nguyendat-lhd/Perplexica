# MCP (Model Context Protocol) Integration với Code Mode

Nhánh này dành cho việc tích hợp MCP (Model Context Protocol) với Code Mode vào Perplexica.

## Tổng quan

Đã implement MCP server với Code Mode dựa trên [Cloudflare's Code Mode approach](https://blog.cloudflare.com/code-mode/).

Code Mode cho phép LLM viết TypeScript code để gọi API thay vì sử dụng tool calling trực tiếp, mang lại hiệu quả và linh hoạt hơn.

## Cấu trúc đã tạo

```
src/mcp/
├── types/
│   └── index.ts          # Type definitions
├── tools/
│   └── index.ts          # MCP tool definitions
├── code-mode/
│   ├── api.ts            # TypeScript API wrapper
│   └── executor.ts       # Code execution sandbox
├── server.ts             # MCP server implementation
└── index.ts              # Entry point

src/app/api/mcp/
└── route.ts              # HTTP API endpoint
```

## Đã hoàn thành

- [x] Setup MCP SDK và dependencies
- [x] Tạo cấu trúc thư mục cho MCP server
- [x] Implement MCP tools từ các API hiện có
- [x] Tạo TypeScript API wrapper cho Code Mode
- [x] Implement sandbox để execute code an toàn (sử dụng vm2)
- [x] Tạo MCP server entry point
- [x] Tạo API endpoint để expose MCP server qua HTTP
- [x] Viết documentation

## Cách sử dụng

### Chạy MCP Server

```bash
# Standalone server (stdio)
npm run mcp:server

# Development mode với watch
npm run mcp:dev
```

### Qua HTTP API

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

## MCP Tools có sẵn

1. **perplexica_search** - Perform AI-powered search
2. **perplexica_chat** - Send chat message
3. **perplexica_search_images** - Search for images
4. **perplexica_search_videos** - Search for videos
5. **perplexica_get_models** - Get available models
6. **perplexica_get_config** - Get configuration

## Code Mode API

TypeScript API với các methods:
- `api.search(params)` - Perform AI-powered search
- `api.searchStream(params)` - Stream search results
- `api.chat(params)` - Send chat message
- `api.searchImages(params)` - Search for images
- `api.searchVideos(params)` - Search for videos
- `api.getModels()` - Get available models
- `api.getConfig()` - Get configuration

## Tài liệu

Xem [MCP_CODE_MODE.md](./docs/MCP_CODE_MODE.md) để biết chi tiết.

## Next Steps

- [ ] Test với các MCP clients (Claude Desktop, etc.)
- [ ] Thêm error handling tốt hơn
- [ ] Optimize code execution sandbox
- [ ] Thêm support cho resources
- [ ] Thêm authentication nếu cần
- [ ] Performance testing


