# Hướng dẫn Triển khai Nhanh với Cấu hình Đã Thiết Lập

File `config.toml` đã được cấu hình với:
- **Chat Model Provider**: Custom OpenAI
  - Model: `glm-4.5`
  - API URL: `https://api.z.ai/api/coding/paas/v4`
  - API Key: Đã được cấu hình

## Cách 1: Sử dụng Script Tự động (Khuyến nghị)

```bash
./start.sh
```

Script này sẽ tự động:
- Kiểm tra Docker đang chạy
- Kiểm tra file config.toml
- Khởi động containers
- Hiển thị thông tin truy cập

## Cách 2: Khởi động Thủ công

```bash
# Đảm bảo bạn đang ở thư mục gốc của project
docker compose up -d

# Xem logs để theo dõi quá trình khởi động
docker compose logs -f
```

## Sau khi Khởi động

1. **Truy cập ứng dụng**: http://localhost:3000

2. **Cấu hình Embedding Model trong Settings**:
   - Click vào biểu tượng ⚙️ Settings
   - Tìm phần **"Embedding Model Provider"**
   - Chọn **"Hugging Face"**
   - Chọn **"Bert Multilingual"** từ dropdown
   - Click **Save**

3. **Kiểm tra Chat Model Provider**:
   - Trong Settings, kiểm tra **"Chat Model Provider"** đã được chọn là **"Custom OpenAI"**
   - Model name phải là **"glm-4.5"**

## Kiểm tra Trạng thái

```bash
# Xem trạng thái containers
docker compose ps

# Xem logs của app
docker compose logs -f app

# Xem logs của searxng
docker compose logs -f searxng
```

## Dừng Ứng dụng

```bash
# Dừng containers (giữ data)
docker compose stop

# Dừng và xóa containers (giữ data)
docker compose down

# Dừng và xóa tất cả bao gồm volumes (mất data)
docker compose down -v
```

## Troubleshooting

### Container không khởi động
```bash
# Xem logs chi tiết
docker compose logs app

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Lỗi kết nối API
- Kiểm tra API URL và API Key trong `config.toml`
- Đảm bảo API endpoint có thể truy cập được từ container

### Port đã được sử dụng
```bash
# Kiểm tra port 3000
lsof -i :3000

# Kiểm tra port 4000
lsof -i :4000
```

Nếu port đã được sử dụng, bạn có thể thay đổi trong `docker-compose.yaml`:
```yaml
ports:
  - 3001:3000  # Thay đổi 3000 thành 3001
```

## Tài liệu Tham khảo

- [Hướng dẫn Setup Docker Chi tiết](./docs/installation/DOCKER_SETUP_VI.md)
- [README chính](./README.md)


