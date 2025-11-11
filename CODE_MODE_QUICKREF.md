# Quick Reference: Code Mode vs MCP Mode trong Claude Desktop

## So sánh nhanh

| | MCP Mode | Code Mode |
|---|---|---|
| **Cách dùng** | Claude tự động gọi tools | Yêu cầu Claude viết code |
| **Tốc độ** | Chậm hơn (nhiều round-trips) | Nhanh hơn (1 execution) |
| **Độ phức tạp** | Đơn giản | Phức tạp hơn |
| **Chain calls** | Khó | Dễ |

## Cách sử dụng Code Mode

### Prompt mẫu:

```
Hãy viết TypeScript code để sử dụng Perplexica API.
Code sẽ được execute trong sandbox.

Viết code để:
[Yêu cầu của bạn]
```

### Ví dụ:

**MCP Mode (Tự động):**
```
Tìm kiếm "What is Perplexica?"
```
→ Claude tự động gọi tool `perplexica_search`

**Code Mode (Yêu cầu code):**
```
Hãy viết TypeScript code để:
1. Tìm kiếm "What is Perplexica?"
2. Sau đó tìm kiếm hình ảnh liên quan
3. Trả về kết quả tổng hợp
```
→ Claude sẽ viết code và execute

## Khi nào dùng gì?

### Dùng MCP Mode khi:
- ✅ Tìm kiếm đơn giản
- ✅ Muốn Claude tự động
- ✅ Không muốn viết code

### Dùng Code Mode khi:
- ✅ Cần chain nhiều calls
- ✅ Cần xử lý logic phức tạp
- ✅ Cần performance tốt hơn

## API Reference nhanh

```typescript
const api = new PerplexicaAPI('http://localhost:3000');

// Search
await api.search({ query: "...", focusMode: "webSearch" });

// Images
await api.searchImages({ query: "..." });

// Videos  
await api.searchVideos({ query: "..." });

// Models
await api.getModels();
```

Xem hướng dẫn chi tiết: [CLAUDE_CODE_MODE.md](./docs/CLAUDE_CODE_MODE.md)

