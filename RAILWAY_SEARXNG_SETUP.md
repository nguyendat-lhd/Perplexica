# Cấu hình SearXNG trên Railway

## Tổng quan

Perplexica cần kết nối với SearXNG để thực hiện tìm kiếm web. Trên Railway, bạn cần cấu hình environment variable để kết nối với SearXNG service.

## Bước 1: Xác định SearXNG Service URL

Trên Railway, SearXNG service có thể được truy cập qua:

### Option 1: Internal Service URL (Khuyến nghị)
- Format: `http://searxng.railway.internal:8080`
- Hoặc: `http://<service-name>:8080` (nếu trong cùng project)
- Port mặc định: `8080`

### Option 2: Public URL
- Format: `https://<searxng-service>.up.railway.app`
- Không khuyến nghị vì tốn bandwidth và chậm hơn

## Bước 2: Cấu hình Environment Variable trên Railway

1. **Vào Railway Dashboard**:
   - Chọn project của bạn
   - Click vào **Perplexica Web App** service

2. **Vào Settings → Variables**:
   - Click tab **Variables**

3. **Thêm Environment Variable**:
   ```
   SEARXNG_API_URL=http://searxng.railway.internal:8080
   ```
   
   **Lưu ý**: 
   - Thay `searxng.railway.internal` bằng service name thực tế của SearXNG service trên Railway
   - Port mặc định là `8080`, nếu SearXNG dùng port khác thì thay đổi
   - Không có `https://` vì đây là internal connection

4. **Xác nhận Port của SearXNG**:
   - Vào SearXNG service trên Railway
   - Check **Settings → Networking** để xem port
   - Hoặc check logs để xem port nào đang được sử dụng

## Bước 3: Kiểm tra kết nối

Sau khi set environment variable:

1. **Redeploy service**:
   - Railway sẽ tự động redeploy khi có thay đổi environment variable
   - Hoặc click **"Redeploy"** trong tab **Deployments**

2. **Kiểm tra logs**:
   - Vào tab **Deployments** → Click deployment mới nhất
   - Xem logs để đảm bảo không có lỗi kết nối SearXNG

3. **Test search**:
   - Mở web app trên Railway URL
   - Thử search một query
   - Nếu thành công, bạn sẽ thấy kết quả từ SearXNG

## Troubleshooting

### Lỗi: Cannot connect to SearXNG

**Nguyên nhân**: 
- `SEARXNG_API_URL` sai
- SearXNG service chưa start
- Port không đúng

**Giải pháp**:
1. Kiểm tra SearXNG service đang chạy trên Railway
2. Xác nhận service name và port trong Railway dashboard
3. Test URL từ browser hoặc curl:
   ```bash
   curl http://searxng.railway.internal:8080/search?q=test&format=json
   ```

### Lỗi: Connection refused

**Nguyên nhân**: 
- SearXNG không expose port đúng
- Service name sai

**Giải pháp**:
- Đảm bảo SearXNG service expose port `8080` (hoặc port tương ứng)
- Check **Settings → Networking** của SearXNG service

### Lỗi: Timeout

**Nguyên nhân**: 
- SearXNG service chưa ready
- Network configuration sai

**Giải pháp**:
- Đợi SearXNG service start hoàn toàn
- Check logs của SearXNG service
- Đảm bảo cả 2 services trong cùng Railway project

## Cấu hình mẫu

### SearXNG Service trên Railway:
- **Service Name**: `searxng` (hoặc tên bạn đặt)
- **Docker Image**: `docker.io/searxng/searxng:latest`
- **Port**: `8080` (internal)

### Perplexica Web App Service:
- **Environment Variable**: 
  ```
  SEARXNG_API_URL=http://searxng.railway.internal:8080
  ```
  Hoặc nếu service name khác:
  ```
  SEARXNG_API_URL=http://<your-searxng-service-name>.railway.internal:8080
  ```

## Lưu ý quan trọng

1. ✅ **Internal URL**: Luôn dùng internal URL (`*.railway.internal`) thay vì public URL để tối ưu performance
2. ✅ **Port**: Đảm bảo port khớp với port SearXNG đang expose
3. ✅ **Service Name**: Service name phải khớp với tên service trên Railway
4. ✅ **Redeploy**: Sau khi thay đổi environment variable, cần redeploy service

## Kiểm tra nhanh

Sau khi cấu hình, bạn có thể test bằng cách:

1. Vào web app
2. Thử search một query đơn giản như "test"
3. Nếu thấy kết quả từ web, nghĩa là đã kết nối thành công với SearXNG

