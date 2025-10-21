# Changelog - Tách AI Agent Review Handlers

**Ngày**: 21/10/2025  
**Mục đích**: Tách riêng 2 handlers để dễ điều chỉnh và tránh conflict giữa Chat mode và API endpoint

## Vấn đề ban đầu

❌ **Trước đây**:
- Cả **AI Agent Review Mode** (chat) và **API `/api/ai-agent-review`** đều dùng chung handler `searchHandlers['aiAgentReview']`
- Khi thay đổi prompt cho API → Chat mode bị lỗi không load được
- Không thể tùy chỉnh riêng cho từng use case

## Giải pháp

✅ **Sau khi tách**:
- **2 handlers độc lập**:
  - `aiAgentReview` → Cho Chat Focus Mode
  - `aiAgentReviewApi` → Cho API Endpoint
- **2 bộ prompts riêng**:
  - `aiAgentReview.ts` → Prompts cho Chat
  - `aiAgentReviewApi.ts` → Prompts cho API
- Tùy chỉnh mỗi handler không ảnh hưởng handler kia

## Files đã thay đổi

### 1. ✅ Tạo mới: `src/lib/prompts/aiAgentReviewApi.ts`
**Nội dung**: Copy toàn bộ từ `aiAgentReview.ts` làm baseline
**Prompts**:
- `aiAgentReviewApiRetrieverPrompt`
- `aiAgentReviewApiRetrieverFewShots`
- `aiAgentReviewApiResponsePrompt`

### 2. ✅ Cập nhật: `src/lib/prompts/index.ts`
**Thay đổi**:
```typescript
// Thêm import
import {
  aiAgentReviewApiResponsePrompt,
  aiAgentReviewApiRetrieverPrompt,
  aiAgentReviewApiRetrieverFewShots,
} from './aiAgentReviewApi';

// Thêm export
const prompts = {
  // ... existing prompts
  aiAgentReviewApiResponsePrompt,
  aiAgentReviewApiRetrieverPrompt,
  aiAgentReviewApiRetrieverFewShots,
};
```

### 3. ✅ Cập nhật: `src/lib/search/index.ts`
**Thay đổi**:
```typescript
// Thêm handler mới
export const searchHandlers: Record<string, MetaSearchAgent> = {
  // ... existing handlers
  aiAgentReview: new MetaSearchAgent({
    // Giữ nguyên config cũ
    queryGeneratorPrompt: prompts.aiAgentReviewRetrieverPrompt,
    responsePrompt: prompts.aiAgentReviewResponsePrompt,
    queryGeneratorFewShots: prompts.aiAgentReviewRetrieverFewShots,
    // ...
  }),
  aiAgentReviewApi: new MetaSearchAgent({
    // Config mới với prompts riêng
    queryGeneratorPrompt: prompts.aiAgentReviewApiRetrieverPrompt,
    responsePrompt: prompts.aiAgentReviewApiResponsePrompt,
    queryGeneratorFewShots: prompts.aiAgentReviewApiRetrieverFewShots,
    // ...
  }),
};
```

### 4. ✅ Cập nhật: `src/app/api/ai-agent-review/route.ts`
**Thay đổi**:
```typescript
// Trước:
const searchHandler = searchHandlers['aiAgentReview'];

// Sau:
const searchHandler = searchHandlers['aiAgentReviewApi'];
```

### 5. ✅ Tạo mới: `AI_AGENT_REVIEW_HANDLERS.md`
**Nội dung**: Tài liệu hướng dẫn phân biệt và sử dụng 2 handlers

### 6. ✅ Tạo mới: `test-ai-agent-handlers.js`
**Nội dung**: Script để test và verify cấu hình

## Cách sử dụng sau khi tách

### Chat Focus Mode (aiAgentReview)
```bash
# Trong chat interface
Focus Mode: "AI Agent Review"
Query: "Cho tôi biết về ChatGPT"

# Hoặc qua API
POST /api/chat
{
  "focusMode": "aiAgentReview",
  "message": { "content": "Cho tôi biết về ChatGPT" },
  ...
}
```
**Handler sử dụng**: `aiAgentReview`  
**Prompts**: `src/lib/prompts/aiAgentReview.ts`

### API Endpoint (aiAgentReviewApi)
```bash
POST /api/ai-agent-review
{
  "query": "Cho tôi biết về ChatGPT",
  "history": [],
  "includeImages": true,
  "includeVideos": true
}
```
**Handler sử dụng**: `aiAgentReviewApi`  
**Prompts**: `src/lib/prompts/aiAgentReviewApi.ts`

## Tùy chỉnh Prompts

### Muốn thay đổi Chat behavior:
1. Mở `src/lib/prompts/aiAgentReview.ts`
2. Chỉnh sửa:
   - `aiAgentReviewRetrieverPrompt` (prompt tạo query)
   - `aiAgentReviewRetrieverFewShots` (ví dụ few-shot)
   - `aiAgentReviewResponsePrompt` (prompt tạo response)
3. Restart server
4. Test trong chat với focus mode "AI Agent Review"

### Muốn thay đổi API response format:
1. Mở `src/lib/prompts/aiAgentReviewApi.ts`
2. Chỉnh sửa:
   - `aiAgentReviewApiRetrieverPrompt` (prompt tạo query)
   - `aiAgentReviewApiRetrieverFewShots` (ví dụ few-shot)
   - `aiAgentReviewApiResponsePrompt` (prompt tạo response JSON)
3. Restart server
4. Test API endpoint `/api/ai-agent-review`

## Lợi ích

✅ **Tách biệt concerns**: Mỗi handler phục vụ mục đích riêng  
✅ **Dễ maintain**: Thay đổi một handler không ảnh hưởng handler kia  
✅ **Tối ưu riêng**: Có thể optimize prompts cho từng use case  
✅ **Debug dễ hơn**: Lỗi ở đâu rõ ràng hơn  
✅ **Scale tốt hơn**: Dễ thêm handlers mới trong tương lai  

## Testing

### Kiểm tra cấu hình:
```bash
node test-ai-agent-handlers.js
```

### Test thực tế:
```bash
# 1. Start server
npm run dev

# 2. Test Chat Focus Mode
# - Mở http://localhost:3000
# - Chọn focus mode "AI Agent Review"
# - Gửi câu hỏi về AI agent

# 3. Test API Endpoint
curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{"query":"Cho tôi biết về ChatGPT","history":[]}'
```

## Migration Notes

⚠️ **Breaking Changes**: KHÔNG  
- API endpoints giữ nguyên
- Chat focus mode giữ nguyên
- Chỉ thay đổi internal implementation

⚠️ **Backward Compatibility**: ✅ TƯƠNG THÍCH HOÀN TOÀN  
- Tất cả existing code vẫn hoạt động bình thường
- Không cần update client code

## Kết luận

✅ **Hoàn thành tách 2 handlers riêng biệt**  
✅ **Giữ nguyên tất cả functionality**  
✅ **Dễ dàng tùy chỉnh riêng từng handler**  
✅ **Không breaking changes**  

---

**Người thực hiện**: AI Assistant  
**Review**: Cần test thực tế trên môi trường dev  
**Next steps**: Tùy chỉnh prompts cho phù hợp với yêu cầu cụ thể

