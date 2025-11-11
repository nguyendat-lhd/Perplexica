# Ví dụ thực tế: Code Mode vs MCP Mode

Các ví dụ này giúp bạn hiểu rõ sự khác biệt giữa Code Mode và MCP Mode trong Claude Desktop.

## Ví dụ 1: Tìm kiếm đơn giản

### MCP Mode (Tự động)

**Prompt:**
```
Tìm kiếm thông tin về "What is Perplexica?"
```

**Claude sẽ:**
- Tự động gọi tool `perplexica_search`
- Trả về kết quả tìm kiếm

**Kết quả:** Câu trả lời về Perplexica

---

### Code Mode (Yêu cầu code)

**Prompt:**
```
Hãy viết TypeScript code để tìm kiếm "What is Perplexica?" sử dụng Perplexica API.
Code sẽ được execute trong sandbox.
```

**Claude sẽ generate:**
```typescript
const api = new PerplexicaAPI('http://localhost:3000');
const result = await api.search({
  query: "What is Perplexica?",
  focusMode: "webSearch"
});
return result;
```

**Kết quả:** Cùng kết quả nhưng thông qua code execution

---

## Ví dụ 2: Chain nhiều calls (Ưu điểm Code Mode)

### MCP Mode (Nhiều tool calls)

**Prompt:**
```
Tìm kiếm "latest AI trends" và sau đó tìm hình ảnh liên quan
```

**Claude sẽ:**
1. Gọi `perplexica_search({ query: "latest AI trends" })`
2. Đợi kết quả
3. Gọi `perplexica_search_images({ query: "latest AI trends" })`
4. Đợi kết quả
5. Tổng hợp

**Thời gian:** ~3-5 giây (2 round-trips)

---

### Code Mode (1 code execution)

**Prompt:**
```
Hãy viết TypeScript code để:
1. Tìm kiếm "latest AI trends"
2. Sau đó tìm kiếm hình ảnh liên quan
3. Trả về kết quả tổng hợp
```

**Claude sẽ generate:**
```typescript
const api = new PerplexicaAPI('http://localhost:3000');

// Step 1: Search
const searchResult = await api.search({
  query: "latest AI trends",
  focusMode: "webSearch"
});

// Step 2: Search images
const images = await api.searchImages({
  query: "latest AI trends"
});

// Step 3: Combine results
return {
  summary: searchResult.message,
  sources: searchResult.sources,
  images: images.images.slice(0, 5)
};
```

**Thời gian:** ~1-2 giây (1 execution)

**Ưu điểm:** Nhanh hơn, có thể xử lý logic phức tạp

---

## Ví dụ 3: Xử lý logic phức tạp (Chỉ Code Mode)

### Task: Tìm kiếm nhiều topics và tổng hợp

**Prompt (Code Mode):**
```
Hãy viết TypeScript code để:
1. Tìm kiếm 3 topics khác nhau về AI: "machine learning", "deep learning", "neural networks"
2. Với mỗi topic, tìm 2 hình ảnh liên quan
3. Tổng hợp tất cả kết quả thành một object có cấu trúc:
   {
     topics: [
       {
         name: "...",
         summary: "...",
         images: [...]
       }
     ]
   }
```

**Claude sẽ generate:**
```typescript
const api = new PerplexicaAPI('http://localhost:3000');

const topics = ["machine learning", "deep learning", "neural networks"];

const results = await Promise.all(
  topics.map(async (topic) => {
    // Search for topic
    const searchResult = await api.search({
      query: topic,
      focusMode: "webSearch"
    });
    
    // Search images
    const images = await api.searchImages({
      query: topic
    });
    
    return {
      name: topic,
      summary: searchResult.message,
      images: images.images.slice(0, 2).map(img => ({
        url: img.url,
        title: img.title
      }))
    };
  })
);

return { topics: results };
```

**Kết quả:** Object có cấu trúc với 3 topics, mỗi topic có summary và 2 images

**Lưu ý:** Task này khó thực hiện với MCP Mode vì cần nhiều tool calls và logic phức tạp

---

## Ví dụ 4: So sánh kết quả từ nhiều sources

### Code Mode

**Prompt:**
```
Hãy viết TypeScript code để:
1. Tìm kiếm "Python vs JavaScript" với focusMode "webSearch"
2. Tìm kiếm "Python vs JavaScript" với focusMode "redditSearch"
3. So sánh và tổng hợp kết quả từ cả hai sources
```

**Claude sẽ generate:**
```typescript
const api = new PerplexicaAPI('http://localhost:3000');

const query = "Python vs JavaScript";

// Search web
const webResult = await api.search({
  query,
  focusMode: "webSearch"
});

// Search Reddit
const redditResult = await api.search({
  query,
  focusMode: "redditSearch"
});

return {
  web: {
    summary: webResult.message,
    sources: webResult.sources
  },
  reddit: {
    summary: redditResult.message,
    sources: redditResult.sources
  },
  comparison: {
    webSources: webResult.sources.length,
    redditSources: redditResult.sources.length,
    webSummaryLength: webResult.message.length,
    redditSummaryLength: redditResult.message.length
  }
};
```

**Kết quả:** So sánh chi tiết giữa web search và Reddit search

---

## Ví dụ 5: Research workflow phức tạp

### Code Mode

**Prompt:**
```
Hãy viết TypeScript code để thực hiện research workflow:
1. Tìm kiếm academic papers về "transformer architecture"
2. Tìm kiếm video tutorials về "transformer architecture"
3. Tìm kiếm hình ảnh về "transformer architecture"
4. Tổng hợp tất cả thành một research report với format:
   {
     topic: "transformer architecture",
     academicPapers: [...],
     videos: [...],
     images: [...],
     summary: "..."
   }
```

**Claude sẽ generate:**
```typescript
const api = new PerplexicaAPI('http://localhost:3000');

const topic = "transformer architecture";

// Parallel execution for better performance
const [academicResult, videosResult, imagesResult] = await Promise.all([
  // Academic search
  api.search({
    query: topic,
    focusMode: "academicSearch"
  }),
  // Video search
  api.searchVideos({
    query: topic
  }),
  // Image search
  api.searchImages({
    query: topic
  })
]);

return {
  topic,
  academicPapers: academicResult.sources.map(s => ({
    title: s.title,
    url: s.url,
    snippet: s.snippet
  })),
  videos: videosResult.videos.slice(0, 5).map(v => ({
    title: v.title,
    url: v.url,
    thumbnail: v.thumbnail
  })),
  images: imagesResult.images.slice(0, 5).map(img => ({
    url: img.url,
    title: img.title
  })),
  summary: academicResult.message
};
```

**Kết quả:** Research report đầy đủ với academic papers, videos, và images

---

## Tips để sử dụng hiệu quả

### 1. MCP Mode - Dùng khi:
- ✅ Câu hỏi đơn giản
- ✅ Chỉ cần một search
- ✅ Muốn Claude tự quyết định

**Ví dụ prompts:**
- "Tìm kiếm về machine learning"
- "Tìm hình ảnh về cats"
- "Tìm video về cooking pasta"

### 2. Code Mode - Dùng khi:
- ✅ Cần nhiều operations
- ✅ Cần xử lý logic
- ✅ Cần performance tốt

**Ví dụ prompts:**
- "Hãy viết code để tìm kiếm X và sau đó Y"
- "Hãy viết code để so sánh A và B"
- "Hãy viết code để tổng hợp research về topic X"

### 3. Best Practices:

**Prompt rõ ràng:**
```
❌ "Tìm kiếm và tổng hợp"
✅ "Hãy viết TypeScript code để:
   1. Tìm kiếm 'X'
   2. Tìm kiếm 'Y'
   3. Tổng hợp kết quả"
```

**Yêu cầu structure:**
```
✅ "Trả về object có format: { summary: string, items: array }"
```

**Handle errors:**
```
✅ "Hãy viết code với error handling"
```

---

## Test ngay trong Claude Desktop

1. **Mở Claude Desktop**
2. **Test MCP Mode:**
   ```
   Tìm kiếm "What is Perplexica?"
   ```
3. **Test Code Mode:**
   ```
   Hãy viết TypeScript code để tìm kiếm "What is Perplexica?" 
   và sau đó tìm hình ảnh liên quan. Trả về kết quả tổng hợp.
   ```
4. **So sánh kết quả và thời gian**

---

Xem hướng dẫn chi tiết: [CLAUDE_CODE_MODE.md](./docs/CLAUDE_CODE_MODE.md)

