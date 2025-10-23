# 🤖 AI Agent Documentation

Tài liệu về các tính năng AI Agent và xử lý review trong Perplexica.

## 📑 Nội dung

### Tổng quan
- **[AI_AGENT_REVIEW_MODE.md](./AI_AGENT_REVIEW_MODE.md)** - Chế độ review của AI Agent, cách hoạt động và cấu hình
- **[AI_AGENT_REVIEW_HANDLERS.md](./AI_AGENT_REVIEW_HANDLERS.md)** - Chi tiết về các handler xử lý review

### API Documentation
- **[API_AI_AGENT_REVIEW_FLOW.md](./API_AI_AGENT_REVIEW_FLOW.md)** - Luồng xử lý API review, request/response format
- **[API_AI_AGENT_REVIEW_QUICKREF.md](./API_AI_AGENT_REVIEW_QUICKREF.md)** - Tham khảo nhanh các API endpoints

### Changelog
- **[CHANGELOG_AI_AGENT_HANDLERS.md](./CHANGELOG_AI_AGENT_HANDLERS.md)** - Lịch sử thay đổi và cập nhật của các handlers

## 🚀 Quick Start

### Sử dụng AI Agent Review Mode
1. Kích hoạt chế độ review trong cấu hình
2. Gọi API endpoint `/api/ai-agent-review`
3. Nhận và xử lý kết quả review

### Example API Call
```javascript
const response = await fetch('/api/ai-agent-review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Your query here",
    mode: "review"
  })
});
```

## 📖 Đọc thêm

- [API Documentation](../API/)
- [Troubleshooting](../troubleshooting/)
- [Architecture](../architecture/)

[← Quay lại Docs chính](../README.md)




