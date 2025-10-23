# 📡 API Documentation

Tài liệu chi tiết về các API endpoints của Perplexica.

## 📑 Nội dung

### Core API
- **[SEARCH.md](./SEARCH.md)** ⭐ - API tìm kiếm chính, endpoints và usage
- **[README_API_DOCS.md](./README_API_DOCS.md)** - Tổng quan về API documentation

### API Changes
- **[CHANGE_API_RESPONSE_FORMAT.md](./CHANGE_API_RESPONSE_FORMAT.md)** - Thay đổi format response của API

### Related
- **[AI Agent API](../ai-agent/)** - API cho AI Agent review mode

## 🚀 Quick Start

### Base URL
```
Development: http://localhost:3000/api
Production: https://perplexica.trangvang.ai/api
```

### Authentication
Currently, most endpoints don't require authentication. Future versions may add API key authentication.

## 📚 Main Endpoints

### Search API

#### POST /api/search
Thực hiện tìm kiếm với AI-powered search.

**Request:**
```json
{
  "query": "What is quantum computing?",
  "focusMode": "webSearch",
  "optimizationMode": "balanced"
}
```

**Response:**
```json
{
  "type": "response",
  "data": "Quantum computing is...",
  "sources": [
    {
      "title": "Quantum Computing Explained",
      "url": "https://example.com/quantum",
      "snippet": "..."
    }
  ]
}
```

Chi tiết xem [SEARCH.md](./SEARCH.md)

### Config API

#### GET /api/config
Lấy cấu hình hiện tại của application.

**Response:**
```json
{
  "chatModelProviders": [
    {
      "name": "openai",
      "models": ["gpt-4", "gpt-3.5-turbo"]
    }
  ],
  "embeddingModelProviders": [
    {
      "name": "openai",
      "models": ["text-embedding-ada-002"]
    }
  ]
}
```

#### GET /api/models
Lấy danh sách các models khả dụng.

**Response:**
```json
{
  "chatModelProviders": {
    "openai": ["gpt-4", "gpt-3.5-turbo"],
    "gemini": ["gemini-pro", "gemini-pro-vision"]
  },
  "embeddingModelProviders": {
    "openai": ["text-embedding-ada-002"]
  }
}
```

### Chat API

#### GET /api/chats
Lấy danh sách chat histories.

**Query Parameters:**
- `limit` (optional): Số lượng chats (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "chats": [
    {
      "id": "chat-id",
      "title": "Chat about quantum computing",
      "createdAt": "2024-01-01T00:00:00Z",
      "messages": []
    }
  ],
  "total": 100
}
```

#### GET /api/chats/:id
Lấy chi tiết một chat.

#### DELETE /api/chats/:id
Xóa một chat.

### Suggestions API

#### POST /api/suggestions
Generate suggestions cho câu hỏi tiếp theo.

**Request:**
```json
{
  "chatHistory": [
    {
      "role": "user",
      "content": "What is AI?"
    },
    {
      "role": "assistant",
      "content": "AI is..."
    }
  ]
}
```

**Response:**
```json
{
  "suggestions": [
    "How does machine learning work?",
    "What are neural networks?",
    "Applications of AI in healthcare"
  ]
}
```

## 🔄 Response Formats

### Standard Response
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Streaming Response
Một số endpoints support streaming:
```
data: {"type": "sources", "data": [...]}

data: {"type": "message", "data": "Response chunk..."}

data: {"type": "end"}
```

## 📊 Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request thành công |
| 201 | Created | Resource được tạo |
| 400 | Bad Request | Request không hợp lệ |
| 401 | Unauthorized | Chưa authenticate |
| 403 | Forbidden | Không có quyền |
| 404 | Not Found | Resource không tồn tại |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Lỗi server |
| 503 | Service Unavailable | Service không khả dụng |

## 🔧 Request Headers

### Required Headers
```
Content-Type: application/json
```

### Optional Headers
```
X-API-Key: your-api-key (if auth enabled)
User-Agent: Your-App/1.0
```

## 📈 Rate Limiting

Hiện tại chưa có rate limiting strict. Recommend:
- Development: 100 requests/minute
- Production: 1000 requests/minute

## 🧪 Testing API

### Using cURL
```bash
# Search API
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is AI?", "focusMode": "webSearch"}'

# Config API
curl http://localhost:3000/api/config

# Models API
curl http://localhost:3000/api/models
```

### Using JavaScript
```javascript
// Search
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is AI?',
    focusMode: 'webSearch'
  })
});

const data = await response.json();
```

### Using Python
```python
import requests

# Search
response = requests.post(
    'http://localhost:3000/api/search',
    json={
        'query': 'What is AI?',
        'focusMode': 'webSearch'
    }
)

data = response.json()
```

## 📖 Detailed Documentation

- **[SEARCH.md](./SEARCH.md)** - Chi tiết về Search API
- **[README_API_DOCS.md](./README_API_DOCS.md)** - API documentation overview
- **[CHANGE_API_RESPONSE_FORMAT.md](./CHANGE_API_RESPONSE_FORMAT.md)** - Response format changes

## 🔗 Related Documentation

- [AI Agent API](../ai-agent/) - API cho AI Agent features
- [Troubleshooting](../troubleshooting/) - Xử lý lỗi API
- [Architecture](../architecture/) - Hiểu về system design

## 💡 Best Practices

### Error Handling
```javascript
try {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'test' })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
} catch (error) {
  console.error('API call failed:', error);
}
```

### Retry Logic
```javascript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### Timeout Handling
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch('/api/search', {
    method: 'POST',
    signal: controller.signal,
    body: JSON.stringify({ query: 'test' })
  });
} finally {
  clearTimeout(timeoutId);
}
```

## 🔐 Security

### Input Validation
- Validate tất cả input trước khi gửi
- Sanitize user input
- Escape special characters

### HTTPS
- Always use HTTPS trong production
- Validate SSL certificates

### API Keys (Future)
- Store API keys securely
- Never commit keys to git
- Rotate keys regularly

[← Quay lại Docs chính](../README.md)




