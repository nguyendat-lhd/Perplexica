# Hướng dẫn Sử dụng Perplexica API

Tài liệu này mô tả chi tiết tất cả các API endpoints có sẵn trong Perplexica và cách sử dụng chúng.

## Base URL

Tất cả các API endpoints đều có base URL:
```
http://localhost:3000/api
```

**Lưu ý**: Thay `3000` bằng port khác nếu bạn đã thay đổi port mặc định.

---

## 1. Search API

### Endpoint: `POST /api/search`

API tìm kiếm chính của Perplexica, cho phép thực hiện các loại tìm kiếm khác nhau với AI.

#### Request Body

```json
{
  "chatModel": {
    "provider": "openai",
    "name": "gpt-4o-mini",
    "customOpenAIKey": "optional-key",
    "customOpenAIBaseURL": "optional-url"
  },
  "embeddingModel": {
    "provider": "openai",
    "name": "text-embedding-3-large"
  },
  "optimizationMode": "speed",
  "focusMode": "webSearch",
  "query": "What is Perplexica?",
  "history": [
    ["human", "Hi, how are you?"],
    ["assistant", "I am doing well, how can I help you today?"]
  ],
  "systemInstructions": "Focus on providing technical details.",
  "stream": false
}
```

#### Parameters

- **`chatModel`** (object, optional): Model chat để sử dụng
  - `provider`: Provider của model (ví dụ: `openai`, `ollama`, `custom_openai`)
  - `name`: Tên model cụ thể
  - `customOpenAIKey`: API key cho custom OpenAI (nếu dùng custom_openai)
  - `customOpenAIBaseURL`: Base URL cho custom OpenAI (nếu dùng custom_openai)

- **`embeddingModel`** (object, optional): Model embedding để tìm kiếm tương tự
  - `provider`: Provider của embedding model
  - `name`: Tên embedding model cụ thể

- **`optimizationMode`** (string, optional): Chế độ tối ưu hóa
  - `speed`: Ưu tiên tốc độ
  - `balanced`: Cân bằng (mặc định)

- **`focusMode`** (string, required): Chế độ tìm kiếm
  - `webSearch`: Tìm kiếm web thông thường
  - `academicSearch`: Tìm kiếm học thuật
  - `writingAssistant`: Trợ lý viết
  - `wolframAlphaSearch`: Tìm kiếm với Wolfram Alpha
  - `youtubeSearch`: Tìm kiếm YouTube
  - `redditSearch`: Tìm kiếm Reddit

- **`query`** (string, required): Câu hỏi hoặc truy vấn tìm kiếm

- **`history`** (array, optional): Lịch sử cuộc trò chuyện
  - Mỗi phần tử là một tuple `[role, message]`
  - `role`: `"human"` hoặc `"assistant"`

- **`systemInstructions`** (string, optional): Hướng dẫn hệ thống tùy chỉnh

- **`stream`** (boolean, optional): Bật streaming response (mặc định: `false`)

#### Response (stream: false)

```json
{
  "message": "Perplexica is an innovative, open-source AI-powered search engine...",
  "sources": [
    {
      "pageContent": "Snippet of content...",
      "metadata": {
        "title": "Page Title",
        "url": "https://example.com"
      }
    }
  ]
}
```

#### Streaming Response (stream: true)

Khi `stream: true`, API trả về stream JSON objects, mỗi dòng là một JSON object:

```
{"type":"init","data":"Stream connected"}
{"type":"sources","data":[...]}
{"type":"response","data":"Perplexica is an "}
{"type":"response","data":"innovative..."}
{"type":"done"}
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "focusMode": "webSearch",
    "query": "What is Perplexica?",
    "stream": false
  }'
```

---

## 2. Chat API

### Endpoint: `POST /api/chat`

API chat với lưu trữ lịch sử và hỗ trợ file đính kèm.

#### Request Body

```json
{
  "message": {
    "messageId": "unique-message-id",
    "chatId": "unique-chat-id",
    "content": "Your message here"
  },
  "optimizationMode": "speed",
  "focusMode": "webSearch",
  "history": [
    ["human", "Previous message"],
    ["assistant", "Previous response"]
  ],
  "files": ["file-id-1", "file-id-2"],
  "chatModel": {
    "provider": "openai",
    "name": "gpt-4o-mini"
  },
  "embeddingModel": {
    "provider": "openai",
    "name": "text-embedding-3-large"
  },
  "systemInstructions": "Custom instructions"
}
```

#### Parameters

- **`message`** (object, required): Thông tin message
  - `messageId`: ID duy nhất của message
  - `chatId`: ID của chat (tạo mới nếu chưa có)
  - `content`: Nội dung message

- **`files`** (array, optional): Danh sách file IDs đã upload

- Các tham số khác tương tự như Search API

#### Response

Stream response với các event types:
- `message`: Chunk của response message
- `sources`: Danh sách sources
- `messageEnd`: Kết thúc message
- `error`: Lỗi nếu có

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "messageId": "msg-123",
      "chatId": "chat-456",
      "content": "Hello!"
    },
    "focusMode": "webSearch"
  }'
```

---

## 3. Chats API

### GET `/api/chats`

Lấy danh sách tất cả các chats.

#### Response

```json
{
  "chats": [
    {
      "id": "chat-id",
      "title": "Chat Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "focusMode": "webSearch",
      "files": []
    }
  ]
}
```

#### Example cURL

```bash
curl http://localhost:3000/api/chats
```

---

### GET `/api/chats/[id]`

Lấy thông tin chi tiết của một chat cụ thể.

#### Path Parameters

- **`id`**: ID của chat

#### Response

```json
{
  "chat": {
    "id": "chat-id",
    "title": "Chat Title",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "focusMode": "webSearch",
    "files": []
  },
  "messages": [
    {
      "id": 1,
      "messageId": "msg-id",
      "chatId": "chat-id",
      "role": "user",
      "content": "Message content",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Example cURL

```bash
curl http://localhost:3000/api/chats/chat-123
```

---

### DELETE `/api/chats/[id]`

Xóa một chat và tất cả messages của nó.

#### Path Parameters

- **`id`**: ID của chat cần xóa

#### Response

```json
{
  "message": "Chat deleted successfully"
}
```

#### Example cURL

```bash
curl -X DELETE http://localhost:3000/api/chats/chat-123
```

---

## 4. Config API

### GET `/api/config`

Lấy cấu hình hiện tại của hệ thống.

#### Response

```json
{
  "chatModelProviders": {
    "openai": [
      {
        "name": "gpt-4o-mini",
        "displayName": "GPT 4 omni mini"
      }
    ]
  },
  "embeddingModelProviders": {
    "openai": [
      {
        "name": "text-embedding-3-large",
        "displayName": "Text Embedding 3 Large"
      }
    ]
  },
  "openaiApiKey": "...",
  "ollamaApiUrl": "...",
  "customOpenaiApiUrl": "...",
  "customOpenaiApiKey": "...",
  "customOpenaiModelName": "..."
}
```

#### Example cURL

```bash
curl http://localhost:3000/api/config
```

---

### POST `/api/config`

Cập nhật cấu hình hệ thống.

#### Request Body

```json
{
  "openaiApiKey": "sk-...",
  "groqApiKey": "...",
  "anthropicApiKey": "...",
  "geminiApiKey": "...",
  "deepseekApiKey": "...",
  "aimlApiKey": "...",
  "ollamaApiUrl": "http://host.docker.internal:11434",
  "ollamaApiKey": "",
  "lmStudioApiUrl": "http://host.docker.internal:1234",
  "lemonadeApiUrl": "http://host.docker.internal:8000",
  "lemonadeApiKey": "",
  "customOpenaiApiUrl": "https://api.example.com",
  "customOpenaiApiKey": "key",
  "customOpenaiModelName": "model-name"
}
```

#### Response

```json
{
  "message": "Config updated"
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-..."
  }'
```

---

## 5. Models API

### GET `/api/models`

Lấy danh sách tất cả các models có sẵn (chat và embedding).

#### Response

```json
{
  "chatModelProviders": {
    "openai": {
      "gpt-4o-mini": {
        "displayName": "GPT 4 omni mini",
        "provider": "openai"
      }
    }
  },
  "embeddingModelProviders": {
    "openai": {
      "text-embedding-3-large": {
        "displayName": "Text Embedding 3 Large",
        "provider": "openai"
      }
    }
  }
}
```

#### Example cURL

```bash
curl http://localhost:3000/api/models
```

---

## 6. Images API

### POST `/api/images`

Tìm kiếm hình ảnh dựa trên query.

#### Request Body

```json
{
  "query": "cute cats",
  "chatHistory": [
    {
      "role": "user",
      "content": "Show me images"
    }
  ],
  "chatModel": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

#### Parameters

- **`query`** (string, required): Câu hỏi tìm kiếm hình ảnh
- **`chatHistory`** (array, optional): Lịch sử chat
- **`chatModel`** (object, optional): Model chat để sử dụng

#### Response

```json
{
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "title": "Image Title",
      "thumbnail": "https://example.com/thumb.jpg"
    }
  ]
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/images \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cute cats"
  }'
```

---

## 7. Videos API

### POST `/api/videos`

Tìm kiếm video dựa trên query.

#### Request Body

```json
{
  "query": "how to cook pasta",
  "chatHistory": [],
  "chatModel": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

#### Parameters

Tương tự như Images API.

#### Response

```json
{
  "videos": [
    {
      "url": "https://youtube.com/watch?v=...",
      "title": "Video Title",
      "thumbnail": "https://example.com/thumb.jpg",
      "duration": "10:30"
    }
  ]
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how to cook pasta"
  }'
```

---

## 8. Discover API

### GET `/api/discover`

Lấy tin tức và bài viết theo chủ đề.

#### Query Parameters

- **`mode`** (string, optional): Chế độ
  - `normal`: Lấy nhiều bài viết (mặc định)
  - `preview`: Lấy một bài viết ngẫu nhiên

- **`topic`** (string, optional): Chủ đề
  - `tech`: Công nghệ (mặc định)
  - `finance`: Tài chính
  - `art`: Nghệ thuật
  - `sports`: Thể thao
  - `entertainment`: Giải trí

#### Response

```json
{
  "blogs": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "content": "Article content snippet...",
      "engines": ["bing"]
    }
  ]
}
```

#### Example cURL

```bash
# Lấy tin tức công nghệ
curl "http://localhost:3000/api/discover?topic=tech&mode=normal"

# Lấy một bài viết ngẫu nhiên về tài chính
curl "http://localhost:3000/api/discover?topic=finance&mode=preview"
```

---

## 9. Suggestions API

### POST `/api/suggestions`

Tạo các gợi ý câu hỏi tiếp theo dựa trên lịch sử chat.

#### Request Body

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
  ],
  "chatModel": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

#### Parameters

- **`chatHistory`** (array, required): Lịch sử chat
- **`chatModel`** (object, optional): Model chat để sử dụng

#### Response

```json
{
  "suggestions": [
    "How does machine learning work?",
    "What are the applications of AI?",
    "Can you explain neural networks?"
  ]
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "chatHistory": [
      {"role": "user", "content": "What is AI?"}
    ]
  }'
```

---

## 10. Uploads API

### POST `/api/uploads`

Upload và xử lý files (PDF, DOCX, TXT) để sử dụng trong chat.

#### Request Body (FormData)

- **`files`** (File[], required): Danh sách files cần upload
- **`embedding_model`** (string, required): Tên embedding model
- **`embedding_model_provider`** (string, required): Provider của embedding model

#### Supported File Types

- PDF (`.pdf`)
- Word Document (`.docx`)
- Text File (`.txt`)

#### Response

```json
{
  "files": [
    {
      "fileName": "document.pdf",
      "fileExtension": "pdf",
      "fileId": "unique-file-id"
    }
  ]
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/uploads \
  -F "files=@document.pdf" \
  -F "embedding_model=text-embedding-3-large" \
  -F "embedding_model_provider=openai"
```

#### Example JavaScript (FormData)

```javascript
const formData = new FormData();
formData.append('files', fileInput.files[0]);
formData.append('embedding_model', 'text-embedding-3-large');
formData.append('embedding_model_provider', 'openai');

fetch('http://localhost:3000/api/uploads', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 11. Weather API

### POST `/api/weather`

Lấy thông tin thời tiết dựa trên tọa độ địa lý.

#### Request Body

```json
{
  "lat": 10.762622,
  "lng": 106.660172,
  "measureUnit": "Metric"
}
```

#### Parameters

- **`lat`** (number, required): Vĩ độ (latitude)
- **`lng`** (number, required): Kinh độ (longitude)
- **`measureUnit`** (string, optional): Đơn vị đo
  - `Metric`: Độ C, m/s (mặc định)
  - `Imperial`: Độ F, mph

#### Response

```json
{
  "temperature": 28,
  "condition": "Clear",
  "humidity": 65,
  "windSpeed": 5.2,
  "icon": "clear-day",
  "temperatureUnit": "C",
  "windSpeedUnit": "m/s"
}
```

#### Weather Conditions

- `Clear`: Trời quang
- `Mainly Clear`: Chủ yếu quang
- `Partly Cloudy`: Ít mây
- `Cloudy`: Nhiều mây
- `Fog`: Sương mù
- `Light Drizzle`: Mưa phùn nhẹ
- `Moderate Drizzle`: Mưa phùn vừa
- `Dense Drizzle`: Mưa phùn dày đặc
- `Light Freezing Drizzle`: Mưa đá nhẹ
- `Dense Freezing Drizzle`: Mưa đá dày đặc
- `Slight Rain`: Mưa nhẹ
- `Moderate Rain`: Mưa vừa
- `Heavy Rain`: Mưa to
- `Slight Snow Fall`: Tuyết nhẹ
- `Moderate Snow Fall`: Tuyết vừa
- `Heavy Snow Fall`: Tuyết nhiều
- `Thunderstorm`: Dông
- `Thunderstorm with Slight Hail`: Dông có mưa đá nhẹ
- `Thunderstorm with Heavy Hail`: Dông có mưa đá nặng

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 10.762622,
    "lng": 106.660172,
    "measureUnit": "Metric"
  }'
```

---

## Error Handling

Tất cả các API endpoints trả về các mã lỗi HTTP chuẩn:

- **400 Bad Request**: Request không hợp lệ hoặc thiếu tham số bắt buộc
- **404 Not Found**: Resource không tồn tại
- **500 Internal Server Error**: Lỗi server nội bộ

### Error Response Format

```json
{
  "message": "Error description",
  "error": "Additional error details (optional)"
}
```

---

## Authentication

Hiện tại, các API endpoints không yêu cầu authentication. Tuy nhiên, bạn nên:

1. Chạy Perplexica trên mạng nội bộ hoặc đằng sau reverse proxy với authentication
2. Không expose các API endpoints ra internet công cộng nếu không có bảo vệ

---

## Rate Limiting

Hiện tại không có rate limiting được implement. Nếu bạn cần, có thể thêm middleware rate limiting ở phía server.

---

## Examples

### Tìm kiếm với Streaming

```javascript
const response = await fetch('http://localhost:3000/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'What is Perplexica?',
    focusMode: 'webSearch',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.trim()) {
      const data = JSON.parse(line);
      console.log(data);
    }
  }
}
```

### Chat với File Upload

```javascript
// 1. Upload file
const formData = new FormData();
formData.append('files', file);
formData.append('embedding_model', 'text-embedding-3-large');
formData.append('embedding_model_provider', 'openai');

const uploadRes = await fetch('http://localhost:3000/api/uploads', {
  method: 'POST',
  body: formData
});

const { files } = await uploadRes.json();
const fileId = files[0].fileId;

// 2. Chat với file
const chatRes = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: {
      messageId: 'msg-123',
      chatId: 'chat-456',
      content: 'Summarize this document'
    },
    focusMode: 'webSearch',
    files: [fileId]
  })
});
```

---

## Tài liệu Tham khảo

- [Search API Documentation (English)](./docs/API/SEARCH.md)
- [Architecture Documentation](./docs/architecture/README.md)


