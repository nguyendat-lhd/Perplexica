# Setup SearXNG trên Railway với Custom Config (Docker Hub Image)

## Vấn đề

Khi setup SearXNG từ Docker Hub (`docker.io/searxng/searxng:latest`), bạn không thể mount volume trực tiếp để thêm custom config files. Cần tạo custom Dockerfile để copy config vào image.

## Giải pháp: Tạo Custom Dockerfile cho SearXNG

### Cách 1: Deploy từ GitHub Repo với Dockerfile (Khuyến nghị)

#### Bước 1: Tạo Dockerfile cho SearXNG

Tạo file `Dockerfile.searxng` trong root của repo:

```dockerfile
FROM searxng/searxng:latest

# Copy custom config files
COPY searxng/limiter.toml /etc/searxng/limiter.toml
COPY searxng/settings.yml /etc/searxng/settings.yml
COPY searxng/uwsgi.ini /etc/searxng/uwsgi.ini

# Ensure permissions
RUN chmod 644 /etc/searxng/limiter.toml && \
    chmod 644 /etc/searxng/settings.yml && \
    chmod 644 /etc/searxng/uwsgi.ini

# Expose port
EXPOSE 8080
```

#### Bước 2: Setup SearXNG Service trên Railway

1. **Vào Railway Dashboard**:
   - Chọn project của bạn
   - Click **"New Service"**
   - Chọn **"Deploy from GitHub repo"**
   - Chọn repository của bạn

2. **Cấu hình Service**:
   - **Service Name**: `searxng` (hoặc tên bạn muốn)
   - **Root Directory**: `.` (root của repo)
   - **Dockerfile Path**: `Dockerfile.searxng`
   - **Port**: `8080`

3. **Environment Variables** (nếu cần):
   ```
   SEARXNG_SECRET=<your-secret-key>
   ```
   (Optional, SearXNG sẽ tự generate nếu không có)

4. **Deploy**:
   - Railway sẽ build image từ Dockerfile
   - Config files sẽ được copy vào image
   - Service sẽ start với custom config

### Cách 2: Sử dụng Init Script (Nếu Railway hỗ trợ)

Nếu Railway hỗ trợ init scripts, bạn có thể tạo script để generate config:

#### Bước 1: Tạo init script

Tạo file `searxng-init.sh`:

```bash
#!/bin/sh
set -e

# Create config directory if not exists
mkdir -p /etc/searxng

# Create limiter.toml to disable bot detection
cat > /etc/searxng/limiter.toml << 'EOF'
# Disable bot detection completely for API requests
[botdetection]
enabled = false
EOF

# Create settings.yml if not exists
if [ ! -f /etc/searxng/settings.yml ]; then
  cat > /etc/searxng/settings.yml << 'EOF'
use_default_settings: true

general:
  instance_name: 'searxng'

search:
  autocomplete: 'google'
  formats:
    - html
    - json

server:
  bind_address: '0.0.0.0'
  port: 8080
EOF
fi

# Set permissions
chmod 644 /etc/searxng/limiter.toml
chmod 644 /etc/searxng/settings.yml

echo "SearXNG config initialized successfully"
```

#### Bước 2: Tạo Dockerfile với init script

```dockerfile
FROM searxng/searxng:latest

# Copy init script
COPY searxng-init.sh /usr/local/bin/searxng-init.sh
RUN chmod +x /usr/local/bin/searxng-init.sh

# Run init script before starting SearXNG
ENTRYPOINT ["/bin/sh", "-c", "/usr/local/bin/searxng-init.sh && exec /sbin/tini -- /usr/local/searxng/dockerfiles/docker-entrypoint.sh"]
```

### Cách 3: Sử dụng Environment Variables (Hạn chế)

SearXNG có một số config có thể set qua environment variables, nhưng không đủ để disable bot detection:

```bash
# Railway Dashboard → SearXNG Service → Settings → Variables
SEARXNG_SECRET=<your-secret>
SEARXNG_BASE_URL=https://your-searxng.railway.app
```

**Lưu ý**: Cách này không thể disable bot detection, chỉ có thể set một số basic config.

## Cấu hình Files Cần Có

### 1. `searxng/limiter.toml`

```toml
# Disable bot detection completely for API requests
[botdetection]
enabled = false

# Alternative: If you want to keep bot detection but make it less strict:
# [botdetection.ip_limit]
# link_token = true
# strict_limit = false
# ip_limit = 10000
# ban_time = 0
# max_ban_time = 0
```

### 2. `searxng/settings.yml`

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

engines:
  - name: wolframalpha
    disabled: false
```

### 3. `searxng/uwsgi.ini` (Optional)

```ini
[uwsgi]
# uwsgi configuration
# SearXNG sẽ tự động load nếu file này tồn tại
```

## Hướng dẫn Chi tiết: Deploy từ GitHub với Dockerfile

### Bước 1: Tạo Dockerfile trong Repo

1. **Tạo file `Dockerfile.searxng`** trong root của repo:

```dockerfile
FROM searxng/searxng:latest

# Copy custom config files
COPY searxng/limiter.toml /etc/searxng/limiter.toml
COPY searxng/settings.yml /etc/searxng/settings.yml

# Ensure permissions
RUN chmod 644 /etc/searxng/limiter.toml && \
    chmod 644 /etc/searxng/settings.yml

# Expose port
EXPOSE 8080
```

2. **Commit và push lên GitHub**:
   ```bash
   git add Dockerfile.searxng searxng/limiter.toml searxng/settings.yml
   git commit -m "Add SearXNG Dockerfile with custom config"
   git push
   ```

### Bước 2: Setup trên Railway

1. **Vào Railway Dashboard**:
   - Chọn project
   - Click **"New Service"**
   - Chọn **"Deploy from GitHub repo"**

2. **Chọn Repository**:
   - Chọn repo của bạn
   - Railway sẽ detect Dockerfile

3. **Cấu hình Service**:
   - **Service Name**: `searxng`
   - **Root Directory**: `.`
   - **Dockerfile Path**: `Dockerfile.searxng`
   - **Port**: `8080`

4. **Environment Variables** (Optional):
   ```
   SEARXNG_SECRET=<generate-random-secret>
   ```

5. **Deploy**:
   - Railway sẽ build image từ Dockerfile
   - Config files sẽ được copy vào image
   - Service sẽ start với bot detection disabled

### Bước 3: Kiểm tra

1. **Xem logs**:
   - Railway Dashboard → SearXNG Service → Logs
   - Tìm dòng về loading config
   - Không có lỗi về bot detection

2. **Test từ Perplexica app**:
   - Thử search một query
   - Không còn lỗi 403

3. **Test trực tiếp**:
   - Mở public URL của SearXNG
   - Thử search
   - Hoặc test API: `https://your-searxng.railway.app/search?q=test&format=json`

## So sánh các Cách

| Cách | Ưu điểm | Nhược điểm | Khuyến nghị |
|------|---------|------------|-------------|
| **Dockerfile từ GitHub** | ✅ Full control<br>✅ Config persistent<br>✅ Dễ maintain | ⚠️ Cần rebuild khi thay đổi config | ✅ **Khuyến nghị** |
| **Init Script** | ✅ Linh hoạt<br>✅ Có thể generate config | ⚠️ Phức tạp hơn<br>⚠️ Cần modify entrypoint | ⚠️ Nếu Dockerfile không đủ |
| **Environment Variables** | ✅ Đơn giản | ❌ Không thể disable bot detection | ❌ Không đủ |

## Troubleshooting

### Dockerfile không được detect

1. **Kiểm tra file name**:
   - Đảm bảo file tên là `Dockerfile.searxng` hoặc `Dockerfile`
   - Railway có thể không detect nếu tên khác

2. **Cấu hình thủ công**:
   - Railway Dashboard → Service → Settings → Deploy
   - Set **Dockerfile Path**: `Dockerfile.searxng`

### Config không được load

1. **Kiểm tra file paths trong Dockerfile**:
   - Đảm bảo paths đúng: `/etc/searxng/limiter.toml`
   - SearXNG sẽ tự động load từ `/etc/searxng/`

2. **Kiểm tra permissions**:
   - Files phải có quyền đọc
   - User `searxng` phải có quyền đọc

3. **Kiểm tra logs**:
   - Xem logs của SearXNG service
   - Tìm dòng về loading config
   - Có thể có lỗi syntax trong config files

### Vẫn gặp 403 sau khi deploy

1. **Kiểm tra config được load**:
   - Xem logs của SearXNG
   - Tìm dòng về `limiter.toml` hoặc `botdetection`

2. **Kiểm tra file config**:
   - Đảm bảo `limiter.toml` có `[botdetection] enabled = false`
   - Syntax TOML phải đúng

3. **Restart service**:
   - Redeploy SearXNG service
   - Đảm bảo config mới được load

## Lưu ý Quan trọng

1. ✅ **Commit config files**: Đảm bảo commit `searxng/limiter.toml` và `searxng/settings.yml` vào Git
2. ✅ **Rebuild khi thay đổi**: Mỗi khi thay đổi config, cần rebuild image trên Railway
3. ✅ **Security**: Disable bot detection có thể làm SearXNG dễ bị abuse, chỉ dùng cho internal API
4. ✅ **Backup**: Giữ backup của config files trước khi thay đổi

## Next Steps

Sau khi setup SearXNG với custom config:

1. ✅ Test SearXNG hoạt động
2. ✅ Cấu hình Perplexica app để kết nối với SearXNG
3. ✅ Test search functionality
4. ✅ Monitor logs để đảm bảo không có lỗi

Xem thêm:
- `RAILWAY_SEARXNG_SETUP.md` - Hướng dẫn setup cơ bản
- `RAILWAY_SEARXNG_DISABLE_BOT_DETECTION.md` - Chi tiết về disable bot detection
- `RAILWAY_FIX_SUMMARY.md` - Tóm tắt các fix

