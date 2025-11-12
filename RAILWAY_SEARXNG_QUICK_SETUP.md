# Hướng dẫn Nhanh: Setup SearXNG trên Railway với Custom Config

## Tổng quan

Thay đổi cách setup SearXNG từ Docker Hub image sang deploy từ GitHub repo với Dockerfile để có thể thêm custom config (disable bot detection).

## Các Bước Thực Hiện

### Bước 1: Đảm bảo Files Cần Thiết Đã Có

Kiểm tra các files sau đã có trong repo:

- ✅ `Dockerfile.searxng` - Dockerfile để build SearXNG với custom config
- ✅ `searxng/limiter.toml` - Config để disable bot detection
- ✅ `searxng/settings.yml` - Settings cơ bản
- ✅ `searxng/uwsgi.ini` - uWSGI config

### Bước 2: Commit và Push lên GitHub

```bash
# Kiểm tra files
git status

# Add files
git add Dockerfile.searxng searxng/limiter.toml searxng/settings.yml searxng/uwsgi.ini

# Commit
git commit -m "Add SearXNG Dockerfile with custom config to disable bot detection"

# Push
git push
```

### Bước 3: Xóa Service SearXNG Cũ (Nếu có)

1. **Vào Railway Dashboard**:
   - Chọn project của bạn
   - Tìm SearXNG service hiện tại
   - Click vào service → Settings → Danger Zone → Delete Service

2. **Lưu ý**: 
   - Backup URL của service cũ nếu cần
   - Ghi nhớ service name để cấu hình lại sau

### Bước 4: Tạo SearXNG Service Mới từ GitHub

1. **Vào Railway Dashboard**:
   - Chọn project của bạn
   - Click **"New Service"**
   - Chọn **"Deploy from GitHub repo"**

2. **Chọn Repository**:
   - Chọn repository của bạn
   - Railway sẽ tự động detect

3. **Cấu hình Service**:
   - **Service Name**: `searxng` (hoặc tên bạn muốn, nhớ để cấu hình lại URL sau)
   - **Root Directory**: `.` (root của repo)
   - **Dockerfile Path**: `Dockerfile.searxng` ⚠️ **Quan trọng**: Phải set đúng path này
   - **Port**: `8080`

4. **Environment Variables** (Optional):
   ```
   SEARXNG_SECRET=<generate-random-secret>
   ```
   (Có thể để trống, SearXNG sẽ tự generate)

5. **Deploy**:
   - Railway sẽ tự động build image từ Dockerfile
   - Quá trình build sẽ copy config files vào image
   - Service sẽ start với bot detection disabled

### Bước 5: Kiểm tra Deploy

1. **Xem Build Logs**:
   - Railway Dashboard → SearXNG Service → Deployments → Latest
   - Xem build logs để đảm bảo:
     - ✅ Dockerfile được detect
     - ✅ Config files được copy thành công
     - ✅ Build thành công

2. **Xem Runtime Logs**:
   - Railway Dashboard → SearXNG Service → Logs
   - Tìm các dòng:
     - ✅ SearXNG started successfully
     - ✅ Config loaded from /etc/searxng
     - ❌ Không có lỗi về bot detection

3. **Test SearXNG**:
   - Mở public URL của SearXNG service
   - Thử search một query
   - Hoặc test API: `https://your-searxng.railway.app/search?q=test&format=json`
   - ✅ Không còn lỗi 403

### Bước 6: Cập nhật Perplexica App Config

1. **Lấy Service Name mới**:
   - Railway Dashboard → SearXNG Service → Settings
   - Ghi nhớ service name (ví dụ: `searxng-production-xxxx`)

2. **Cập nhật Environment Variable**:
   - Railway Dashboard → Perplexica Web App Service → Settings → Variables
   - Cập nhật `SEARXNG_API_URL`:
     ```
     SEARXNG_API_URL=http://searxng-production-xxxx.railway.internal:8080
     ```
     (Thay `searxng-production-xxxx` bằng service name thực tế)

3. **Redeploy Perplexica App**:
   - Railway sẽ tự động redeploy khi có thay đổi env var
   - Hoặc click **"Redeploy"** trong tab Deployments

### Bước 7: Test Tích hợp

1. **Test Search**:
   - Mở Perplexica app
   - Thử search một query
   - ✅ Không còn lỗi 403
   - ✅ Có kết quả từ SearXNG

2. **Test Discover Page**:
   - Vào discover page
   - ✅ Load được articles
   - ✅ Không có lỗi

3. **Test Image Search**:
   - Thử search images
   - ✅ Hoạt động bình thường

## Troubleshooting

### Dockerfile không được detect

**Triệu chứng**: Railway không build từ Dockerfile

**Giải pháp**:
1. Railway Dashboard → SearXNG Service → Settings → Deploy
2. Set **Dockerfile Path**: `Dockerfile.searxng`
3. Redeploy

### Config không được load

**Triệu chứng**: Vẫn gặp 403 sau khi deploy

**Giải pháp**:
1. Kiểm tra build logs - đảm bảo files được copy
2. Kiểm tra runtime logs - tìm dòng về loading config
3. Kiểm tra file `searxng/limiter.toml` có `[botdetection] enabled = false`
4. Redeploy service

### Service name thay đổi

**Triệu chứng**: Perplexica không kết nối được với SearXNG

**Giải pháp**:
1. Lấy service name mới từ Railway Dashboard
2. Cập nhật `SEARXNG_API_URL` trong Perplexica app
3. Redeploy Perplexica app

## Checklist

Trước khi deploy:
- [ ] Files `Dockerfile.searxng`, `searxng/limiter.toml`, `searxng/settings.yml` đã có
- [ ] Files đã được commit và push lên GitHub
- [ ] Đã backup service name cũ (nếu có)

Sau khi deploy:
- [ ] SearXNG service build thành công
- [ ] SearXNG service start thành công
- [ ] Không có lỗi 403 khi test SearXNG trực tiếp
- [ ] Đã cập nhật `SEARXNG_API_URL` trong Perplexica app
- [ ] Perplexica app kết nối được với SearXNG
- [ ] Search functionality hoạt động bình thường

## Lưu ý Quan trọng

1. ⚠️ **Service Name**: Ghi nhớ service name mới để cấu hình lại URL
2. ⚠️ **Dockerfile Path**: Phải set đúng `Dockerfile.searxng` trong Railway
3. ⚠️ **Rebuild**: Mỗi khi thay đổi config, cần rebuild image
4. ✅ **Internal URL**: Luôn dùng internal URL (`*.railway.internal`) cho performance tốt nhất

## Tài liệu Tham khảo

- `RAILWAY_SEARXNG_CUSTOM_SETUP.md` - Hướng dẫn chi tiết các cách setup
- `RAILWAY_SEARXNG_DISABLE_BOT_DETECTION.md` - Chi tiết về disable bot detection
- `RAILWAY_FIX_SUMMARY.md` - Tóm tắt các fix

