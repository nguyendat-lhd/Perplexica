# Hướng dẫn Sử dụng Code Mode với Claude Desktop

Hướng dẫn chi tiết về cách sử dụng Code Mode trong Claude Desktop và sự khác biệt với MCP mode thông thường.

## Tổng quan về Code Mode

**Code Mode** là một cách tiếp cận mới để sử dụng MCP. Thay vì Claude gọi tools trực tiếp (MCP mode), Claude sẽ viết TypeScript code để sử dụng Perplexica API.

### So sánh: MCP Mode vs Code Mode

| Đặc điểm | MCP Mode (Thông thường) | Code Mode |
|----------|-------------------------|-----------|
| **Cách hoạt động** | Claude gọi tools trực tiếp qua MCP protocol | Claude viết TypeScript code để gọi API |
| **Độ phức tạp** | Đơn giản, từng tool call riêng lẻ | Phức tạp hơn, có thể chain nhiều calls |
| **Hiệu quả** | Mỗi tool call cần feed qua neural network | Code được execute trực tiếp, không cần neural network |
| **Linh hoạt** | Giới hạn bởi tool definitions | Có thể xử lý logic phức tạp, loops, conditions |
| **Tốc độ** | Chậm hơn do nhiều round-trips | Nhanh hơn do execute code trực tiếp |

## Cách 1: Sử dụng Code Mode qua Claude Desktop (Yêu cầu Claude viết code)

### Bước 1: Đảm bảo MCP Server đã được cấu hình

Đảm bảo bạn đã setup MCP server theo hướng dẫn trong `CLAUDE_QUICKSTART.md`.

### Bước 2: Yêu cầu Claude sử dụng Code Mode

Trong Claude Desktop, bạn có thể yêu cầu Claude viết code để sử dụng Perplexica API:

#### Ví dụ 1: Tìm kiếm đơn giản với Code Mode

```
Hãy viết TypeScript code để tìm kiếm "What is Perplexica?" sử dụng Perplexica API.
Code sẽ được execute trong sandbox và có thể sử dụng PerplexicaAPI class.
```

Claude sẽ generate code như:

```typescript
// Claude sẽ tự động generate code này
const { PerplexicaAPI } = require('./api'); // hoặc import từ API
const api = new PerplexicaAPI('http://localhost:3000');

const result = await api.search({
  query: "What is Perplexica?",
  focusMode: "webSearch"
});

console.log(result.message);
console.log('Sources:', result.sources);
```

#### Ví dụ 2: Chain nhiều calls (Ưu điểm của Code Mode)

```
Hãy viết code để:
1. Tìm kiếm "latest AI trends" 
2. Sau đó tìm kiếm hình ảnh liên quan đến kết quả tìm kiếm đầu tiên
3. Cuối cùng tổng hợp kết quả
```

Code Mode cho phép chain nhiều calls mà không cần nhiều tool calls:

```typescript
const api = new PerplexicaAPI('http://localhost:3000');

// Step 1: Search
const searchResult = await api.search({
  query: "latest AI trends",
  focusMode: "webSearch"
});

// Step 2: Extract keywords và search images
const keywords = searchResult.message.split(' ').slice(0, 5).join(' ');
const images = await api.searchImages({
  query: keywords
});

// Step 3: Combine results
const summary = {
  searchResult: searchResult.message,
  sources: searchResult.sources,
  relatedImages: images.images.slice(0, 5)
};

console.log(JSON.stringify(summary, null, 2));
```

#### Ví dụ 3: Xử lý logic phức tạp

```
Hãy viết code để:
1. Tìm kiếm "machine learning frameworks"
2. Lọc các frameworks có rating cao
3. Tìm kiếm video tutorial cho mỗi framework
4. Trả về danh sách với links
```

```typescript
const api = new PerplexicaAPI('http://localhost:3000');

// Search for frameworks
const searchResult = await api.search({
  query: "machine learning frameworks",
  focusMode: "webSearch"
});

// Extract framework names (simplified)
const frameworks = ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras'];

// Search videos for each framework
const results = await Promise.all(
  frameworks.map(async (framework) => {
    const videoResult = await api.searchVideos({
      query: `${framework} tutorial`
    });
    
    return {
      framework,
      videos: videoResult.videos.slice(0, 3).map(v => ({
        title: v.title,
        url: v.url
      }))
    };
  })
);

console.log(JSON.stringify(results, null, 2));
```

## Cách 2: Sử dụng Code Mode qua HTTP API (Advanced)

Nếu bạn muốn execute code trực tiếp qua HTTP API:

### Bước 1: Lấy Code Mode API Template

```bash
curl http://localhost:3000/api/mcp?mode=code-mode-api
```

Response sẽ chứa TypeScript API code template.

### Bước 2: Execute Code

```bash
curl -X POST http://localhost:3000/api/mcp/execute-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const api = new PerplexicaAPI(); const result = await api.search({ query: \"What is Perplexica?\", focusMode: \"webSearch\" }); return result;"
  }'
```

## So sánh chi tiết: MCP Mode vs Code Mode

### MCP Mode (Tool Calling)

**Cách Claude sử dụng:**

```
User: Tìm kiếm "What is Perplexica?"

Claude sẽ tự động gọi tool:
- Tool: perplexica_search
- Arguments: { query: "What is Perplexica?", focusMode: "webSearch" }
- Response: { message: "...", sources: [...] }
```

**Ưu điểm:**
- ✅ Đơn giản, tự động
- ✅ Claude tự quyết định khi nào gọi tool
- ✅ Không cần viết code

**Nhược điểm:**
- ❌ Mỗi tool call là một round-trip riêng
- ❌ Khó chain nhiều calls phức tạp
- ❌ Không thể xử lý logic phức tạp (loops, conditions)

### Code Mode (Code Execution)

**Cách Claude sử dụng:**

```
User: Hãy viết code để tìm kiếm "What is Perplexica?" và sau đó tìm hình ảnh liên quan

Claude sẽ viết code:
```typescript
const api = new PerplexicaAPI();
const result = await api.search({ query: "What is Perplexica?", focusMode: "webSearch" });
const images = await api.searchImages({ query: result.message.split(' ').slice(0, 5).join(' ') });
return { search: result, images };
```

Code được execute trong sandbox và trả về kết quả.
```

**Ưu điểm:**
- ✅ Có thể chain nhiều calls trong một execution
- ✅ Xử lý logic phức tạp (loops, conditions, data processing)
- ✅ Nhanh hơn do execute code trực tiếp
- ✅ Linh hoạt hơn trong việc xử lý dữ liệu

**Nhược điểm:**
- ❌ Cần Claude phải viết code đúng
- ❌ Phức tạp hơn cho user
- ❌ Code execution có timeout (30 giây)

## Khi nào nên dùng Code Mode?

### Dùng Code Mode khi:

1. **Cần chain nhiều calls phức tạp**
   - Ví dụ: Search → Process results → Search images → Combine

2. **Cần xử lý logic phức tạp**
   - Ví dụ: Filter, sort, transform data từ nhiều sources

3. **Cần performance tốt hơn**
   - Ví dụ: Thực hiện nhiều operations mà không muốn nhiều round-trips

4. **Cần custom data processing**
   - Ví dụ: Extract keywords, combine results, format output

### Dùng MCP Mode khi:

1. **Tìm kiếm đơn giản**
   - Ví dụ: Chỉ cần một search query

2. **Muốn Claude tự động quyết định**
   - Ví dụ: Để Claude tự chọn khi nào cần search

3. **Không muốn viết code**
   - Ví dụ: Chỉ muốn hỏi và nhận câu trả lời

## Ví dụ thực tế: So sánh cùng một task

### Task: Tìm kiếm "AI trends" và lấy 3 hình ảnh liên quan

#### MCP Mode (3 tool calls):

```
1. Claude gọi perplexica_search({ query: "AI trends" })
   → Nhận kết quả

2. Claude phân tích kết quả và gọi perplexica_search_images({ query: "AI trends" })
   → Nhận hình ảnh

3. Claude tổng hợp kết quả
```

**Thời gian:** ~3-5 giây (3 round-trips)

#### Code Mode (1 code execution):

```typescript
const api = new PerplexicaAPI();
const searchResult = await api.search({ query: "AI trends", focusMode: "webSearch" });
const images = await api.searchImages({ query: "AI trends" });
return {
  summary: searchResult.message,
  images: images.images.slice(0, 3)
};
```

**Thời gian:** ~1-2 giây (1 execution)

## Hướng dẫn sử dụng trong Claude Desktop

### Bước 1: Mở Claude Desktop

Đảm bảo MCP server đã được cấu hình và kết nối thành công.

### Bước 2: Yêu cầu Claude sử dụng Code Mode

**Prompt mẫu:**

```
Tôi muốn bạn viết TypeScript code để sử dụng Perplexica API.
Code sẽ được execute trong sandbox và có thể sử dụng PerplexicaAPI class.

Hãy viết code để:
[Yêu cầu của bạn]

Code sẽ có access đến:
- PerplexicaAPI class với các methods: search, searchImages, searchVideos, chat, getModels, getConfig
- Base URL: http://localhost:3000
```

### Bước 3: Claude sẽ generate và execute code

Claude sẽ:
1. Viết TypeScript code sử dụng PerplexicaAPI
2. Code được execute trong sandbox
3. Trả về kết quả

## API Reference cho Code Mode

### PerplexicaAPI Class

```typescript
class PerplexicaAPI {
  constructor(baseUrl?: string);
  
  // Search methods
  async search(params: SearchParams): Promise<SearchResult>;
  async *searchStream(params: SearchParams): AsyncGenerator;
  
  // Chat
  async *chat(params: ChatParams): AsyncGenerator;
  
  // Media search
  async searchImages(params: ImageSearchParams): Promise<ImageResult>;
  async searchVideos(params: VideoSearchParams): Promise<VideoResult>;
  
  // Config
  async getModels(): Promise<ModelsResult>;
  async getConfig(): Promise<ConfigResult>;
}
```

### SearchParams

```typescript
interface SearchParams {
  query: string;
  focusMode: 'webSearch' | 'academicSearch' | 'writingAssistant' | 
            'wolframAlphaSearch' | 'youtubeSearch' | 'redditSearch';
  optimizationMode?: 'speed' | 'balanced' | 'quality';
  chatModel?: object;
  embeddingModel?: object;
  history?: any[];
  systemInstructions?: string;
}
```

## Troubleshooting

### Code không execute được

**Nguyên nhân:**
- Syntax error trong code
- Timeout (quá 30 giây)
- API không accessible

**Giải pháp:**
- Kiểm tra code syntax
- Đảm bảo Perplexica đang chạy tại `http://localhost:3000`
- Break code thành các phần nhỏ hơn

### Claude không viết code

**Nguyên nhân:**
- Prompt không rõ ràng
- Claude nghĩ nên dùng tool calling

**Giải pháp:**
- Yêu cầu rõ ràng: "Hãy viết TypeScript code..."
- Giải thích bạn muốn Code Mode, không phải tool calling

### Code chạy nhưng không có kết quả

**Nguyên nhân:**
- Code không return giá trị
- Console.log không được capture

**Giải pháp:**
- Đảm bảo code có `return` statement
- Sử dụng `return` thay vì `console.log` để trả về kết quả

## Best Practices

1. **Rõ ràng trong prompt**: Luôn yêu cầu Claude viết code một cách rõ ràng
2. **Break down complex tasks**: Chia nhỏ task phức tạp thành các bước
3. **Handle errors**: Yêu cầu Claude handle errors trong code
4. **Return structured data**: Sử dụng return với structured data thay vì console.log
5. **Test incrementally**: Test từng phần code trước khi combine

## Tài liệu tham khảo

- [MCP Code Mode Documentation](./docs/MCP_CODE_MODE.md)
- [Claude Desktop Setup Guide](./docs/MCP_CLAUDE_SETUP.md)
- [Perplexica API Guide](./docs/API/API_GUIDE_VI.md)
- [Cloudflare Code Mode Blog](https://blog.cloudflare.com/code-mode/)

