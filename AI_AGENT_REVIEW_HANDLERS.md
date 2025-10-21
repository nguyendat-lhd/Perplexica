# AI Agent Review Handlers - Tài liệu phân biệt

## Tổng quan

Hệ thống có **2 handlers riêng biệt** cho AI Agent Review:

### 1. `aiAgentReview` - Dùng cho Chat Focus Mode
**Vị trí**: `src/lib/search/index.ts` (line 70-78)
**Prompts**: `src/lib/prompts/aiAgentReview.ts`
**Sử dụng tại**: 
- Chat interface với focus mode "AI Agent Review"
- API endpoint: `/api/chat` với `focusMode: "aiAgentReview"`

**Mục đích**: 
- Tương tác trò chuyện liên tục với người dùng
- Phản hồi streaming trong chat
- Có lịch sử hội thoại

### 2. `aiAgentReviewApi` - Dùng cho API Endpoint
**Vị trí**: `src/lib/search/index.ts` (line 79-87)
**Prompts**: `src/lib/prompts/aiAgentReviewApi.ts`
**Sử dụng tại**: 
- API endpoint: `/api/ai-agent-review`

**Mục đích**: 
- Tạo đánh giá AI agent một lần với format JSON chuẩn
- Trả về kết quả hoàn chỉnh với images, videos, metadata
- Không có lịch sử hội thoại
- Tối ưu cho việc lấy dữ liệu structured

## Sự khác biệt chính

| Khía cạnh | aiAgentReview (Chat) | aiAgentReviewApi (API) |
|-----------|---------------------|------------------------|
| **Use case** | Chat tương tác | Lấy dữ liệu AI agent |
| **Response format** | Stream text + sources | JSON structured + images + videos + metadata |
| **History** | Có lịch sử chat | Không có lịch sử |
| **Prompts** | aiAgentReview.ts | aiAgentReviewApi.ts |
| **Focus** | Trò chuyện tự nhiên | Extract structured data |

## Tùy chỉnh Prompts

### Khi nào tùy chỉnh `aiAgentReview.ts`:
- Muốn thay đổi cách AI trả lời trong chat
- Điều chỉnh giọng điệu hội thoại
- Thêm/bớt thông tin trong phản hồi chat

### Khi nào tùy chỉnh `aiAgentReviewApi.ts`:
- Thay đổi cấu trúc JSON output
- Thêm/bớt fields trong metadata
- Điều chỉnh cách extract thông tin từ search results
- Thay đổi format cho API response

## Lưu ý quan trọng

⚠️ **KHÔNG** được thay đổi chéo giữa 2 handlers vì:
- Mỗi handler có mục đích sử dụng khác nhau
- Prompts được tối ưu cho từng use case cụ thể
- Thay đổi một handler không ảnh hưởng đến handler kia

## Kiểm tra handlers

### Test AI Agent Review (Chat):
```bash
# Trong chat interface, chọn focus mode "AI Agent Review"
# Hoặc gọi API:
POST /api/chat
{
  "focusMode": "aiAgentReview",
  "message": { "content": "Cho tôi biết về ChatGPT" },
  ...
}
```

### Test AI Agent Review API:
```bash
POST /api/ai-agent-review
{
  "query": "Cho tôi biết về ChatGPT",
  "history": [],
  "includeImages": true,
  "includeVideos": true
}
```

## Cấu trúc Files

```
src/
├── lib/
│   ├── prompts/
│   │   ├── aiAgentReview.ts        # Prompts cho Chat
│   │   ├── aiAgentReviewApi.ts     # Prompts cho API  ⭐ MỚI
│   │   └── index.ts                # Export tất cả prompts
│   └── search/
│       ├── index.ts                # Define cả 2 handlers
│       └── metaSearchAgent.ts      # Base class cho handlers
└── app/
    └── api/
        ├── chat/
        │   └── route.ts           # Sử dụng aiAgentReview
        └── ai-agent-review/
            └── route.ts           # Sử dụng aiAgentReviewApi ⭐ ĐÃ CẬP NHẬT
```

## Changelog

### 2025-10-21
- ✅ Tạo file `aiAgentReviewApi.ts` cho prompts riêng của API
- ✅ Thêm handler `aiAgentReviewApi` vào `search/index.ts`
- ✅ Cập nhật `/api/ai-agent-review/route.ts` sử dụng handler mới
- ✅ Giữ nguyên handler `aiAgentReview` cho chat focus mode
- ✅ Tách biệt hoàn toàn 2 handlers để dễ tùy chỉnh riêng

## Kết luận

Bây giờ bạn có thể:
- ✅ Tùy chỉnh prompts cho Chat mà không ảnh hưởng API
- ✅ Tùy chỉnh prompts cho API mà không ảnh hưởng Chat
- ✅ Test từng handler độc lập
- ✅ Dễ dàng maintain và debug

Nếu cần thay đổi:
- **Chat behavior** → Sửa `src/lib/prompts/aiAgentReview.ts`
- **API response** → Sửa `src/lib/prompts/aiAgentReviewApi.ts`

