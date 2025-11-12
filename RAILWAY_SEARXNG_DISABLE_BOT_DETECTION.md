# Cách Disable Bot Detection trong SearXNG trên Railway

## Vấn đề

SearXNG đang trả về **403 Forbidden** do bot detection đang chặn API requests từ Perplexica app.

## Giải pháp: Disable Bot Detection trong SearXNG

### Cách 1: Sử dụng Environment Variables trên Railway (Khuyến nghị)

1. **Vào Railway Dashboard** → SearXNG Service → Settings → Variables

2. **Thêm Environment Variable**:
   ```
   SEARXNG_SETTINGS_PATH=/etc/searxng
   ```

3. **Tạo file cấu hình để disable bot detection**:

   Tạo một file mới trong repo của bạn: `searxng/limiter.toml`

   ```toml
   # Disable bot detection completely
   [botdetection]
   enabled = false
   ```

   Hoặc nếu muốn giữ bot detection nhưng giảm strictness:

   ```toml
   [botdetection.ip_limit]
   # Activate link_token method
   link_token = true
   # Disable strict limit
   strict_limit = false
   # Increase rate limit significantly (requests per minute)
   ip_limit = 10000
   # Increase ban time
   ban_time = 0
   ```

4. **Mount volume trong Railway**:
   - Railway Dashboard → SearXNG Service → Settings → Volumes
   - Add volume mount:
     - **Mount Path**: `/etc/searxng`
     - **Local Path**: `./searxng` (hoặc path đến folder chứa config)

5. **Redeploy SearXNG service**

### Cách 2: Sử dụng Dockerfile với Custom Config

Nếu Railway không hỗ trợ mount volumes, tạo một Dockerfile custom:

1. **Tạo file `Dockerfile.searxng`**:

```dockerfile
FROM searxng/searxng:latest

# Copy custom limiter config
COPY searxng/limiter.toml /etc/searxng/limiter.toml

# Ensure permissions
RUN chmod 644 /etc/searxng/limiter.toml
```

2. **Build và deploy image này lên Railway**

### Cách 3: Sử dụng Init Script (Nếu Railway hỗ trợ)

1. **Tạo file `searxng-init.sh`**:

```bash
#!/bin/sh
# Disable bot detection by creating limiter.toml
cat > /etc/searxng/limiter.toml << EOF
[botdetection]
enabled = false
EOF
```

2. **Set environment variable**:
   ```
   SEARXNG_INIT_SCRIPT=/path/to/searxng-init.sh
   ```

### Cách 4: Sử dụng Public SearXNG Instance (Tạm thời)

Nếu không thể cấu hình SearXNG trên Railway, có thể dùng public instance:

1. **Tìm public SearXNG instance**:
   - https://searx.be
   - https://searx.tiekoetter.com
   - Hoặc tìm trên https://searx.space

2. **Cập nhật Environment Variable**:
   ```
   SEARXNG_API_URL=https://searx.be
   ```

**Lưu ý**: Public instances có thể có rate limiting và không đảm bảo privacy.

## Kiểm tra Cấu hình

Sau khi cấu hình, test bằng cách:

1. **Kiểm tra SearXNG logs**:
   ```
   Railway Dashboard → SearXNG Service → Logs
   ```
   Tìm các dòng về bot detection hoặc rate limiting.

2. **Test từ Perplexica app**:
   - Thử search một query
   - Nếu không còn 403, nghĩa là đã thành công

3. **Test trực tiếp từ browser**:
   ```
   https://your-searxng.railway.app/search?q=test&format=json
   ```
   Nếu trả về JSON thay vì 403, nghĩa là đã thành công.

## Cấu hình Chi tiết cho limiter.toml

### Option 1: Disable hoàn toàn bot detection

```toml
[botdetection]
enabled = false
```

### Option 2: Giảm strictness nhưng vẫn giữ bot detection

```toml
[botdetection.ip_limit]
link_token = true
strict_limit = false
ip_limit = 10000
ban_time = 0
max_ban_time = 0
```

### Option 3: Chỉ disable cho internal network

```toml
[botdetection.ip_limit]
link_token = true
strict_limit = false
ip_limit = 10000

# Whitelist internal IPs (nếu cần)
[botdetection.ip_whitelist]
# Thêm IPs cần whitelist
```

## Troubleshooting

### Vẫn gặp 403 sau khi cấu hình

1. **Kiểm tra file config có được mount đúng không**:
   - Xem logs của SearXNG service
   - Tìm dòng về loading config

2. **Kiểm tra permissions**:
   - File `limiter.toml` phải có quyền đọc
   - User `searxng` phải có quyền đọc file

3. **Kiểm tra syntax**:
   - File TOML phải có syntax đúng
   - Không có lỗi trong file

4. **Restart SearXNG**:
   - Sau khi thay đổi config, cần restart service
   - Railway sẽ tự động restart khi redeploy

### SearXNG không start sau khi cấu hình

1. **Kiểm tra logs**:
   - Xem lỗi cụ thể trong logs
   - Có thể là syntax error trong config file

2. **Rollback config**:
   - Xóa hoặc comment out config mới
   - Redeploy để test

## Lưu ý Quan trọng

1. ⚠️ **Disable bot detection có thể làm SearXNG dễ bị abuse**
   - Chỉ disable nếu bạn tin tưởng nguồn requests
   - Hoặc sử dụng firewall/IP whitelist

2. ✅ **Khuyến nghị**: Giảm strictness thay vì disable hoàn toàn
   - Tăng `ip_limit` lên cao
   - Set `strict_limit = false`
   - Giữ bot detection enabled nhưng loose

3. 🔒 **Security**: Nếu disable bot detection, đảm bảo:
   - SearXNG chỉ accessible từ internal network
   - Hoặc có authentication/authorization khác
   - Hoặc sử dụng rate limiting ở tầng khác (Railway, Nginx, etc.)

## Tham khảo

- [SearXNG Bot Detection Documentation](https://docs.searxng.org/admin/settings/settings_bot_detection.html)
- [SearXNG Limiter Configuration](https://docs.searxng.org/admin/settings/settings_limiter.html)
- [Railway Volumes Documentation](https://docs.railway.app/develop/services#volumes)

