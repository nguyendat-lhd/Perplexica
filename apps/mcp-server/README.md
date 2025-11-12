# Perplexica MCP Server

Standalone MCP Server package cho Perplexica, có thể chạy độc lập hoặc như một phần của monorepo.

## Cấu trúc

```
apps/mcp-server/
├── src/
│   ├── server.ts              # MCP Server implementation
│   ├── http-server.ts          # HTTP Server (SSE endpoint)
│   ├── index.ts                # Stdio entry point
│   ├── tools/                  # MCP tools
│   ├── code-mode/              # Code Mode functionality
│   └── types/                  # TypeScript types
├── package.json
└── tsconfig.json
```

## Scripts

```bash
# Development (watch mode)
bun run dev

# Start HTTP server
bun run start

# Start stdio server (for Claude Desktop)
bun run start:stdio

# Build
bun run build
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `PERPLEXICA_BASE_URL`: Base URL of Perplexica API (default: http://localhost:3000)
- `MCP_ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `MCP_ALLOWED_ORIGINS`: Comma-separated list of allowed origins

## Usage

### HTTP Server Mode

```bash
# From root
npm run dev:mcp

# Or directly
cd apps/mcp-server
bun run start
```

Server sẽ chạy trên `http://localhost:3001` với endpoint `/v1/sse`

### Stdio Mode

```bash
# From root
npm run mcp:server

# Or directly
cd apps/mcp-server
bun run start:stdio
```

## Dependencies

Chỉ cần các dependencies tối thiểu:
- `@modelcontextprotocol/sdk`: MCP SDK
- `axios`: HTTP client
- `vm2`: Code execution (for Code Mode)

## Notes

- MCP server giao tiếp với Perplexica qua HTTP API
- Không phụ thuộc vào code của Perplexica web app
- Có thể deploy độc lập

