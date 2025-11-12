# Tóm tắt Fix các Lỗi Railway

## Các Lỗi Đã Fix

### 1. ✅ Lỗi 403 Forbidden từ SearXNG

**Nguyên nhân**: SearXNG bot detection đang chặn API requests

**Giải pháp đã áp dụng**:
- ✅ Cải thiện headers trong requests (thêm User-Agent, Referer, Origin, etc.)
- ✅ Thêm retry logic với exponential backoff
- ✅ Cập nhật `searxng/limiter.toml` để disable bot detection
- ✅ Tạo tài liệu hướng dẫn chi tiết

**Các bước cần làm trên Railway**:

1. **Mount volume cho SearXNG config**:
   - Railway Dashboard → SearXNG Service → Settings → Volumes
   - Add volume: Mount `/etc/searxng` từ folder `searxng` trong repo

2. **Redeploy SearXNG service**:
   - Railway sẽ load file `limiter.toml` mới
   - Bot detection sẽ bị disable

3. **Kiểm tra logs**:
   - Xem logs của SearXNG để đảm bảo config được load
   - Test search từ Perplexica app

**Tài liệu chi tiết**: Xem `RAILWAY_SEARXNG_DISABLE_BOT_DETECTION.md`

### 2. ✅ Lỗi SIGTERM với npm start

**Nguyên nhân**: Railway gửi SIGTERM nhưng npm không forward signal đúng cách

**Giải pháp đã áp dụng**:
- ✅ Cập nhật `railway.json` để dùng `next start` trực tiếp
- ✅ Tăng healthcheck timeout lên 300ms

**Các bước cần làm trên Railway**:

1. **Redeploy service**:
   - Railway sẽ dùng start command mới từ `railway.json`
   - Next.js sẽ xử lý SIGTERM đúng cách

2. **Hoặc cấu hình trên Dashboard**:
   - Railway Dashboard → Service → Settings → Deploy
   - Set **Start Command**: `next start`
   - Set **Healthcheck Timeout**: `300`

## Checklist Deploy

### Trước khi Deploy

- [ ] Đảm bảo `searxng/limiter.toml` có `[botdetection] enabled = false`
- [ ] Đảm bảo `railway.json` có start command đúng
- [ ] Kiểm tra `SEARXNG_API_URL` environment variable

### Sau khi Deploy

- [ ] Kiểm tra SearXNG service logs - không có lỗi về bot detection
- [ ] Kiểm tra Perplexica app logs - không còn 403 errors
- [ ] Test search functionality - hoạt động bình thường
- [ ] Test discover page - load được articles
- [ ] Test image search - hoạt động bình thường

## Troubleshooting

### Vẫn gặp 403 sau khi disable bot detection

1. **Kiểm tra volume mount**:
   - Đảm bảo SearXNG service có mount volume đúng
   - File `limiter.toml` phải ở đúng path `/etc/searxng/limiter.toml`

2. **Kiểm tra file config**:
   - Xem logs của SearXNG để đảm bảo config được load
   - Có thể cần restart SearXNG service

3. **Thử public URL**:
   - Tạm thời dùng public URL của SearXNG để test
   - Nếu public URL hoạt động, vấn đề là ở internal network config

### Vẫn gặp SIGTERM error

1. **Kiểm tra build**:
   - Đảm bảo `npm run build` thành công
   - File `.next` folder được tạo

2. **Kiểm tra start command**:
   - Railway Dashboard → Service → Settings → Deploy
   - Đảm bảo start command là `next start` (không phải `npm run start`)

3. **Kiểm tra resources**:
   - Railway có thể kill process nếu thiếu memory
   - Xem logs để tìm lỗi OOM (Out of Memory)

## Files Đã Thay Đổi

1. ✅ `src/lib/searxng.ts` - Cải thiện error handling và retry logic
2. ✅ `searxng/limiter.toml` - Disable bot detection
3. ✅ `railway.json` - Fix start command
4. ✅ `src/app/api/discover/route.ts` - Cải thiện error handling
5. ✅ `src/app/api/images/route.ts` - Cải thiện error handling

## Tài liệu Tham khảo

- `RAILWAY_SEARXNG_DISABLE_BOT_DETECTION.md` - Hướng dẫn disable bot detection
- `RAILWAY_SEARXNG_403_FIX.md` - Hướng dẫn fix lỗi 403
- `RAILWAY_TROUBLESHOOTING.md` - Troubleshooting guide tổng quát

