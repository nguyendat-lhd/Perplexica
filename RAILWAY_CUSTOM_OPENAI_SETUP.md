# Cấu hình Custom OpenAI trên Railway

## Tổng quan

Perplexica hỗ trợ Custom OpenAI-compatible servers (như Llama.cpp server, vLLM, OpenRouter, etc.). Có 2 cách để cấu hình trên Railway:

1. **Qua Settings UI** (Khuyến nghị - Dễ nhất)
2. **Qua config.toml file** (Cho production hoặc automation)

## Cách 1: Cấu hình qua Settings UI (Khuyến nghị)

### Bước 1: Deploy và truy cập Web App

1. Deploy Perplexica lên Railway (đã hoàn thành)
2. Truy cập web app: `https://your-app.up.railway.app`
3. Đăng nhập hoặc tạo tài khoản

### Bước 2: Vào Settings

1. Click vào **Settings** (biểu tượng bánh răng) ở sidebar
2. Scroll xuống phần **Chat Model Provider**

### Bước 3: Chọn Custom OpenAI

1. Trong **Chat Model Provider**, chọn **"Custom OpenAI"**
2. Điền các thông tin sau:

   - **Custom OpenAI Model Name**: 
     - Tên model bạn muốn sử dụng
     - Ví dụ: `gpt-4`, `llama-3-70b`, `deepseek-r1`, etc.
     - Nếu dùng OpenRouter: `openrouter/anthropic/claude-3.5-sonnet`
   
   - **Custom OpenAI API Key**: 
     - API key của bạn (nếu có)
     - Nếu không có, có thể để bất kỳ giá trị nào (không được để trống)
     - Ví dụ: `sk-...` hoặc `not-needed`
   
   - **Custom OpenAI Base URL**: 
     - URL của Custom OpenAI server
     - Ví dụ: `https://api.openrouter.ai/api/v1`
     - Hoặc: `http://custom-openai-service.railway.internal:8000` (nếu deploy trên Railway)
     - Hoặc: `https://your-custom-openai-server.com/v1`

3. Click **Save** cho từng field

### Bước 4: Kiểm tra

1. Quay lại chat interface
2. Chọn **Custom OpenAI** làm Chat Model Provider
3. Thử chat một message để kiểm tra kết nối

## Cách 2: Cấu hình qua config.toml file

### Bước 1: Tạo config.toml

1. Copy từ `sample.config.toml`:
   ```bash
   cp sample.config.toml config.toml
   ```

2. Chỉnh sửa phần `[MODELS.CUSTOM_OPENAI]`:
   ```toml
   [MODELS.CUSTOM_OPENAI]
   API_URL = "https://api.openrouter.ai/api/v1"
   API_KEY = "sk-or-v1-..."
   MODEL_NAME = "openrouter/anthropic/claude-3.5-sonnet"
   ```

### Bước 2: Commit và Push

```bash
git add config.toml
git commit -m "Add Custom OpenAI config"
git push
```

### Bước 3: Railway sẽ tự động redeploy

Railway sẽ detect thay đổi và redeploy. File `config.toml` sẽ được đọc tự động.

## Ví dụ cấu hình cho các dịch vụ phổ biến

### OpenRouter

```toml
[MODELS.CUSTOM_OPENAI]
API_URL = "https://api.openrouter.ai/api/v1"
API_KEY = "sk-or-v1-your-key-here"
MODEL_NAME = "openrouter/anthropic/claude-3.5-sonnet"
```

Hoặc qua Settings UI:
- **Base URL**: `https://api.openrouter.ai/api/v1`
- **API Key**: `sk-or-v1-your-key-here`
- **Model Name**: `openrouter/anthropic/claude-3.5-sonnet`

### Custom OpenAI Server trên Railway

Nếu bạn deploy Custom OpenAI server trên Railway:

```toml
[MODELS.CUSTOM_OPENAI]
API_URL = "http://custom-openai-service.railway.internal:8000"
API_KEY = "not-needed"
MODEL_NAME = "your-model-name"
```

Hoặc qua Settings UI:
- **Base URL**: `http://custom-openai-service.railway.internal:8000`
- **API Key**: `not-needed` (hoặc bất kỳ giá trị nào)
- **Model Name**: `your-model-name`

### Local OpenAI-compatible Server (Llama.cpp, vLLM, etc.)

Nếu chạy local và muốn kết nối từ Railway:

```toml
[MODELS.CUSTOM_OPENAI]
API_URL = "https://your-public-domain.com/v1"
API_KEY = "not-needed"
MODEL_NAME = "llama-3-70b"
```

**Lưu ý**: Railway không thể kết nối trực tiếp với `localhost` hoặc `host.docker.internal`. Bạn cần:
- Expose server ra public domain (với ngrok, Cloudflare Tunnel, etc.)
- Hoặc deploy Custom OpenAI server lên Railway

### Together AI

```toml
[MODELS.CUSTOM_OPENAI]
API_URL = "https://api.together.xyz/v1"
API_KEY = "your-together-api-key"
MODEL_NAME = "meta-llama/Llama-3-70b-chat-hf"
```

### Groq (nếu muốn dùng qua Custom OpenAI)

```toml
[MODELS.CUSTOM_OPENAI]
API_URL = "https://api.groq.com/openai/v1"
API_KEY = "your-groq-api-key"
MODEL_NAME = "llama-3-70b-8192"
```

## Troubleshooting

### Lỗi: Cannot connect to Custom OpenAI

**Nguyên nhân**: 
- URL sai
- Server không accessible từ Railway
- API key sai

**Giải pháp**:
1. Kiểm tra URL có đúng không
2. Test URL từ browser hoặc curl:
   ```bash
   curl https://api.openrouter.ai/api/v1/models \
     -H "Authorization: Bearer your-api-key"
   ```
3. Đảm bảo server accessible từ internet (nếu không phải Railway internal)

### Lỗi: Model not found

**Nguyên nhân**: 
- Model name sai
- Model không có sẵn trên server

**Giải pháp**:
1. Kiểm tra model name có đúng không
2. List models từ server:
   ```bash
   curl https://api.openrouter.ai/api/v1/models \
     -H "Authorization: Bearer your-api-key"
   ```
3. Sử dụng model name chính xác từ list

### Lỗi: Authentication failed

**Nguyên nhân**: 
- API key sai hoặc không hợp lệ

**Giải pháp**:
1. Kiểm tra API key có đúng không
2. Đảm bảo API key có quyền truy cập model
3. Nếu không cần API key, đặt giá trị bất kỳ (không để trống)

## Lưu ý quan trọng

1. ✅ **API Key**: Một số server không yêu cầu API key, nhưng field không được để trống. Có thể dùng `not-needed` hoặc `dummy-key`

2. ✅ **Model Name**: Phải khớp chính xác với model name trên server. Kiểm tra qua API `/models` endpoint

3. ✅ **Base URL**: 
   - Phải là base URL, không bao gồm `/chat/completions` hoặc `/v1/chat/completions`
   - Ví dụ đúng: `https://api.openrouter.ai/api/v1`
   - Ví dụ sai: `https://api.openrouter.ai/api/v1/chat/completions`

4. ✅ **Railway Internal**: Nếu Custom OpenAI server cũng trên Railway, dùng internal URL (`*.railway.internal`) để tối ưu

5. ✅ **Settings UI vs config.toml**: 
   - Settings UI sẽ ghi vào `config.toml` tự động
   - Nếu dùng cả 2, Settings UI sẽ override `config.toml`

## Kiểm tra nhanh

Sau khi cấu hình:

1. Vào Settings → Kiểm tra Custom OpenAI config đã được lưu
2. Chọn Custom OpenAI làm Chat Model Provider
3. Thử chat một message
4. Nếu thành công, bạn sẽ thấy response từ Custom OpenAI server

## Ví dụ hoàn chỉnh

### Setup OpenRouter trên Railway:

1. **Lấy API key từ OpenRouter**: https://openrouter.ai/keys
2. **Vào Settings** trong Perplexica web app
3. **Chọn Custom OpenAI** làm Chat Model Provider
4. **Điền**:
   - Base URL: `https://api.openrouter.ai/api/v1`
   - API Key: `sk-or-v1-your-key`
   - Model Name: `openrouter/anthropic/claude-3.5-sonnet`
5. **Save** và test

