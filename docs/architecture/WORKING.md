# Cách Perplexica hoạt động

Tài liệu này giải thích chi tiết cách Perplexica xử lý các truy vấn và tạo ra câu trả lời. Để hiểu rõ hơn về kiến trúc tổng thể, hãy đọc [README.md](./README.md) trước.

## Mục lục

- [Tổng quan quy trình](#tổng-quan-quy-trình)
- [Luồng xử lý chi tiết](#luồng-xử-lý-chi-tiết)
- [Các thành phần xử lý](#các-thành-phần-xử-lý)
- [Tìm kiếm hình ảnh và video](#tìm-kiếm-hình-ảnh-và-video)
- [Trích dẫn nguồn](#trích-dẫn-nguồn)

---

## Tổng quan quy trình

Khi người dùng gửi một câu hỏi, Perplexica thực hiện các bước sau:

1. **Nhận và xác thực request** từ frontend
2. **Dự đoán nhu cầu tìm kiếm** dựa trên lịch sử chat và câu hỏi
3. **Tạo query tối ưu** nếu cần tìm kiếm
4. **Tìm kiếm web** qua SearXNG
5. **Rerank kết quả** sử dụng embeddings và similarity search
6. **Tạo câu trả lời** với context từ các nguồn đã tìm được
7. **Stream response** về frontend với citations

---

## Luồng xử lý chi tiết

### Ví dụ: "How does an A.C. work?"

#### Bước 1: Request đến API

```
Frontend → POST /api/chat
{
  message: { content: "How does an A.C. work?", chatId: "...", messageId: "..." },
  focusMode: "webSearch",
  history: [...],
  chatModel: { provider: "openai", name: "gpt-4" },
  embeddingModel: { provider: "openai", name: "text-embedding-3-small" }
}
```

**File**: `src/app/api/chat/route.ts`

#### Bước 2: Khởi tạo và chọn handler

```typescript
// Route handler:
const handler = searchHandlers[body.focusMode]; // webSearch handler
const llm = chatModel.model; // GPT-4 instance
const embedding = embeddingModel.model; // Embedding model
```

**File**: `src/lib/search/index.ts`

#### Bước 3: Search Retriever Chain

Handler gọi `MetaSearchAgent.searchAndAnswer()`, bắt đầu với **Search Retriever Chain**:

**Mục đích**: Quyết định có cần tìm kiếm web không và tạo query tối ưu.

**Quy trình**:

1. **Input**: Chat history + User query
2. **LLM Prediction**: 
   - Prompt: `queryGeneratorPrompt` (từ config)
   - Few-shot examples: `queryGeneratorFewShots`
   - Output: 
     - `question`: Query đã được tối ưu hóa
     - `links`: Danh sách links cần crawl (nếu có)
     - Hoặc `not_needed` nếu không cần tìm kiếm

3. **Xử lý kết quả**:
   - Nếu `question === 'not_needed'`: Trả về empty docs, bỏ qua search
   - Nếu có `links`: Crawl và summarize các links đó
   - Nếu không có links: Tiến hành search web

**File**: `src/lib/search/metaSearchAgent.ts` - method `createSearchRetrieverChain()`

#### Bước 4: Tìm kiếm SearXNG

Nếu cần tìm kiếm web:

```typescript
const res = await searchSearxng(query, {
  engines: config.activeEngines || [], // Empty = tất cả engines
});
```

**SearXNG** trả về:
- `results[]`: Danh sách kết quả với title, url, content snippet
- Metadata: engine source, relevance score

**File**: `src/lib/searxng.ts`

#### Bước 5: Rerank Documents

Sau khi có kết quả từ SearXNG, hệ thống rerank để tìm các nguồn phù hợp nhất:

**Quy trình**:

1. **Convert to Documents**:
   ```typescript
   docs = searchResults.map(result => new Document({
     pageContent: result.content,
     metadata: { url: result.url, title: result.title, ... }
   }));
   ```

2. **Generate Embeddings**:
   - Query embedding: `embeddingModel.embedQuery(query)`
   - Document embeddings: `embeddingModel.embedDocuments(docs)`

3. **Compute Similarity**:
   - Sử dụng cosine similarity hoặc dot product
   - Config: `SIMILARITY_MEASURE` trong `config.toml`

4. **Filter by Threshold**:
   - Chỉ giữ documents có similarity >= `rerankThreshold`
   - Optimization modes:
     - `speed`: Giới hạn số lượng docs
     - `balanced`: Cân bằng giữa chất lượng và tốc độ
     - `quality`: Giữ nhiều docs hơn để đảm bảo chất lượng

**File**: `src/lib/search/metaSearchAgent.ts` - method `rerankDocs()`

#### Bước 6: Answer Generation Chain

Sau khi có context documents, hệ thống tạo câu trả lời:

**Input**:
- `query`: Câu hỏi của user
- `chat_history`: Lịch sử cuộc trò chuyện
- `context`: Các documents đã được rerank và format
- `systemInstructions`: Hướng dẫn hệ thống (nếu có)
- `date`: Ngày hiện tại (để LLM biết thông tin mới nhất)

**Prompt Structure**:
```
System: {responsePrompt}
  - Hướng dẫn LLM cách trả lời
  - Yêu cầu cite sources
  - Format response

Chat History: {chat_history}

User: {query}

Context: {formatted_context}
```

**Streaming**:
- Response được stream về frontend theo chunks
- Mỗi chunk được emit qua EventEmitter
- Frontend nhận và hiển thị real-time

**File**: `src/lib/search/metaSearchAgent.ts` - method `createAnsweringChain()`

#### Bước 7: Lưu vào Database

Sau khi stream hoàn tất:

1. **Lưu user message**: `messages` table với `role='user'`
2. **Lưu assistant response**: `messages` table với `role='assistant'`
3. **Lưu sources**: `messages` table với `role='source'` và `sources` JSON

**File**: `src/app/api/chat/route.ts` - function `handleHistorySave()`

---

## Các thành phần xử lý

### MetaSearchAgent

Class chính xử lý tìm kiếm và trả lời.

**Config Options**:

- `searchWeb`: Có tìm kiếm web không (false cho writingAssistant)
- `rerank`: Có rerank documents không
- `rerankThreshold`: Ngưỡng similarity để giữ documents
- `activeEngines`: Danh sách SearXNG engines cụ thể (empty = tất cả)
- `queryGeneratorPrompt`: Prompt để generate query
- `queryGeneratorFewShots`: Few-shot examples cho query generation
- `responsePrompt`: Prompt để generate response

**File**: `src/lib/search/metaSearchAgent.ts`

### Focus Modes

Mỗi focus mode có config riêng:

#### webSearch
- `searchWeb: true`
- `rerank: true`
- `rerankThreshold: 0.3`
- `activeEngines: []` (tất cả engines)

#### academicSearch
- `searchWeb: true`
- `rerank: true`
- `rerankThreshold: 0`
- `activeEngines: ['arxiv', 'google scholar', 'pubmed']`

#### writingAssistant
- `searchWeb: false` (không tìm kiếm web)
- `rerank: true`
- Sử dụng prompt riêng: `writingAssistantPrompt`

#### youtubeSearch
- `searchWeb: true`
- `activeEngines: ['youtube']`

#### redditSearch
- `searchWeb: true`
- `activeEngines: ['reddit']`

#### wolframAlphaSearch
- `searchWeb: true`
- `rerank: false` (Wolfram Alpha tự xử lý)
- `activeEngines: ['wolframalpha']`

**File**: `src/lib/search/index.ts`

---

## Tìm kiếm hình ảnh và video

### Image Search Flow

```
1. User Request → /api/images
2. Image Search Chain:
   ├─ Rephrase query (standalone, không phụ thuộc context)
   ├─ Search SearXNG với engines: ['bing images', 'google images']
   └─ Return formatted results: { img_src, url, title }[]
```

**File**: `src/lib/chains/imageSearchAgent.ts`

### Video Search Flow

```
1. User Request → /api/videos
2. Video Search Chain:
   ├─ Rephrase query (standalone)
   ├─ Search SearXNG với engines: ['youtube']
   └─ Return formatted results: { title, url, iframe_src }[]
```

**File**: `src/lib/chains/videoSearchAgent.ts`

**Khác biệt với web search**:
- Không có reranking bằng embeddings
- Query được rephrase thành standalone (không cần context)
- Kết quả trả về trực tiếp từ SearXNG

---

## Trích dẫn nguồn

### Cách LLM cite sources

LLM được prompt để tự động cite sources trong response:

**Prompt instruction** (từ `webSearchResponsePrompt`):
```
- Cite sources using [number] format
- Only cite when using information from sources
- Be accurate with citations
```

**Ví dụ response**:
```
Air conditioning works by... [1] The compressor... [2]
```

### Frontend Processing

Frontend parse response để extract citations:

1. **Parse citations**: Tìm pattern `[number]` trong response
2. **Map to sources**: Map số citation với sources array
3. **Display**: Hiển thị citations như clickable links

**File**: `src/components/Citation.tsx`, `src/components/MessageSources.tsx`

### Source Format

Sources được lưu trong database dạng:

```typescript
{
  pageContent: string,
  metadata: {
    url: string,
    title: string,
    // ... other metadata
  }
}[]
```

---

## Tối ưu hóa Performance

### Optimization Modes

1. **speed**: 
   - Giới hạn số documents được rerank
   - Giảm số lượng sources được xử lý

2. **balanced** (default):
   - Cân bằng giữa chất lượng và tốc độ
   - Rerank với threshold hợp lý

3. **quality**:
   - Giữ nhiều documents hơn
   - Rerank kỹ lưỡng hơn
   - Tốn thời gian hơn nhưng chất lượng tốt hơn

### Caching

- **Model instances**: Được cache và reuse
- **Embeddings**: Có thể cache cho các queries tương tự
- **Database**: SQLite với indexes để query nhanh

---

## Xử lý File Attachments

Khi user attach files:

1. **Upload**: Files được upload và lưu trong `uploads/`
2. **Process**: 
   - PDF: Parse với `pdf-parse`
   - DOCX: Parse với `mammoth`
   - Text: Đọc trực tiếp
3. **Convert to Documents**: Chuyển thành LangChain Documents
4. **Include in Context**: Thêm vào context cùng với web search results
5. **Rerank**: Rerank cùng với web documents

**File**: `src/lib/utils/files.ts`, `src/lib/utils/documents.ts`

---

## Error Handling

### Common Errors

1. **No LLM configured**: 
   - Check `config.toml` hoặc settings
   - Ensure API keys are valid

2. **SearXNG connection error**:
   - Check `SEARXNG_API_URL` hoặc `API_ENDPOINTS.SEARXNG`
   - Ensure SearXNG is running

3. **Embedding model error**:
   - Check embedding model provider
   - Ensure model is available

4. **Database error**:
   - Check SQLite file permissions
   - Run migrations if needed: `npm run db:migrate`

### Error Flow

```
Error occurs → Catch in route handler
  → Log error
  → Return error response to frontend
  → Frontend displays error message
```

---

## Debugging Tips

### Enable LangChain Tracing

```typescript
// In chain config
.withConfig({
  runName: 'ChainName',
  tags: ['debug'],
})
```

### Check Stream Events

```typescript
// In metaSearchAgent.ts
stream.on('data', (data) => {
  console.log('Stream event:', data);
});
```

### Database Queries

```bash
# Query SQLite directly
sqlite3 data/perplexica.db
SELECT * FROM messages WHERE chatId = '...';
```

---

**Lần cập nhật cuối**: 2024
**Phiên bản**: 1.11.0-rc3
