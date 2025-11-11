# Ví dụ thực tế: Code Mode vs MCP Mode trong Perplexica

Ví dụ này minh họa cách Code Mode giúp xử lý tối ưu hơn với một research task phức tạp trong Perplexica.

## Task: Research Workflow phức tạp

**Yêu cầu:** 
- Tìm kiếm 3 topics về AI: "machine learning", "deep learning", "neural networks"
- Với mỗi topic, lấy: web search, academic papers, images, và videos
- Tổng hợp tất cả thành một research report
- Lưu kết quả để có thể tiếp tục sau

---

## Cách 1: MCP Mode (Traditional Tool Calling)

### Workflow:

```
1. TOOL CALL: perplexica_search({ query: "machine learning", focusMode: "webSearch" })
   → Wait ~2s
   → Result: { message: "...", sources: [...] } (5,000 tokens vào context)

2. TOOL CALL: perplexica_search({ query: "machine learning", focusMode: "academicSearch" })
   → Wait ~2s
   → Result: { message: "...", sources: [...] } (8,000 tokens vào context)

3. TOOL CALL: perplexica_search_images({ query: "machine learning" })
   → Wait ~2s
   → Result: { images: [...] } (3,000 tokens vào context)

4. TOOL CALL: perplexica_search_videos({ query: "machine learning" })
   → Wait ~2s
   → Result: { videos: [...] } (4,000 tokens vào context)

5. Claude phải tổng hợp kết quả topic 1 (tốn thêm tokens)

6-9. Lặp lại cho "deep learning" (4 tool calls)
10-13. Lặp lại cho "neural networks" (4 tool calls)

14. Claude tổng hợp tất cả thành report
```

### Thống kê:
- **Số tool calls:** 12 calls (4 per topic × 3 topics)
- **Thời gian:** ~24 giây (12 × 2s)
- **Tokens vào context:** 
  - Tool definitions: ~150,000 tokens (load tất cả upfront)
  - Results: ~60,000 tokens (20k per topic)
  - Tổng: **~210,000 tokens**
- **Round-trips:** 12 lần qua neural network
- **Vấn đề:** 
  - Phải đợi từng call
  - Tất cả data đi qua context
  - Khó xử lý logic phức tạp
  - Không thể lưu intermediate state

---

## Cách 2: Code Mode (Enhanced)

### Workflow:

```typescript
// Một code execution duy nhất
const api = new PerplexicaAPI();
const topics = ["machine learning", "deep learning", "neural networks"];

// Parallel execution cho tất cả topics
const results = await Promise.all(
  topics.map(async (topic) => {
    // Parallel execution cho mỗi topic
    const [webSearch, academicSearch, images, videos] = await Promise.all([
      api.search({ query: topic, focusMode: "webSearch" }),
      api.search({ query: topic, focusMode: "academicSearch" }),
      api.searchImages({ query: topic }),
      api.searchVideos({ query: topic }),
    ]);
    
    // Process và filter data trong execution environment
    return {
      topic,
      webSummary: webSearch.message.substring(0, 500), // Chỉ lấy 500 chars đầu
      academicPapers: academicSearch.sources.slice(0, 5), // Top 5 papers
      topImages: images.images.slice(0, 3), // Top 3 images
      topVideos: videos.videos.slice(0, 3), // Top 3 videos
      totalSources: webSearch.sources.length + academicSearch.sources.length,
    };
  })
);

// Tổng hợp results
const report = {
  generatedAt: new Date().toISOString(),
  topics: results,
  summary: {
    totalTopics: results.length,
    totalSources: results.reduce((sum, r) => sum + r.totalSources, 0),
  },
};

// Lưu vào filesystem (không đi qua context)
await fs.writeFile('./workspace/research-report.json', JSON.stringify(report, null, 2));

// Chỉ return summary (nhẹ)
return {
  success: true,
  reportPath: './workspace/research-report.json',
  summary: report.summary,
};
```

### Thống kê:
- **Số executions:** 1 code execution
- **Thời gian:** ~6 giây (parallel execution)
- **Tokens vào context:**
  - Tool discovery: ~2,000 tokens (chỉ load tools cần thiết)
  - Code: ~500 tokens
  - Result summary: ~200 tokens (chỉ summary, không phải full data)
  - Tổng: **~2,700 tokens**
- **Round-trips:** 1 lần (code execution)
- **Lợi ích:**
  - ✅ Parallel execution: 12 calls chạy song song
  - ✅ Data filtering: Chỉ lấy data cần thiết
  - ✅ State persistence: Lưu vào filesystem
  - ✅ Logic phức tạp: Process data trong code

---

## So sánh chi tiết

| Metric | MCP Mode | Code Mode | Cải thiện |
|--------|----------|-----------|-----------|
| **Tool calls** | 12 sequential | 12 parallel | 4x faster |
| **Thời gian** | ~24 giây | ~6 giây | **75% faster** |
| **Tokens** | ~210,000 | ~2,700 | **98.7% reduction** |
| **Round-trips** | 12 | 1 | **92% reduction** |
| **Data processing** | Trong context | Trong execution | **More efficient** |
| **State persistence** | ❌ Không | ✅ Có | **Better** |

---

## Ví dụ code cụ thể cho Perplexica

### Task: So sánh 2 AI frameworks

**MCP Mode:**
```
1. Search "TensorFlow"
2. Search "PyTorch"  
3. Search images "TensorFlow"
4. Search images "PyTorch"
5. Search videos "TensorFlow"
6. Search videos "PyTorch"
7. Claude so sánh (phải có tất cả data trong context)
```

**Code Mode:**
```typescript
const api = new PerplexicaAPI();

// Parallel search cho cả 2 frameworks
const [tfSearch, pytorchSearch, tfImages, pytorchImages, tfVideos, pytorchVideos] = 
  await Promise.all([
    api.search({ query: "TensorFlow", focusMode: "webSearch" }),
    api.search({ query: "PyTorch", focusMode: "webSearch" }),
    api.searchImages({ query: "TensorFlow" }),
    api.searchImages({ query: "PyTorch" }),
    api.searchVideos({ query: "TensorFlow" }),
    api.searchVideos({ query: "PyTorch" }),
  ]);

// Process và so sánh trong code
const comparison = {
  tensorflow: {
    summary: tfSearch.message.substring(0, 300),
    sources: tfSearch.sources.length,
    images: tfImages.images.length,
    videos: tfVideos.videos.length,
  },
  pytorch: {
    summary: pytorchSearch.message.substring(0, 300),
    sources: pytorchSearch.sources.length,
    images: pytorchImages.images.length,
    videos: pytorchVideos.videos.length,
  },
  winner: tfSearch.sources.length > pytorchSearch.sources.length ? 'TensorFlow' : 'PyTorch',
};

// Lưu full data vào filesystem
await fs.writeFile('./workspace/comparison.json', JSON.stringify({
  tensorflow: { search: tfSearch, images: tfImages, videos: tfVideos },
  pytorch: { search: pytorchSearch, images: pytorchImages, videos: pytorchVideos },
  comparison,
}, null, 2));

// Chỉ return comparison summary
return comparison;
```

**Kết quả:**
- MCP Mode: 6 tool calls, ~12s, ~100k tokens
- Code Mode: 1 execution, ~3s, ~1k tokens
- **Tiết kiệm: 75% thời gian, 99% tokens**

---

## Ví dụ với Progressive Disclosure

### Task: Tìm tool phù hợp cho một task

**MCP Mode:**
```
→ Load tất cả tool definitions vào context (~150k tokens)
→ Claude phải đọc tất cả để tìm tool phù hợp
```

**Code Mode:**
```typescript
// Step 1: Search tools on-demand
const tools = searchTools('image', 'summary');
// Chỉ load summary (~500 tokens)

// Step 2: Get full definition nếu cần
if (tools.length > 0) {
  const tool = getToolByPath(tools[0].path);
  // Load full definition (~2k tokens)
}

// Step 3: Use tool
const api = new PerplexicaAPI();
const result = await api.searchImages({ query: "cats" });
```

**Kết quả:**
- MCP Mode: Load tất cả (~150k tokens)
- Code Mode: Load on-demand (~2.5k tokens)
- **Tiết kiệm: 98.3% tokens**

---

## Ví dụ với State Persistence

### Task: Research dài hạn với nhiều bước

**MCP Mode:**
```
1. Search topic A → Result A vào context
2. Search topic B → Result B vào context (Result A vẫn ở đó)
3. Search topic C → Result C vào context (A, B vẫn ở đó)
...
→ Context window đầy, phải summarize hoặc mất data
```

**Code Mode:**
```typescript
const api = new PerplexicaAPI();
const topics = ["AI", "ML", "DL", "NLP", "CV"];

for (const topic of topics) {
  const result = await api.search({ query: topic, focusMode: "webSearch" });
  
  // Lưu vào filesystem ngay lập tức
  await fs.writeFile(`./workspace/${topic}.json`, JSON.stringify(result, null, 2));
  
  // Chỉ giữ summary trong memory
  console.log(`${topic}: ${result.message.substring(0, 100)}...`);
}

// Sau đó có thể load lại bất kỳ topic nào
const aiResult = JSON.parse(await fs.readFile('./workspace/AI.json', 'utf-8'));
```

**Kết quả:**
- MCP Mode: Tất cả data trong context → overflow
- Code Mode: Data trong filesystem → không giới hạn
- **Lợi ích: Có thể research không giới hạn topics**

---

## Kết luận

Code Mode trong Perplexica giúp:

1. **Tiết kiệm tokens:** 98.7% reduction với progressive disclosure
2. **Nhanh hơn:** 75% faster với parallel execution  
3. **Linh hoạt hơn:** Xử lý logic phức tạp trong code
4. **Scalable:** State persistence cho research dài hạn
5. **Efficient:** Filter/transform data trước khi vào context

**Use Code Mode khi:**
- ✅ Cần nhiều operations
- ✅ Cần xử lý logic phức tạp
- ✅ Cần performance tốt
- ✅ Cần state persistence
- ✅ Cần research dài hạn

**Use MCP Mode khi:**
- ✅ Tìm kiếm đơn giản
- ✅ Muốn Claude tự động quyết định
- ✅ Không muốn viết code

