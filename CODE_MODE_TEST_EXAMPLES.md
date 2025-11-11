# Ví dụ Test: Code Mode Optimization trong Perplexica

Ví dụ này bạn có thể test ngay trong Claude Desktop để thấy sự khác biệt.

## Test Case: Research 3 AI Topics

### Prompt cho Claude Desktop (Code Mode):

```
Hãy viết TypeScript code để thực hiện research workflow sau:

1. Tìm kiếm 3 topics về AI: "machine learning", "deep learning", "neural networks"
2. Với mỗi topic, thực hiện:
   - Web search với focusMode "webSearch"
   - Academic search với focusMode "academicSearch"  
   - Tìm kiếm hình ảnh
   - Tìm kiếm video
3. Process và filter data:
   - Chỉ lấy 500 ký tự đầu của web search summary
   - Chỉ lấy top 5 academic papers
   - Chỉ lấy top 3 images và videos
4. Tổng hợp tất cả thành một research report
5. Lưu report vào filesystem tại './workspace/research-report.json'
6. Return summary object với:
   - Tổng số topics
   - Tổng số sources
   - Path đến report file

Code sẽ được execute trong sandbox với PerplexicaAPI và filesystem access.
```

### Code mà Claude sẽ generate:

```typescript
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
      webSummary: webSearch.message.substring(0, 500),
      academicPapers: academicSearch.sources.slice(0, 5),
      topImages: images.images.slice(0, 3),
      topVideos: videos.videos.slice(0, 3),
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

// Return summary (nhẹ)
return {
  success: true,
  reportPath: './workspace/research-report.json',
  summary: report.summary,
};
```

### Kết quả mong đợi:

```json
{
  "success": true,
  "reportPath": "./workspace/research-report.json",
  "summary": {
    "totalTopics": 3,
    "totalSources": 45
  }
}
```

**Thời gian:** ~6 giây (parallel execution)  
**Tokens:** ~2,700 tokens (chỉ code + summary)

---

## So sánh với MCP Mode

### Nếu dùng MCP Mode (Traditional):

```
User: Hãy research 3 topics về AI: "machine learning", "deep learning", "neural networks"
      Với mỗi topic cần: web search, academic search, images, videos
      Tổng hợp thành report

→ Claude sẽ gọi 12 tool calls tuần tự:
1. perplexica_search("machine learning", "webSearch")
2. perplexica_search("machine learning", "academicSearch")
3. perplexica_search_images("machine learning")
4. perplexica_search_videos("machine learning")
... (lặp lại cho 2 topics còn lại)

Thời gian: ~24 giây
Tokens: ~210,000 tokens
```

---

## Test Case 2: Progressive Tool Discovery

### Prompt:

```
Hãy viết code để:
1. List tất cả available servers
2. Search tools với keyword "image"
3. Get full definition của tool search images
4. Sử dụng tool đó để tìm 5 hình ảnh về "cute cats"
5. Lưu kết quả vào './workspace/cats-images.json'
```

### Code:

```typescript
// Step 1: Discover servers
const servers = listServers();
console.log('Available servers:', servers);

// Step 2: Search for tools
const imageTools = searchTools('image', 'summary');
console.log('Found image tools:', imageTools);

// Step 3: Get full tool definition
const tool = getToolByPath('servers/perplexica/searchImages.ts');
console.log('Tool description:', tool.description);

// Step 4: Use the tool
const api = new PerplexicaAPI();
const images = await api.searchImages({ query: "cute cats" });

// Step 5: Save results
const top5 = images.images.slice(0, 5);
await fs.writeFile('./workspace/cats-images.json', JSON.stringify(top5, null, 2));

return {
  found: top5.length,
  saved: './workspace/cats-images.json'
};
```

**Tokens:** ~1,500 tokens (chỉ load tools cần thiết)  
**vs MCP Mode:** ~150,000 tokens (load tất cả tools)

---

## Test Case 3: State Persistence

### Prompt:

```
Hãy viết code để:
1. Tìm kiếm "latest AI trends 2024"
2. Lưu kết quả vào './workspace/trends.json'
3. Đọc lại file vừa lưu
4. Extract top 5 keywords từ summary
5. Tìm kiếm hình ảnh cho mỗi keyword
6. Lưu tất cả vào './workspace/trends-with-images.json'
```

### Code:

```typescript
const api = new PerplexicaAPI();

// Step 1: Search
const searchResult = await api.search({ 
  query: "latest AI trends 2024", 
  focusMode: "webSearch" 
});

// Step 2: Save
await fs.writeFile('./workspace/trends.json', JSON.stringify(searchResult, null, 2));

// Step 3: Read back
const saved = await fs.readFile('./workspace/trends.json', 'utf-8');
const loaded = JSON.parse(saved);

// Step 4: Extract keywords (simple extraction)
const words = loaded.message.split(' ').filter(w => w.length > 5);
const keywords = [...new Set(words)].slice(0, 5);

// Step 5: Search images for each keyword
const imageResults = await Promise.all(
  keywords.map(keyword => api.searchImages({ query: keyword }))
);

// Step 6: Combine and save
const combined = {
  trends: loaded.message,
  keywords,
  images: imageResults.map((r, i) => ({
    keyword: keywords[i],
    images: r.images.slice(0, 3)
  }))
};

await fs.writeFile('./workspace/trends-with-images.json', JSON.stringify(combined, null, 2));

return {
  keywords: keywords.length,
  totalImages: combined.images.reduce((sum, item) => sum + item.images.length, 0)
};
```

**Lợi ích:** 
- ✅ Intermediate results không đi qua context
- ✅ Có thể resume từ bất kỳ điểm nào
- ✅ Không giới hạn bởi context window

---

## Test ngay trong Claude Desktop

1. **Mở Claude Desktop**
2. **Paste một trong các prompts trên**
3. **So sánh kết quả:**
   - Thời gian execution
   - Số tokens sử dụng
   - Quality của kết quả

Bạn sẽ thấy Code Mode:
- ⚡ Nhanh hơn nhiều (parallel execution)
- 💰 Tiết kiệm tokens đáng kể
- 🎯 Linh hoạt hơn (logic phức tạp)
- 💾 Có thể persist state

