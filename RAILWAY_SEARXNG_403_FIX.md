# Fix Lỗi 403 Forbidden từ SearXNG trên Railway

## Vấn đề

Khi deploy trên Railway, bạn gặp lỗi:
```
SearXNG returned 403 Forbidden. URL: http://searxng.railway.internal:8080/search?format=json&q=...
Error: SearXNG rejected the request (403 Forbidden)
```

## Nguyên nhân

Lỗi 403 từ SearXNG thường do:
1. **Bot Detection**: SearXNG đang chặn requests không có headers hợp lệ
2. **Rate Limiting**: SearXNG rate limiting quá nghiêm ngặt
3. **Cấu hình SearXNG**: Bot detection được bật và chặn internal requests

## Giải pháp

### Bước 1: Cấu hình SearXNG trên Railway

Khi deploy SearXNG service trên Railway, bạn cần thêm **Environment Variables**:

1. **Vào Railway Dashboard** → SearXNG Service → Settings → Variables

2. **Thêm các Environment Variables sau**:

```bash
# Disable bot detection
SEARXNG_BOT_DETECTION=false

# Hoặc nếu không có option này, thử:
SEARXNG_SETTINGS_PATH=/etc/searxng
```

### Bước 2: Cập nhật SearXNG Settings

Nếu bạn đang mount volume cho SearXNG config, cập nhật `searxng/settings.yml`:

```yaml
use_default_settings: true

general:
  instance_name: 'searxng'

search:
  autocomplete: 'google'
  formats:
    - html
    - json

server:
  secret_key: 'a2fb23f1b02e6ee83875b09826990de0f6bd908b6638e8c10277d415f6ab852b'
  bind_address: '0.0.0.0'
  port: 8080
```

**Lưu ý**: SearXNG không có option `bot_detection.enabled` trong settings.yml. Bot detection được control qua `limiter.toml`.

### Bước 3: Cấu hình Limiter

Cập nhật `searxng/limiter.toml`:

```toml
[botdetection.ip_limit]
# Activate link_token method
link_token = true
# Disable strict limit
strict_limit = false
# Increase rate limit (requests per minute)
ip_limit = 1000
```

### Bước 4: Sử dụng Public URL (Workaround)

Nếu vẫn gặp 403 với internal URL, có thể thử dùng public URL:

1. **Lấy Public URL của SearXNG**:
   - Railway Dashboard → SearXNG Service → Settings → Networking
   - Copy Public URL (ví dụ: `https://searxng-xxxx.up.railway.app`)

2. **Cập nhật Environment Variable**:
   ```
   SEARXNG_API_URL=https://searxng-xxxx.up.railway.app
   ```

**Nhược điểm**: Chậm hơn và tốn bandwidth hơn internal URL.

### Bước 5: Kiểm tra SearXNG Logs

Kiểm tra logs của SearXNG service để xem lý do bị chặn:

```bash
# Railway Dashboard → SearXNG Service → Logs
```

Tìm các dòng về:
- `403 Forbidden`
- `Rate limit exceeded`
- `Bot detection`

### Bước 6: Test Connection

Sau khi cấu hình, test kết nối:

1. **Từ Perplexica App logs**, bạn sẽ thấy:
   - Nếu thành công: Không có lỗi 403
   - Nếu vẫn lỗi: Sẽ có log chi tiết về lỗi

2. **Hoặc test trực tiếp từ browser**:
   ```
   http://searxng.railway.internal:8080/search?q=test&format=json
   ```
   (Chỉ hoạt động từ trong Railway network)

## Giải pháp Tạm thời: Graceful Error Handling

Code đã được cập nhật để xử lý lỗi 403 một cách graceful:

- **Discover route**: Trả về empty array thay vì crash
- **Images route**: Trả về error message rõ ràng
- **Error logging**: Log chi tiết để debug

App sẽ không crash khi gặp 403, nhưng sẽ không có kết quả search.

## Cấu hình Khuyến nghị cho Railway

### SearXNG Service

**Docker Image**: `docker.io/searxng/searxng:latest`

**Environment Variables**:
```bash
# Không cần set gì đặc biệt, SearXNG sẽ tự động detect
```

**Volumes** (nếu cần custom config):
```
./searxng:/etc/searxng:rw
```

**Port**: `8080` (internal)

### Perplexica Web App Service

**Environment Variables**:
```bash
SEARXNG_API_URL=http://searxng.railway.internal:8080
```

**Lưu ý**: Thay `searxng` bằng service name thực tế của SearXNG trên Railway.

## Troubleshooting

### Vẫn gặp 403 sau khi cấu hình

1. **Kiểm tra service name**:
   - Đảm bảo service name trong `SEARXNG_API_URL` khớp với tên service trên Railway
   - Railway internal URL format: `http://<service-name>.railway.internal:<port>`

2. **Kiểm tra port**:
   - SearXNG mặc định port 8080
   - Kiểm tra trong Railway Dashboard → SearXNG Service → Settings → Networking

3. **Kiểm tra SearXNG đang chạy**:
   - Xem logs của SearXNG service
   - Đảm bảo không có lỗi startup

4. **Thử public URL**:
   - Tạm thời dùng public URL để test
   - Nếu public URL hoạt động nhưng internal URL không, có thể là vấn đề network

### SearXNG không start

1. **Kiểm tra logs**:
   - Railway Dashboard → SearXNG Service → Logs
   - Tìm lỗi startup

2. **Kiểm tra volumes**:
   - Nếu mount volume, đảm bảo path đúng
   - Kiểm tra permissions

3. **Kiểm tra resources**:
   - SearXNG cần đủ RAM và CPU
   - Railway có thể giới hạn resources

## Liên kết Hữu ích

- [SearXNG Documentation](https://docs.searxng.org/)
- [SearXNG Settings](https://docs.searxng.org/admin/settings/settings_search.html)
- [Railway Internal Networking](https://docs.railway.app/develop/services#internal-networking)

