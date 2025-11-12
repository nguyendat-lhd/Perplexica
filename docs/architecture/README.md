# Kiến trúc Perplexica

Tài liệu này mô tả kiến trúc tổng thể của Perplexica - một công cụ tìm kiếm được hỗ trợ bởi AI, mã nguồn mở.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Các thành phần chính](#các-thành-phần-chính)
- [Luồng dữ liệu](#luồng-dữ-liệu)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Điểm mở rộng](#điểm-mở-rộng)

---

## Tổng quan

Perplexica là một công cụ tìm kiếm AI mã nguồn mở được xây dựng trên Next.js, sử dụng LangChain để quản lý các chuỗi xử lý AI và SearXNG để tìm kiếm web. Hệ thống hỗ trợ nhiều chế độ tìm kiếm (focus modes), tích hợp với nhiều nhà cung cấp LLM, và cung cấp API MCP để tích hợp với các công cụ khác.

### Đặc điểm chính

- **Tìm kiếm web thông minh**: Sử dụng AI để tối ưu hóa truy vấn và rerank kết quả
- **Nhiều chế độ tìm kiếm**: Web, Academic, Writing Assistant, YouTube, Reddit, Wolfram Alpha
- **Hỗ trợ nhiều LLM**: OpenAI, Anthropic, Groq, Ollama, Gemini, DeepSeek, và các mô hình local
- **MCP Server**: Tích hợp với Model Context Protocol để sử dụng như một công cụ
- **Code Mode**: Cho phép thực thi code và tìm kiếm tools động

---

## Kiến trúc hệ thống

### Sơ đồ kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Next.js    │  │   React      │  │  Components  │    │
│  │   Pages      │  │   Hooks      │  │   & UI       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  /api/chat   │  │ /api/search  │  │ /api/images  │    │
│  │  /api/videos │  │ /api/mcp/*   │  │ /api/models  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Chains     │  │   Agents     │  │  Providers   │    │
│  │  (LangChain) │  │ (MetaSearch) │  │  (LLMs)      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SearXNG    │  │  Embeddings  │  │  Database    │
│  (MetaSearch)│  │  (Reranking)  │  │  (SQLite)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Các lớp chính

1. **Frontend Layer**: Giao diện người dùng React/Next.js
2. **API Layer**: Next.js API routes xử lý HTTP requests
3. **Business Logic Layer**: Các chains, agents, và providers xử lý logic nghiệp vụ
4. **External Services**: SearXNG (required, Docker), LLM providers, Database

---

## Các thành phần chính

### 1. API Routes (`src/app/api/`)

Các endpoint chính của hệ thống:

- **`/api/chat`**: Xử lý tin nhắn chat, điều phối search và answer generation
- **`/api/search`**: API công khai cho tìm kiếm
- **`/api/images`**: Tìm kiếm hình ảnh
- **`/api/videos`**: Tìm kiếm video
- **`/api/models`**: Liệt kê các models có sẵn
- **`/api/config`**: Quản lý cấu hình
- **`/api/mcp/*`**: MCP server endpoints (HTTP mode)

**File quan trọng**: `src/app/api/chat/route.ts`

### 2. Search Handlers (`src/lib/search/`)

Quản lý các chế độ tìm kiếm khác nhau:

- **`MetaSearchAgent`**: Agent chính xử lý tìm kiếm và trả lời
- **`searchHandlers`**: Registry các handlers cho từng focus mode
  - `webSearch`: Tìm kiếm web tổng quát
  - `academicSearch`: Tìm kiếm học thuật (arXiv, Google Scholar, PubMed)
  - `writingAssistant`: Trợ lý viết không cần tìm kiếm web
  - `youtubeSearch`: Tìm kiếm YouTube
  - `redditSearch`: Tìm kiếm Reddit
  - `wolframAlphaSearch`: Tính toán và phân tích dữ liệu

**File quan trọng**: 
- `src/lib/search/metaSearchAgent.ts`
- `src/lib/search/index.ts`

### 3. Chains (`src/lib/chains/`)

Các LangChain chains xử lý các tác vụ cụ thể:

- **`imageSearchAgent.ts`**: Chain tìm kiếm hình ảnh
- **`videoSearchAgent.ts`**: Chain tìm kiếm video
- **`suggestionGeneratorAgent.ts`**: Tạo gợi ý truy vấn

Mỗi chain sử dụng LangChain's `RunnableSequence` để xâu chuỗi các bước xử lý.

### 4. Providers (`src/lib/providers/`)

Quản lý tích hợp với các nhà cung cấp LLM và Embedding:

**Chat Model Providers:**
- OpenAI, Anthropic, Groq, Gemini, DeepSeek
- Ollama (local), LM Studio, Lemonade
- Custom OpenAI-compatible servers

**Embedding Providers:**
- OpenAI, Ollama, Gemini
- Transformers (local), AI/ML API, LM Studio, Lemonade

**File quan trọng**: `src/lib/providers/index.ts`

### 5. Database (`src/lib/db/`)

SQLite database quản lý:

- **`chats`**: Thông tin các cuộc trò chuyện
  - `id`, `title`, `createdAt`, `focusMode`, `files`
- **`messages`**: Lịch sử tin nhắn
  - `id`, `role` (user/assistant/source), `chatId`, `content`, `sources`, `createdAt`

**File quan trọng**: 
- `src/lib/db/schema.ts`
- `src/lib/db/index.ts`

### 6. MCP Server (`apps/mcp-server/` và `src/mcp/`)

Model Context Protocol server để tích hợp Perplexica như một công cụ:

**Standalone Package** (`apps/mcp-server/`):
- **`src/server.ts`**: Server implementation chính
- **`src/tools/`**: Định nghĩa các MCP tools
- **`src/code-mode/`**: Code Mode functionality
  - `api.ts`: API client cho Perplexica
  - `executor.ts`: Code execution engine
  - `filesystem-discovery.ts`: Tìm kiếm tools trong filesystem
  - `skills.ts`: Skills definitions
- **`package.json`**: Dependencies riêng cho MCP server

**Legacy Location** (`src/mcp/`):
- Code cũ vẫn tồn tại để backward compatibility
- Đã được copy sang `apps/mcp-server/` trong monorepo setup

**File quan trọng**: `apps/mcp-server/src/server.ts`

### 7. Configuration (`src/lib/config.ts`)

Quản lý cấu hình từ file `config.toml`:

- API keys cho các providers
- SearXNG endpoint
- Similarity measure settings
- Keep-alive settings

### 8. Utilities (`src/lib/utils/`)

Các tiện ích hỗ trợ:

- **`computeSimilarity.ts`**: Tính toán similarity cho reranking
- **`documents.ts`**: Xử lý documents
- **`files.ts`**: Xử lý file uploads
- **`formatHistory.ts`**: Format chat history

---

## Luồng dữ liệu

### Luồng xử lý một query tìm kiếm

```
1. User Input
   │
   ▼
2. Frontend → POST /api/chat
   │
   ▼
3. Route Handler (route.ts)
   ├─ Validate request
   ├─ Load chat/embedding models
   ├─ Convert history to BaseMessage[]
   └─ Select search handler based on focusMode
   │
   ▼
4. MetaSearchAgent.searchAndAnswer()
   │
   ├─ Create Answering Chain
   │   │
   │   ├─ Create Search Retriever Chain (if searchWeb=true)
   │   │   │
   │   │   ├─ Predict: Need search? → Generate query
   │   │   │
   │   │   └─ Search SearXNG → Get results
   │   │
   │   ├─ Rerank Documents
   │   │   ├─ Convert to embeddings
   │   │   ├─ Compute similarity
   │   │   └─ Filter by threshold
   │   │
   │   └─ Generate Response
   │       ├─ Format context from docs
   │       ├─ Include chat history
   │       └─ Stream response via LLM
   │
   ▼
5. Stream Events → Frontend
   ├─ 'data': Response chunks
   ├─ 'sources': Source citations
   └─ 'end': Stream complete
   │
   ▼
6. Save to Database
   ├─ Save user message
   ├─ Save assistant response
   └─ Save sources
```

### Luồng tìm kiếm hình ảnh/video

```
1. User Request → /api/images hoặc /api/videos
   │
   ▼
2. Image/Video Search Chain
   ├─ Rephrase query (standalone)
   ├─ Search SearXNG với engines cụ thể
   │   ├─ Images: ['bing images', 'google images']
   │   └─ Videos: ['youtube']
   └─ Return formatted results
```

### Luồng MCP Tool Call

```
1. MCP Client → Call Tool (perplexica_search, perplexica_chat, etc.)
   │
   ▼
2. MCP Server Handler
   ├─ Validate parameters
   ├─ Call PerplexicaAPI (code-mode/api.ts)
   │   └─ HTTP request to /api/search hoặc /api/chat
   └─ Return formatted result
```

---

## Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── chat/                 # Chat endpoint
│   │   ├── search/               # Public search API
│   │   ├── images/               # Image search
│   │   ├── videos/               # Video search
│   │   ├── mcp/                  # MCP HTTP endpoints
│   │   └── ...                   # Other endpoints
│   ├── c/[chatId]/               # Chat page
│   ├── discover/                 # Discover page
│   ├── library/                  # Library page
│   ├── settings/                 # Settings page
│   └── page.tsx                  # Home page
│
├── components/                   # React Components
│   ├── Chat.tsx                  # Main chat component
│   ├── ChatWindow.tsx            # Chat window UI
│   ├── MessageInput.tsx          # Message input
│   ├── MessageBox.tsx            # Message display
│   ├── MessageSources.tsx        # Source citations
│   └── ...                       # Other components
│
├── lib/                          # Core Library
│   ├── chains/                   # LangChain chains
│   │   ├── imageSearchAgent.ts
│   │   ├── videoSearchAgent.ts
│   │   └── suggestionGeneratorAgent.ts
│   │
│   ├── search/                   # Search logic
│   │   ├── metaSearchAgent.ts    # Main search agent
│   │   └── index.ts              # Search handlers registry
│   │
│   ├── providers/                # LLM/Embedding providers
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── ollama.ts
│   │   └── index.ts              # Provider registry
│   │
│   ├── db/                       # Database
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── index.ts              # DB connection
│   │   └── migrate.ts            # Migrations
│   │
│   ├── prompts/                  # LLM prompts
│   │   ├── webSearch.ts
│   │   └── writingAssistant.ts
│   │
│   ├── utils/                    # Utilities
│   │   ├── computeSimilarity.ts
│   │   ├── documents.ts
│   │   ├── files.ts
│   │   └── formatHistory.ts
│   │
│   ├── config.ts                 # Configuration loader
│   ├── searxng.ts                # SearXNG client
│   └── actions.ts                # Server actions
│
└── mcp/                          # MCP Server (legacy, moved to apps/mcp-server)
    ├── server.ts                 # Main MCP server
    ├── index.ts                  # Entry point
    ├── http-server.ts            # HTTP MCP server
    ├── tools/                    # MCP tools
    ├── code-mode/                # Code Mode
    └── types/                    # Type definitions

apps/
└── mcp-server/                   # MCP Server (standalone package)
    ├── src/                      # MCP server code
    ├── package.json              # MCP server dependencies
    └── tsconfig.json             # TypeScript config
```

---

## Công nghệ sử dụng

### Frontend
- **Next.js 15**: React framework với App Router
- **React 18**: UI library
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety

### Backend
- **Next.js API Routes**: Server-side API
- **LangChain**: AI chains và agents
- **Drizzle ORM**: Database ORM
- **SQLite**: Database

### AI/ML
- **LangChain**: Chain orchestration
- **@xenova/transformers**: Local embeddings
- **Multiple LLM Providers**: OpenAI, Anthropic, Groq, etc.

### External Services
- **SearXNG**: Meta search engine (required, chạy trong Docker)
- **Various LLM APIs**: OpenAI, Anthropic, Groq, etc.

### MCP
- **@modelcontextprotocol/sdk**: MCP protocol implementation

---

## Điểm mở rộng

### Thêm một Focus Mode mới

1. Tạo config trong `src/lib/search/index.ts`:
```typescript
newFocusMode: new MetaSearchAgent({
  activeEngines: ['engine1', 'engine2'],
  queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
  responsePrompt: prompts.webSearchResponsePrompt,
  queryGeneratorFewShots: prompts.webSearchRetrieverFewShots,
  rerank: true,
  rerankThreshold: 0.3,
  searchWeb: true,
})
```

2. Thêm prompt tùy chỉnh trong `src/lib/prompts/` nếu cần

3. Cập nhật UI để hiển thị mode mới

### Thêm một LLM Provider mới

1. Tạo file provider trong `src/lib/providers/`:
```typescript
// src/lib/providers/newprovider.ts
export const loadNewProviderChatModels = async () => {
  // Implementation
};

export const PROVIDER_INFO = {
  key: 'newprovider',
  displayName: 'New Provider',
};
```

2. Đăng ký trong `src/lib/providers/index.ts`:
```typescript
import { loadNewProviderChatModels, PROVIDER_INFO as NewProviderInfo } from './newprovider';

export const chatModelProviders = {
  // ... existing
  newprovider: loadNewProviderChatModels,
};

export const PROVIDER_METADATA = {
  // ... existing
  newprovider: NewProviderInfo,
};
```

3. Thêm config trong `config.toml` và `src/lib/config.ts`

### Thêm một MCP Tool mới

1. Định nghĩa tool trong `src/mcp/tools/index.ts`:
```typescript
export const newTool = {
  name: 'perplexica_new_tool',
  description: 'Description',
  inputSchema: {
    type: 'object',
    properties: {
      // ...
    },
  },
};
```

2. Thêm handler trong `src/mcp/server.ts`:
```typescript
case 'perplexica_new_tool':
  return await this.handleNewTool(args);
```

3. Implement handler method

### Thêm một API Endpoint mới

1. Tạo route trong `src/app/api/newendpoint/route.ts`:
```typescript
export const GET = async (req: Request) => {
  // Implementation
};
```

2. Export từ `src/app/api/` nếu cần

---

## Ghi chú bảo trì

### Khi thay đổi Database Schema

1. Cập nhật `src/lib/db/schema.ts`
2. Tạo migration: `npm run db:migrate`
3. Migration files sẽ được tạo trong `drizzle/`

### Khi thay đổi Config Structure

1. Cập nhật interface trong `src/lib/config.ts`
2. Cập nhật `sample.config.toml`
3. Đảm bảo backward compatibility

### Testing

- API endpoints: Test qua Postman hoặc curl
- MCP server: Test với MCP client hoặc Claude Desktop
- Components: Test trong development mode

### Debugging

- Check logs trong console
- LangChain tracing: Enable trong chain config
- Database: Query trực tiếp SQLite file

---

## Deployment

### Web App Service với Docker

Web App cần deploy bằng **Docker** vì phụ thuộc vào **SearXNG** service.

#### Kiến trúc Deployment

```
┌─────────────────┐
│  SearXNG        │  Port 4000 (internal: 8080)
│  (Docker)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Perplexica     │  Port 3000
│  Web App        │  SEARXNG_API_URL=http://searxng:8080
│  (Docker)       │
└─────────────────┘
```

#### Docker Compose Setup

Sử dụng `docker-compose.yaml` để deploy cả SearXNG và Web App:

```yaml
services:
  searxng:
    image: docker.io/searxng/searxng:latest
    volumes:
      - ./searxng:/etc/searxng:rw
    ports:
      - 4000:8080
    networks:
      - perplexica-network
    restart: unless-stopped

  app:
    image: itzcrazykns1337/perplexica:main
    build:
      context: .
      dockerfile: app.dockerfile
    environment:
      - SEARXNG_API_URL=http://searxng:8080
      - DATA_DIR=/home/perplexica
    ports:
      - 3000:3000
    networks:
      - perplexica-network
    volumes:
      - backend-dbstore:/home/perplexica/data
      - uploads:/home/perplexica/uploads
      - ./config.toml:/home/perplexica/config.toml
    restart: unless-stopped
```

#### Deploy Steps

1. **Build và Start**:
   ```bash
   docker compose up -d
   ```

2. **Environment Variables**:
   - `SEARXNG_API_URL`: URL của SearXNG service (internal: `http://searxng:8080`)
   - `DATA_DIR`: Directory cho database và data
   - Các API keys trong `config.toml`

3. **Volumes**:
   - `backend-dbstore`: Database storage
   - `uploads`: File uploads
   - `config.toml`: Configuration file

#### Railway Deployment với Docker

Khi deploy lên Railway:

1. **Service 1: SearXNG**
   - Docker image: `docker.io/searxng/searxng:latest`
   - Port: 8080 (internal)
   - Volume: `searxng/` config directory

2. **Service 2: Web App**
   - Build từ NIXPACKS (không dùng Dockerfile)
   - Environment: `SEARXNG_API_URL=http://searxng.railway.internal:8080`
     - Hoặc: `http://<searxng-service-name>.railway.internal:8080`
   - Port: 3000
   - Dependencies: SearXNG service

3. **Service 3: MCP Server** (Optional, standalone)
   - Root Directory: `apps/mcp-server`
   - Environment: `PERPLEXICA_BASE_URL=https://web-app-url.up.railway.app`
   - Không cần Docker (chạy trực tiếp Node.js)

#### Lưu ý

- ✅ SearXNG và Web App phải cùng network để communicate
- ✅ SearXNG phải start trước Web App
- ✅ MCP Server có thể deploy riêng, không cần Docker (chỉ cần Node.js)
- ✅ Web App cần SearXNG để hoạt động, không thể deploy standalone

---

## Tài liệu liên quan

- [WORKING.md](./WORKING.md): Chi tiết về cách hệ thống hoạt động
- [API Guide](../API/README.md): Tài liệu API
- [MCP Setup](../../docs/MCP_CURSOR_SETUP.md): Hướng dẫn setup MCP

---

**Lần cập nhật cuối**: 2024
**Phiên bản**: 1.11.0-rc3
