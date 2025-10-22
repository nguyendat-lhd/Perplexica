# 🏗️ Architecture Documentation

Tài liệu về kiến trúc và cách hoạt động của hệ thống Perplexica.

## 📑 Nội dung

- **[README.md](./README.md)** - Tổng quan về kiến trúc hệ thống
- **[WORKING.md](./WORKING.md)** - Chi tiết cách hoạt động của các components

## 🎯 System Overview

Perplexica là một AI-powered search engine kết hợp nhiều công nghệ:

### Core Components
1. **Frontend** - Next.js React application
2. **Backend API** - Node.js/Express API server
3. **Search Engine** - SearxNG for web search
4. **LLM Integration** - Multiple LLM providers (OpenAI, Gemini, Groq)
5. **Database** - SQLite for chat history

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  - React Components                     │
│  - UI/UX Layer                          │
│  - Client-side State Management         │
└────────────────┬────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼────────────────────────┐
│       Backend API (Node.js)             │
│  - API Routes                           │
│  - Business Logic                       │
│  - LLM Orchestration                    │
└────────┬───────────────┬────────────────┘
         │               │
         │               │
    ┌────▼────┐    ┌────▼────┐
    │  LLM    │    │ SearxNG │
    │Providers│    │ Search  │
    └─────────┘    └─────────┘
         │
    ┌────▼────┐
    │Database │
    │(SQLite) │
    └─────────┘
```

## 🔄 Request Flow

### Search Request Flow
```
1. User enters query
   ↓
2. Frontend sends request to /api/search
   ↓
3. Backend processes query
   ↓
4. Backend queries SearxNG for web results
   ↓
5. Backend sends results + context to LLM
   ↓
6. LLM generates AI response
   ↓
7. Backend streams response to frontend
   ↓
8. Frontend displays results
   ↓
9. Save to chat history
```

### Chat Flow
```
1. User asks follow-up question
   ↓
2. Frontend includes chat history
   ↓
3. Backend retrieves context from DB
   ↓
4. LLM uses context for better response
   ↓
5. Stream response + sources
   ↓
6. Update chat history
```

## 🧩 Component Details

### Frontend Components
```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── c/[chatId]/        # Chat page
│   ├── settings/          # Settings page
│   └── api/               # API routes
├── components/            # React components
│   ├── SearchBar.tsx
│   ├── MessageBox.tsx
│   ├── SearchResults.tsx
│   └── ...
└── lib/                   # Utilities & helpers
    ├── providers/         # LLM providers
    ├── agents/            # AI agents
    └── utils/             # Utility functions
```

### Backend Architecture
```
src/lib/
├── agents/                # AI Agent logic
│   ├── webSearchAgent.ts
│   ├── academicSearchAgent.ts
│   └── ...
├── providers/             # LLM provider integrations
│   ├── openai.ts
│   ├── gemini.ts
│   └── groq.ts
└── utils/                 # Utilities
    ├── logger.ts
    ├── format.ts
    └── ...
```

## 🔌 Integration Points

### LLM Providers
- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Google Gemini** - Gemini Pro
- **Groq** - Fast inference
- **Anthropic** - Claude models

### Search Integration
- **SearxNG** - Meta search engine
- Aggregates results from multiple sources
- Privacy-focused

### Database
- **SQLite** - Lightweight, serverless
- Stores chat history and user data
- Easy to backup and migrate

## 📊 Data Flow

### Search Data Flow
```
Query → Search Agent → SearxNG
                    ↓
            Web Results
                    ↓
            Context Builder
                    ↓
        Prompt Template
                    ↓
            LLM Provider
                    ↓
        AI Response + Sources
```

### Chat History
```
Message → Format → Validate
              ↓
         Store in DB
              ↓
      Retrieve on load
              ↓
    Display in UI
```

## 🔐 Security Architecture

### API Security
- Input validation
- Rate limiting (planned)
- CORS configuration
- Environment variable protection

### Data Security
- API keys stored in environment
- No sensitive data in logs
- Secure database access
- HTTPS in production

## 🚀 Deployment Architecture

### Development
```
Docker Compose
├── App Container (Next.js)
├── SearxNG Container
└── Database Volume
```

### Production
```
AWS EC2
├── Node.js + PM2
├── Nginx (reverse proxy)
├── SSL/TLS (Let's Encrypt)
└── SearxNG (Docker)
```

## 📈 Scalability Considerations

### Current Limitations
- Single instance deployment
- SQLite (not for high concurrency)
- No caching layer

### Future Improvements
- Load balancing
- PostgreSQL/MySQL migration
- Redis caching
- Horizontal scaling
- CDN for static assets

## 🧪 Testing Architecture

### Test Layers
1. **Unit Tests** - Individual functions
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Full user flows
4. **Manual Tests** - Edge cases

### Test Coverage
```
src/
├── lib/
│   ├── agents/
│   │   ├── webSearchAgent.ts
│   │   └── webSearchAgent.test.ts
│   └── providers/
│       ├── openai.ts
│       └── openai.test.ts
```

## 🔧 Configuration

### Environment Variables
```
# LLM Providers
OPENAI_API_KEY=xxx
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx

# Search
SEARXNG_API_URL=http://localhost:4000

# Database
DATABASE_URL=./data/db.sqlite
```

### Runtime Configuration
- Model selection
- Temperature settings
- Max tokens
- Search parameters

## 📚 Key Technologies

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **LangChain** - LLM orchestration

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Web server
- **PM2** - Process management
- **CloudFormation** - IaC

## 🔍 Monitoring & Observability

### Logging
- Application logs
- Error tracking
- Performance metrics

### Health Checks
- `/api/health` endpoint
- Service status monitoring
- Resource usage tracking

## 💡 Design Decisions

### Why Next.js?
- Server-side rendering
- API routes in same codebase
- Great developer experience
- Production-ready

### Why SQLite?
- Simple setup
- No separate DB server
- Good for moderate traffic
- Easy backup/restore

### Why Multiple LLM Providers?
- Redundancy
- Cost optimization
- Feature comparison
- User choice

## 📖 Learn More

- **[WORKING.md](./WORKING.md)** - Detailed component workflows
- [API Documentation](../API/) - API endpoints and usage
- [Deployment](../deployment/) - How to deploy the system
- [Troubleshooting](../troubleshooting/) - Common issues and fixes

## 🎯 Next Steps

1. Read [WORKING.md](./WORKING.md) for detailed workflows
2. Explore [API documentation](../API/)
3. Review [deployment architecture](../deployment/)
4. Check [CI/CD setup](../ci-cd/)

[← Quay lại Docs chính](../README.md)
