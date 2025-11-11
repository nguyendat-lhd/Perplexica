# Perplexica API Documentation

Tài liệu API của Perplexica - AI-powered search engine.

## Tài liệu có sẵn

- **[Hướng dẫn Sử dụng API (Tiếng Việt)](./API_GUIDE_VI.md)** - Hướng dẫn đầy đủ về tất cả các API endpoints
- **[Search API Documentation (English)](./SEARCH.md)** - Tài liệu chi tiết về Search API

## Tổng quan

Perplexica cung cấp một bộ API đầy đủ để tích hợp AI-powered search vào ứng dụng của bạn:

### Core APIs

- **Search API** (`/api/search`) - Tìm kiếm với AI, hỗ trợ streaming
- **Chat API** (`/api/chat`) - Chat với lưu trữ lịch sử và file đính kèm
- **Models API** (`/api/models`) - Lấy danh sách models có sẵn
- **Config API** (`/api/config`) - Quản lý cấu hình hệ thống

### Content APIs

- **Images API** (`/api/images`) - Tìm kiếm hình ảnh
- **Videos API** (`/api/videos`) - Tìm kiếm video
- **Discover API** (`/api/discover`) - Lấy tin tức theo chủ đề

### Utility APIs

- **Chats API** (`/api/chats`) - Quản lý chats
- **Uploads API** (`/api/uploads`) - Upload và xử lý files
- **Suggestions API** (`/api/suggestions`) - Tạo gợi ý câu hỏi
- **Weather API** (`/api/weather`) - Lấy thông tin thời tiết

## Quick Start

### Base URL

```
http://localhost:3000/api
```

### Example: Tìm kiếm đơn giản

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Perplexica?",
    "focusMode": "webSearch"
  }'
```

### Example: Lấy danh sách models

```bash
curl http://localhost:3000/api/models
```

## Focus Modes

Perplexica hỗ trợ các chế độ tìm kiếm sau:

- `webSearch` - Tìm kiếm web thông thường
- `academicSearch` - Tìm kiếm học thuật
- `writingAssistant` - Trợ lý viết
- `wolframAlphaSearch` - Tìm kiếm với Wolfram Alpha
- `youtubeSearch` - Tìm kiếm YouTube
- `redditSearch` - Tìm kiếm Reddit

## Models

### Chat Model Providers

- OpenAI
- Anthropic (Claude)
- Groq
- Gemini
- DeepSeek
- Ollama
- LM Studio
- Lemonade
- Custom OpenAI-compatible servers

### Embedding Model Providers

- OpenAI
- Hugging Face Transformers
- Ollama
- Gemini
- AI/ML API
- LM Studio
- Lemonade

## Xem thêm

- [Hướng dẫn Setup Docker](../installation/DOCKER_SETUP_VI.md)
- [Architecture Documentation](../architecture/README.md)


