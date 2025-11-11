# Hướng dẫn Setup Perplexica Local bằng Docker

Hướng dẫn chi tiết để cài đặt và chạy Perplexica trên máy local của bạn sử dụng Docker.

## Yêu cầu hệ thống

- Docker và Docker Compose đã được cài đặt và đang chạy
- Git đã được cài đặt
- Ít nhất 2GB RAM trống
- Kết nối internet để tải images và dependencies

## Các bước cài đặt

### Bước 1: Clone repository

```bash
git clone https://github.com/ItzCrazyKns/Perplexica.git
cd Perplexica
```

### Bước 2: Tạo file cấu hình

Sao chép file mẫu cấu hình và đổi tên:

```bash
cp sample.config.toml config.toml
```

### Bước 3: Cấu hình API Keys (Tùy chọn)

Mở file `config.toml` và điền các API keys mà bạn muốn sử dụng. Bạn chỉ cần điền các phần mà bạn muốn sử dụng:

#### Các tùy chọn Model:

1. **OpenAI** (Nếu muốn dùng GPT models):
   ```toml
   [MODELS.OPENAI]
   API_KEY = "sk-your-openai-api-key"
   ```

2. **Groq** (Nếu muốn dùng Groq models):
   ```toml
   [MODELS.GROQ]
   API_KEY = "your-groq-api-key"
   ```

3. **Anthropic** (Nếu muốn dùng Claude models):
   ```toml
   [MODELS.ANTHROPIC]
   API_KEY = "your-anthropic-api-key"
   ```

4. **Gemini** (Nếu muốn dùng Google models):
   ```toml
   [MODELS.GEMINI]
   API_KEY = "your-gemini-api-key"
   ```

5. **DeepSeek** (Nếu muốn dùng DeepSeek models):
   ```toml
   [MODELS.DEEPSEEK]
   API_KEY = "your-deepseek-api-key"
   ```

6. **Ollama** (Nếu muốn dùng Ollama local models):
   ```toml
   [MODELS.OLLAMA]
   API_URL = "http://host.docker.internal:11434"
   ```
   **Lưu ý**: 
   - Đảm bảo Ollama đang chạy trên máy của bạn
   - Port mặc định là 11434, nếu bạn dùng port khác thì thay đổi số port
   - Trên Linux, có thể cần dùng IP của host thay vì `host.docker.internal`

7. **Custom OpenAI-compatible Server** (Nếu có server OpenAI-compatible local):
   ```toml
   [MODELS.CUSTOM_OPENAI]
   API_KEY = "any-value-if-no-key-required"
   API_URL = "http://host.docker.internal:PORT_NUMBER"
   MODEL_NAME = "your-model-name"
   ```
   **Lưu ý**: Server phải chạy trên `0.0.0.0`, không phải `127.0.0.1`

8. **LM Studio** (Nếu muốn dùng LM Studio):
   ```toml
   [MODELS.LM_STUDIO]
   API_URL = "http://host.docker.internal:1234"
   ```

9. **Lemonade** (Nếu muốn dùng Lemonade):
   ```toml
   [MODELS.LEMONADE]
   API_URL = "http://host.docker.internal:8000"
   API_KEY = ""  # Optional
   ```

10. **AI/ML API** (Nếu muốn dùng AI/ML API):
    ```toml
    [MODELS.AIMLAPI]
    API_KEY = "your-aimlapi-key"
    ```

**Quan trọng**: Bạn không cần điền tất cả các API keys. Chỉ điền những gì bạn muốn sử dụng. Bạn có thể thay đổi các cấu hình này sau khi khởi động Perplexica từ Settings dialog.

### Bước 4: Khởi động với Docker Compose

Đảm bảo bạn đang ở thư mục chứa file `docker-compose.yaml`, sau đó chạy:

```bash
docker compose up -d
```

Lệnh này sẽ:
- Tải image SearxNG (metasearch engine)
- Build image Perplexica từ Dockerfile
- Khởi động cả hai containers và kết nối chúng với nhau

### Bước 5: Chờ đợi setup hoàn tất

Quá trình build có thể mất vài phút lần đầu tiên vì cần:
- Tải dependencies
- Build Next.js application
- Chạy database migrations

Bạn có thể theo dõi logs bằng:

```bash
docker compose logs -f
```

### Bước 6: Truy cập Perplexica

Sau khi setup hoàn tất, mở trình duyệt và truy cập:

```
http://localhost:3000
```

### Bước 7: Cấu hình Embedding Model (Trong Settings UI)

**Lưu ý**: Embedding models không được cấu hình trong file `config.toml` mà được chọn trong Settings UI sau khi ứng dụng đã chạy.

1. Sau khi truy cập http://localhost:3000, click vào biểu tượng **Settings** (⚙️) ở góc trên bên phải
2. Tìm phần **"Embedding Model Provider"**
3. Chọn provider bạn muốn sử dụng:
   - **Hugging Face** (Transformers) - Không cần API key, chạy local
     - Các model có sẵn: BGE Small, GTE Small, **Bert Multilingual**
   - **OpenAI** - Cần API key
   - **Ollama** - Cần Ollama đang chạy
   - **Gemini** - Cần API key
   - **AI/ML API** - Cần API key
   - **LM Studio** - Cần LM Studio đang chạy
   - **Lemonade** - Cần Lemonade đang chạy

4. Chọn model cụ thể từ dropdown **"Embedding Model"**
5. Click **Save** để lưu cấu hình

**Ví dụ**: Để sử dụng "Bert Multilingual" như trong hình ảnh:
- Chọn **"Hugging Face"** làm Embedding Model Provider
- Chọn **"Bert Multilingual"** làm Embedding Model

## Kiểm tra trạng thái containers

Để kiểm tra các containers đang chạy:

```bash
docker compose ps
```

Để xem logs của một service cụ thể:

```bash
# Xem logs của app
docker compose logs app

# Xem logs của searxng
docker compose logs searxng

# Xem logs real-time
docker compose logs -f app
```

## Dừng và khởi động lại

### Dừng containers:

```bash
docker compose stop
```

### Khởi động lại containers:

```bash
docker compose start
```

### Dừng và xóa containers (giữ data):

```bash
docker compose down
```

### Dừng và xóa tất cả bao gồm volumes (mất data):

```bash
docker compose down -v
```

## Cấu trúc Docker

### Services:

1. **searxng**: 
   - Image: `docker.io/searxng/searxng:latest`
   - Port: `4000:8080` (truy cập tại http://localhost:4000)
   - Volume: `./searxng` chứa cấu hình SearxNG

2. **app**:
   - Image: Build từ `app.dockerfile`
   - Port: `3000:3000` (truy cập tại http://localhost:3000)
   - Volumes:
     - `backend-dbstore`: Lưu trữ database
     - `uploads`: Lưu trữ files upload
     - `./config.toml`: File cấu hình

### Networks:

- `perplexica-network`: Network riêng để các containers giao tiếp với nhau

## Troubleshooting

### Lỗi kết nối Ollama

Nếu gặp lỗi kết nối Ollama:

1. **Kiểm tra Ollama đang chạy**: Đảm bảo Ollama đang chạy trên máy của bạn
2. **Kiểm tra API URL trong config.toml**:
   - Windows/Mac: `http://host.docker.internal:11434`
   - Linux: `http://<private_ip_of_host>:11434`
3. **Linux - Expose Ollama ra network**:
   - Chỉnh sửa `/etc/systemd/system/ollama.service`
   - Thêm: `Environment="OLLAMA_HOST=0.0.0.0:11434"`
   - Chạy: `systemctl daemon-reload && systemctl restart ollama`
   - Đảm bảo firewall không chặn port 11434

### Lỗi kết nối Lemonade

Nếu gặp lỗi kết nối Lemonade:

1. **Kiểm tra Lemonade đang chạy**: Đảm bảo Lemonade server đang chạy
2. **Kiểm tra API URL**: Tương tự như Ollama
3. **Đảm bảo Lemonade chạy trên 0.0.0.0**, không phải 127.0.0.1
4. **Kiểm tra firewall** không chặn port 8000

### Lỗi kết nối Custom OpenAI Server

Nếu dùng custom OpenAI-compatible server:

1. **Đảm bảo server chạy trên `0.0.0.0`**, không phải `127.0.0.1`
2. **Kiểm tra MODEL_NAME** đúng với model đã load
3. **Kiểm tra API_KEY**: Nếu không cần key, điền bất kỳ giá trị nào (không để trống)

### Container không khởi động

1. **Kiểm tra logs**:
   ```bash
   docker compose logs app
   ```

2. **Kiểm tra port đã được sử dụng**:
   ```bash
   # Kiểm tra port 3000
   lsof -i :3000
   
   # Kiểm tra port 4000
   lsof -i :4000
   ```

3. **Rebuild containers**:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

### Database migration errors

Nếu gặp lỗi migration:

1. **Kiểm tra logs**:
   ```bash
   docker compose logs app | grep -i migrate
   ```

2. **Xóa volume và rebuild** (sẽ mất data):
   ```bash
   docker compose down -v
   docker compose up -d
   ```

## Cập nhật Perplexica

Để cập nhật lên phiên bản mới nhất:

```bash
# Pull code mới nhất
git pull

# Rebuild và restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Backup và Restore

### Backup data:

```bash
# Backup database volume
docker run --rm -v perplexica_backend-dbstore:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /data .

# Backup uploads
docker run --rm -v perplexica_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

### Restore data:

```bash
# Restore database
docker run --rm -v perplexica_backend-dbstore:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /data

# Restore uploads
docker run --rm -v perplexica_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Sử dụng Perplexica như một Search Engine

Để thêm Perplexica vào trình duyệt như một search engine:

1. Mở Settings của trình duyệt
2. Tìm phần "Search Engines" hoặc "Search"
3. Thêm search engine mới với URL:
   ```
   http://localhost:3000/?q=%s
   ```
4. Đặt tên: "Perplexica"
5. Keyword: "pp" (hoặc tùy chọn)

Bây giờ bạn có thể gõ `pp <query>` trong address bar để tìm kiếm!

## Tài liệu tham khảo

- [README chính](../README.md)
- [API Documentation](../API/SEARCH.md)
- [Architecture Documentation](../architecture/README.md)
- [Updating Guide](UPDATING.md)

## Hỗ trợ

Nếu gặp vấn đề:
- Tạo issue trên GitHub
- Tham gia Discord: https://discord.gg/26aArMy8tT

