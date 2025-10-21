# 📚 AI Agent Review API - Flow Documentation

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Architecture](#architecture)
3. [Request Flow](#request-flow)
4. [Components chi tiết](#components-chi-tiết)
5. [Data Flow](#data-flow)
6. [Error Handling](#error-handling)
7. [Performance & Optimization](#performance--optimization)
8. [Monitoring & Debugging](#monitoring--debugging)

---

## 🎯 Tổng quan

### Mục đích
API `/api/ai-agent-review` cung cấp đánh giá toàn diện về các AI agents/tools, bao gồm:
- Thông tin chi tiết về AI agent
- Hình ảnh minh họa (screenshots, logos, demos)
- Video hướng dẫn và đánh giá
- Metadata structured cho SEO

### Endpoint
```
POST /api/ai-agent-review
```

### Request Body
```json
{
  "query": "Tên hoặc mô tả AI agent",
  "history": [],
  "chatModel": { "provider": "...", "name": "..." },
  "embeddingModel": { "provider": "...", "name": "..." },
  "includeImages": true,
  "includeVideos": true,
  "systemInstructions": ""
}
```

### Response
```json
{
  "message": "Đánh giá chi tiết về AI agent",
  "sources": [{ "title": "...", "url": "..." }],
  "images": [{ "url": "...", "title": "..." }],
  "videos": [{ "url": "...", "title": "..." }],
  "metadata": {
    "name": "...",
    "provider": "...",
    "excerpt": "...",
    "seo_title": "...",
    "seo_description": "..."
  },
  "structured_data": { /* JSON từ LLM */ }
}
```

---

## 🏗️ Architecture

### High-level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Request                        │
│              POST /api/ai-agent-review                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Route                           │
│         (maxDuration: 300s, runtime: nodejs)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌─────────────────┐
│   Validation  │              │ Model Selection │
│   & Parsing   │              │   (LLM + EMB)   │
└───────┬───────┘              └────────┬────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Search Handler (aiAgentReviewApi)               │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         MetaSearchAgent.searchAndAnswer()         │      │
│  │                                                    │      │
│  │  1. Query Generator (Retriever Prompt)            │      │
│  │     → Generate search queries & links              │      │
│  │                                                    │      │
│  │  2. Web Search (SearXNG)                          │      │
│  │     → Fetch search results                         │      │
│  │                                                    │      │
│  │  3. Document Retrieval                            │      │
│  │     → Crawl & extract content from links          │      │
│  │                                                    │      │
│  │  4. Reranking (Embeddings)                        │      │
│  │     → Score & sort by relevance                    │      │
│  │                                                    │      │
│  │  5. Response Generation (LLM)                     │      │
│  │     → Generate comprehensive review               │      │
│  └──────────────────────────────────────────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌─────────────────┐
│ Image Search  │              │  Video Search   │
│  (parallel)   │              │   (parallel)    │
│  max 60s      │              │    max 60s      │
└───────┬───────┘              └────────┬────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Metadata Extraction & Processing                │
│   - Extract agent name, provider, excerpt                    │
│   - Parse JSON from LLM response                            │
│   - Generate SEO metadata                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Response Assembly                       │
│        Combine all results into final JSON                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
                   Client Response
```

### Components Map

```
src/
├── app/api/ai-agent-review/
│   └── route.ts                    ← API Endpoint (Main orchestrator)
│
├── lib/
│   ├── search/
│   │   ├── index.ts                ← Search Handlers Registry
│   │   └── metaSearchAgent.ts      ← Core search & answer logic
│   │
│   ├── prompts/
│   │   ├── aiAgentReviewApi.ts     ← Prompts cho API (JSON output)
│   │   └── aiAgentReview.ts        ← Prompts cho Chat (Markdown)
│   │
│   ├── chains/
│   │   ├── imageSearchAgent.ts     ← Image search logic
│   │   └── videoSearchAgent.ts     ← Video search logic
│   │
│   ├── providers/
│   │   └── *.ts                    ← LLM & Embedding providers
│   │
│   ├── searxng.ts                  ← Web search via SearXNG
│   │
│   └── utils/
│       ├── documents.ts            ← Document fetching & parsing
│       └── computeSimilarity.ts    ← Embedding similarity
```

---

## 🔄 Request Flow

### Phase 1: Request Reception & Validation (0-1s)

```typescript
// File: src/app/api/ai-agent-review/route.ts

export const POST = async (req: Request) => {
  // 1. Parse request body
  const body: AIAgentReviewBody = await req.json();
  
  // 2. Validate required fields
  if (!body.query) {
    return Response.json({ message: 'Missing query' }, { status: 400 });
  }
  
  // 3. Set defaults
  body.history = body.history || [];
  body.includeImages = body.includeImages ?? true;
  body.includeVideos = body.includeVideos ?? true;
}
```

**Input:**
- `query`: "ChatGPT", "Claude AI", "wondercraft.ai", etc.
- `includeImages`: boolean (default: true)
- `includeVideos`: boolean (default: true)

**Validation:**
- ✅ Query không được rỗng
- ✅ History phải là array
- ✅ Models phải hợp lệ

### Phase 2: Model Selection (1-2s)

```typescript
// 4. Get available models
const [chatModelProviders, embeddingModelProviders] = await Promise.all([
  getAvailableChatModelProviders(),
  getAvailableEmbeddingModelProviders(),
]);

// 5. Select models
const llm = chatModelProviders[chatModelProvider][chatModel].model;
const embeddings = embeddingModelProviders[embeddingProvider][embeddingModel].model;
```

**Flow:**
```
User Selection (optional)
         ↓
┌─────────────────────┐
│ Default Models      │
│ - LLM: OpenAI GPT-4 │
│ - EMB: OpenAI Ada   │
└─────────────────────┘
         ↓
    Validation
         ↓
  Model Instances
```

### Phase 3: Search & Answer (30-60s)

```typescript
// 6. Get search handler
const searchHandler = searchHandlers['aiAgentReviewApi'];

// 7. Execute search and answer
const emitter = await searchHandler.searchAndAnswer(
  body.query,
  history,
  llm,
  embeddings,
  'balanced',
  [],
  body.systemInstructions || '',
);
```

**Detailed Sub-flow:**

#### 3.1. Query Generation (2-5s)
```
User Query: "ChatGPT"
         ↓
┌──────────────────────────────────────┐
│ Retriever Prompt + Few-shot Examples │
│ (aiAgentReviewApiRetrieverPrompt)    │
└──────────────────────────────────────┘
         ↓
    LLM Processing
         ↓
Generated Output:
{
  <ai_agent>ChatGPT</ai_agent>
  <links>
    - https://openai.com/chatgpt
    - https://platform.openai.com/docs
  </links>
  <question>
    What is ChatGPT and how does it work?
  </question>
}
```

#### 3.2. Web Search (5-10s)
```
Generated Question
         ↓
┌─────────────────────┐
│ SearXNG Search API  │
│ Engines: google,    │
│   bing, duckduckgo  │
└─────────────────────┘
         ↓
   Search Results
   (10-50 results)
         ↓
┌─────────────────────┐
│ Document Retrieval  │
│ - Fetch URLs        │
│ - Extract content   │
│ - Handle errors     │
└─────────────────────┘
         ↓
  Raw Documents
  (HTML → Text)
```

#### 3.3. Document Processing & Reranking (3-8s)
```
Raw Documents
         ↓
┌──────────────────────┐
│ Embedding Generation │
│ - Encode documents   │
│ - Encode query       │
└──────────────────────┘
         ↓
   Similarity Scoring
         ↓
┌──────────────────────┐
│ Reranking            │
│ - Cosine similarity  │
│ - Sort by score      │
│ - Filter threshold   │
└──────────────────────┘
         ↓
Top 15 Documents
(Most relevant)
```

**Code:**
```typescript
// metaSearchAgent.ts
const [docEmbeddings, queryEmbedding] = await Promise.all([
  embeddings.embedDocuments(docs.map(doc => doc.pageContent)),
  embeddings.embedQuery(query),
]);

const similarity = docEmbeddings.map((docEmb, i) => ({
  index: i,
  similarity: computeSimilarity(queryEmbedding, docEmb),
}));

const sortedDocs = similarity
  .filter(sim => sim.similarity > 0.3)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 15)
  .map(sim => docs[sim.index]);
```

#### 3.4. Response Generation (15-30s)
```
Sorted Documents + User Query
         ↓
┌────────────────────────────────────┐
│ Response Prompt                    │
│ (aiAgentReviewApiResponsePrompt)   │
│                                    │
│ Context: {sorted_documents}        │
│ Query: {user_query}                │
│ Date: {current_date}               │
└────────────────────────────────────┘
         ↓
    LLM Processing
    (GPT-4, Claude, etc)
         ↓
   Generated Review
   (Plain text or JSON)
```

**Prompt Template:**
```typescript
const responsePrompt = `
Bạn là chuyên gia AI agent...

Context: {context}
Query: {query}
Date: {date}

Trả về JSON với cấu trúc:
- ai_agent_name: ...
- overview: ...
- key_features: ...
`;
```

### Phase 4: Parallel Media Fetching (0-60s)

```typescript
// 8. Fetch images and videos in parallel
const [images, videos] = await Promise.all([
  // Image search with 60s timeout
  body.includeImages
    ? (async () => {
        const imageResult = await Promise.race([
          handleImageSearch({ query: `${query} screenshot demo` }, llm),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 60000)
          ),
        ]);
        return imageResult || [];
      })()
    : Promise.resolve([]),
  
  // Video search with 60s timeout
  body.includeVideos
    ? (async () => {
        const videoResult = await Promise.race([
          handleVideoSearch({ query: `${query} tutorial review` }, llm),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 60000)
          ),
        ]);
        return videoResult || [];
      })()
    : Promise.resolve([]),
]);
```

**Timeline:**
```
Main Search (30-60s)
         │
         └─────┬─────────────────┐
               │                 │
               ▼                 ▼
       Image Search      Video Search
         (0-60s)           (0-60s)
               │                 │
               └─────┬───────────┘
                     │
                     ▼
            Both Complete
         (max 60s due to parallel)
```

### Phase 5: Metadata Extraction (1-2s)

```typescript
// 9. Extract metadata
const metadata = extractAgentMetadata(
  body.query,
  reviewResult.sources,
  reviewResult.message
);

function extractAgentMetadata(query, sources, message) {
  // 1. Extract agent name
  const agentName = extractAgentNameFromQuery(query);
  
  // 2. Extract provider info
  const providerInfo = extractProviderInfo(sources, query);
  
  // 3. Parse JSON from message (if available)
  const jsonMatch = message.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    const structured = JSON.parse(jsonMatch[1]);
    // Extract: excerpt, seo_title, seo_description
  }
  
  // 4. Fallback: generate from message
  const sentences = cleanMessage
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 20);
  
  return {
    name: agentName,
    provider: providerInfo.provider,
    excerpt: sentences.slice(0, 2).join('. '),
    seo_title: `${agentName} - Đánh giá AI Agent`,
    seo_description: sentences.slice(0, 3).join('. '),
    // ...
  };
}
```

### Phase 6: Response Assembly (0-1s)

```typescript
// 10. Return final response
return Response.json({
  message: reviewResult.message,
  sources: reviewResult.sources,
  images: Array.isArray(images) && images.length > 0 ? images : [],
  videos: Array.isArray(videos) && videos.length > 0 ? videos : [],
  metadata: metadata,
  structured_data: structuredData,
}, { status: 200 });
```

---

## 🔧 Components Chi tiết

### 1. MetaSearchAgent

**File:** `src/lib/search/metaSearchAgent.ts`

**Responsibilities:**
- Query generation (tạo search queries từ user input)
- Web search execution (gọi SearXNG)
- Document retrieval & processing
- Reranking with embeddings
- Response generation with LLM

**Key Methods:**

```typescript
class MetaSearchAgent {
  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
  ): Promise<EventEmitter>
  
  private async createSearchRetrieverChain(llm)
  private async createAnsweringChain(llm, fileIds, embeddings, ...)
  private async rerankDocs(query, docs, fileIds, embeddings, mode)
}
```

**Event Emitter Pattern:**
```typescript
emitter.on('data', (data) => {
  const parsed = JSON.parse(data);
  if (parsed.type === 'response') {
    // Stream LLM response chunks
  } else if (parsed.type === 'sources') {
    // Emit source documents
  }
});

emitter.on('end', () => {
  // Search and answer completed
});

emitter.on('error', (error) => {
  // Handle errors
});
```

### 2. Search Handlers Registry

**File:** `src/lib/search/index.ts`

```typescript
export const searchHandlers: Record<string, MetaSearchAgent> = {
  webSearch: new MetaSearchAgent({ /* config */ }),
  academicSearch: new MetaSearchAgent({ /* config */ }),
  // ...
  aiAgentReview: new MetaSearchAgent({
    activeEngines: ['google', 'bing', 'duckduckgo'],
    queryGeneratorPrompt: prompts.aiAgentReviewRetrieverPrompt,
    responsePrompt: prompts.aiAgentReviewResponsePrompt,
    queryGeneratorFewShots: prompts.aiAgentReviewRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
  aiAgentReviewApi: new MetaSearchAgent({
    activeEngines: ['google', 'bing', 'duckduckgo'],
    queryGeneratorPrompt: prompts.aiAgentReviewApiRetrieverPrompt,
    responsePrompt: prompts.aiAgentReviewApiResponsePrompt,
    queryGeneratorFewShots: prompts.aiAgentReviewApiRetrieverFewShots,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
  }),
};
```

**Sự khác biệt:**
| Handler | Response Format | Use Case |
|---------|----------------|----------|
| `aiAgentReview` | Markdown | Chat UI streaming |
| `aiAgentReviewApi` | Plain text/JSON hint | API endpoint |

### 3. Image & Video Search Agents

**Files:**
- `src/lib/chains/imageSearchAgent.ts`
- `src/lib/chains/videoSearchAgent.ts`

**Flow:**
```typescript
async function handleImageSearch(input, llm) {
  // 1. Generate image-specific query
  const imageQuery = await llm.invoke(`
    Generate image search query for: ${input.query}
    Focus on: screenshots, UI, demos, logos
  `);
  
  // 2. Search via SearXNG (Google Images)
  const results = await searchSearxng(imageQuery, {
    engines: ['google images'],
  });
  
  // 3. Extract & format images
  return results.map(r => ({
    url: r.img_src,
    title: r.title,
    source: r.url,
  }));
}
```

### 4. Prompts System

**Architecture:**
```
prompts/
├── aiAgentReview.ts         ← Chat mode
│   ├── Retriever Prompt     → Generate search queries
│   ├── Few-shot Examples    → Guide LLM
│   └── Response Prompt      → Generate Markdown
│
└── aiAgentReviewApi.ts      ← API mode
    ├── Retriever Prompt     → Generate search queries
    ├── Few-shot Examples    → Guide LLM
    └── Response Prompt      → Generate structured text
```

**Template Variables:**
- `{query}` - User's original query
- `{context}` - Search results (reranked docs)
- `{date}` - Current date
- `{chat_history}` - Conversation history

---

## 📊 Data Flow

### Data Transformation Pipeline

```
User Query: "ChatGPT"
    ↓
┌─────────────────────────────┐
│ Phase 1: Query Understanding│
└─────────────────────────────┘
    ↓
{
  ai_agent: "ChatGPT",
  links: ["https://openai.com/chatgpt", ...],
  question: "What is ChatGPT and how does it work?"
}
    ↓
┌─────────────────────────────┐
│ Phase 2: Web Search         │
└─────────────────────────────┘
    ↓
[
  { title: "ChatGPT", url: "...", content: "..." },
  { title: "OpenAI", url: "...", content: "..." },
  ...
] (50+ results)
    ↓
┌─────────────────────────────┐
│ Phase 3: Document Retrieval │
└─────────────────────────────┘
    ↓
[
  Document(pageContent: "ChatGPT is...", metadata: {...}),
  Document(pageContent: "OpenAI's...", metadata: {...}),
  ...
] (HTML → Clean text)
    ↓
┌─────────────────────────────┐
│ Phase 4: Embedding & Rerank │
└─────────────────────────────┘
    ↓
[
  Document(similarity: 0.92),
  Document(similarity: 0.87),
  ...
] (Top 15 most relevant)
    ↓
┌─────────────────────────────┐
│ Phase 5: Context Formation  │
└─────────────────────────────┘
    ↓
Context String:
"1. ChatGPT ChatGPT is a large language model...
 2. OpenAI OpenAI is an AI research company...
 ..."
    ↓
┌─────────────────────────────┐
│ Phase 6: LLM Generation     │
└─────────────────────────────┘
    ↓
Generated Review:
"# ChatGPT

## Tổng quan
ChatGPT là một AI chatbot được phát triển bởi OpenAI...

## Tính năng nổi bật
- Natural language understanding
- Multi-turn conversations
..."
    ↓
┌─────────────────────────────┐
│ Phase 7: Metadata Extract   │
└─────────────────────────────┘
    ↓
{
  name: "ChatGPT",
  provider: "OpenAI",
  excerpt: "ChatGPT là một AI chatbot...",
  seo_title: "ChatGPT - Đánh giá AI Agent",
  ...
}
    ↓
┌─────────────────────────────┐
│ Phase 8: Final Assembly     │
└─────────────────────────────┘
    ↓
Final Response:
{
  message: "# ChatGPT\n\n## Tổng quan...",
  sources: [{title, url}, ...],
  images: [{url, title}, ...],
  videos: [{url, title}, ...],
  metadata: {...},
  structured_data: {...}
}
```

---

## ⚠️ Error Handling

### Error Types & Recovery

#### 1. Validation Errors (400)
```typescript
if (!body.query) {
  return Response.json(
    { message: 'Missing query' },
    { status: 400 }
  );
}
```

#### 2. Model Selection Errors (400)
```typescript
if (!llm || !embeddings) {
  return Response.json(
    { message: 'Invalid model selected' },
    { status: 400 }
  );
}
```

#### 3. Search Handler Errors (400)
```typescript
const searchHandler = searchHandlers['aiAgentReviewApi'];
if (!searchHandler) {
  return Response.json(
    { message: 'AI Agent Review API not available' },
    { status: 400 }
  );
}
```

#### 4. Document Fetch Errors (Graceful)
```typescript
// Error: 403, 404 when fetching URLs
try {
  const res = await axios.get(link);
} catch (error) {
  console.error('Error fetching document:', error);
  // Continue with other documents
  return null;
}
```

#### 5. Image/Video Search Timeout (Graceful)
```typescript
try {
  const imageResult = await Promise.race([
    handleImageSearch(...),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 60000)
    ),
  ]);
  return imageResult || [];
} catch (error) {
  console.error('Error fetching images:', error);
  return []; // Return empty array instead of failing
}
```

#### 6. LLM Generation Errors (500)
```typescript
try {
  const emitter = await searchHandler.searchAndAnswer(...);
  // Process emitter
} catch (err) {
  console.error('Error in search and answer:', err);
  return Response.json(
    { message: 'An error occurred while processing request' },
    { status: 500 }
  );
}
```

### Error Recovery Strategy

```
┌──────────────────────┐
│    Error Occurs      │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │ Is Critical? │
    └──┬────────┬──┘
       │        │
    YES│        │NO
       │        │
       ▼        ▼
┌──────────┐  ┌─────────────┐
│  Return  │  │   Log &     │
│  Error   │  │  Continue   │
│ Response │  │  (Graceful) │
└──────────┘  └─────────────┘
```

**Critical Errors:**
- Missing query
- Invalid models
- Handler not found
- Complete LLM failure

**Non-critical Errors:**
- Individual document fetch fails
- Image search timeout
- Video search timeout
- JSON parsing errors

---

## ⚡ Performance & Optimization

### Timeline Breakdown

| Phase | Duration | Optimization |
|-------|----------|-------------|
| **Validation** | 0-1s | ✅ Fast |
| **Model Selection** | 1-2s | ✅ Cached providers |
| **Query Generation** | 2-5s | ⚠️ LLM dependent |
| **Web Search** | 5-10s | ⚠️ Network dependent |
| **Document Retrieval** | 3-8s | ⚠️ Parallel fetching |
| **Reranking** | 3-8s | ⚠️ Embedding speed |
| **LLM Generation** | 15-30s | ⚠️ Model & length |
| **Image Search** | 0-60s | ✅ Parallel + timeout |
| **Video Search** | 0-60s | ✅ Parallel + timeout |
| **Metadata Extract** | 1-2s | ✅ Fast |
| **Response Assembly** | 0-1s | ✅ Fast |

**Total: 90-120s** (with images + videos)  
**Total: 30-60s** (without images/videos)

### Optimization Strategies

#### 1. Parallel Processing
```typescript
// Images and videos fetched in parallel
const [images, videos] = await Promise.all([
  fetchImages(),
  fetchVideos(),
]);

// vs Sequential (slower)
// const images = await fetchImages();
// const videos = await fetchVideos();
```

**Benefit:** -50% time for media fetching

#### 2. Timeout Protection
```typescript
Promise.race([
  actualWork(),
  timeout(60000),
])
```

**Benefit:** Prevent hanging requests

#### 3. Reranking Threshold
```typescript
const sortedDocs = similarity
  .filter(sim => sim.similarity > 0.3) // Only keep relevant
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 15); // Limit to top 15
```

**Benefit:** Less data for LLM = faster generation

#### 4. Optimization Modes
```typescript
if (optimizationMode === 'speed') {
  // Skip reranking, use first 15 results
}
else if (optimizationMode === 'balanced') {
  // Rerank with embeddings
}
else if (optimizationMode === 'quality') {
  // Advanced reranking + filtering
}
```

#### 5. Document Caching (Future)
```typescript
// Cache search results for 1 hour
const cacheKey = `ai-review:${query}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

// ... perform search ...

await redis.set(cacheKey, result, 'EX', 3600);
```

### Performance Monitoring

```typescript
// Add timing logs
console.time('search-and-answer');
const result = await searchHandler.searchAndAnswer(...);
console.timeEnd('search-and-answer');

console.time('images-fetch');
const images = await fetchImages();
console.timeEnd('images-fetch');
```

---

## 📈 Monitoring & Debugging

### Logging Points

```typescript
// 1. Request start
console.log('[AI-REVIEW] Request received:', {
  query: body.query,
  includeImages: body.includeImages,
  includeVideos: body.includeVideos,
  timestamp: new Date().toISOString(),
});

// 2. Model selection
console.log('[AI-REVIEW] Models selected:', {
  llm: `${chatModelProvider}/${chatModel}`,
  embedding: `${embeddingProvider}/${embeddingModel}`,
});

// 3. Search phase
console.log('[AI-REVIEW] Search started');
emitter.on('data', (data) => {
  const parsed = JSON.parse(data);
  console.log('[AI-REVIEW] Event:', parsed.type);
});

// 4. Media fetch
console.log('[AI-REVIEW] Fetching media...');
const [images, videos] = await Promise.all([...]);
console.log('[AI-REVIEW] Media fetched:', {
  images: images.length,
  videos: videos.length,
});

// 5. Response sent
console.log('[AI-REVIEW] Response sent:', {
  duration: Date.now() - startTime,
  messageLength: result.message.length,
  sourcesCount: result.sources.length,
});
```

### Debug Tools

#### 1. Test Endpoint
```bash
GET /api/test-timeout?delay=40
```

Kiểm tra timeout configuration

#### 2. Console Logs
```bash
# Watch logs real-time
tail -f .next/server.log | grep AI-REVIEW

# PM2 logs
pm2 logs perplexica | grep AI-REVIEW
```

#### 3. Performance Profiling
```typescript
const startTime = Date.now();

// Track each phase
const timings = {
  validation: 0,
  modelSelection: 0,
  search: 0,
  images: 0,
  videos: 0,
  metadata: 0,
  total: 0,
};

// Log at end
console.log('[AI-REVIEW] Performance:', timings);
```

### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Timeout 30s** | Request fails at exactly 30s | Set `maxDuration = 300` |
| **Template Error** | `Missing value for input variable` | Remove backticks from prompts |
| **Empty Response** | No message or sources | Check LLM availability |
| **403/404 Errors** | Document fetch fails | Normal, graceful handling |
| **Slow Performance** | Takes > 2min | Disable images/videos |

---

## 📝 Summary

### Key Takeaways

1. **Architecture**: Multi-phase pipeline với parallel processing
2. **Core Flow**: Query → Search → Rerank → Generate → Enhance
3. **Optimization**: Parallel media fetch, timeouts, reranking
4. **Error Handling**: Graceful degradation for non-critical errors
5. **Performance**: 90-120s full, 30-60s without media

### Best Practices

- ✅ Always include timeout protection
- ✅ Log all major phases for debugging
- ✅ Handle errors gracefully
- ✅ Use parallel processing when possible
- ✅ Cache results when appropriate

### Related Documentation

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [LangChain Documentation](https://js.langchain.com/)
- [SearXNG Documentation](https://docs.searxng.org/)

---

**Last Updated:** 2025-10-21  
**Version:** 1.0  
**Maintainer:** AI Team

