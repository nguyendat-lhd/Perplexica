#!/bin/bash

# Script khởi động nhanh Perplexica với Docker
# Sử dụng cấu hình từ config.toml đã được thiết lập

echo "🚀 Đang khởi động Perplexica với Docker..."
echo ""

# Kiểm tra Docker đang chạy
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker không đang chạy. Vui lòng khởi động Docker trước."
    exit 1
fi

# Kiểm tra file config.toml tồn tại
if [ ! -f "config.toml" ]; then
    echo "❌ File config.toml không tồn tại."
    echo "📝 Đang tạo từ sample.config.toml..."
    cp sample.config.toml config.toml
    echo "⚠️  Vui lòng cấu hình config.toml trước khi tiếp tục."
    exit 1
fi

echo "✅ Đã tìm thấy config.toml"
echo ""

# Kiểm tra docker-compose.yaml
if [ ! -f "docker-compose.yaml" ]; then
    echo "❌ File docker-compose.yaml không tồn tại."
    exit 1
fi

echo "📦 Đang khởi động containers..."
echo ""

# Khởi động với docker compose
docker compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Containers đã được khởi động thành công!"
    echo ""
    echo "📊 Đang kiểm tra trạng thái containers..."
    docker compose ps
    echo ""
    echo "⏳ Đang chờ ứng dụng khởi động hoàn toàn..."
    echo "   (Quá trình này có thể mất vài phút lần đầu tiên)"
    echo ""
    echo "📝 Để xem logs:"
    echo "   docker compose logs -f"
    echo ""
    echo "🌐 Truy cập Perplexica tại:"
    echo "   http://localhost:3000"
    echo ""
    echo "⚙️  Sau khi ứng dụng chạy, vào Settings để:"
    echo "   1. Chọn Chat Model Provider: Custom OpenAI"
    echo "   2. Chọn Embedding Model Provider: Hugging Face"
    echo "   3. Chọn Embedding Model: Bert Multilingual"
    echo ""
else
    echo ""
    echo "❌ Có lỗi xảy ra khi khởi động containers."
    echo "📋 Xem logs để biết thêm chi tiết:"
    echo "   docker compose logs"
    exit 1
fi


