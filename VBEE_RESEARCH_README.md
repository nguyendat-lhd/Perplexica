# Hướng dẫn sử dụng Code Mode để nghiên cứu về VBee AI

Script này sử dụng Code Mode của MCP Perplexica để tự động:
1. Tìm hiểu thông tin về VBee AI từ https://vbee.vn/
2. Tìm kiếm hình ảnh liên quan đến VBee
3. Tìm kiếm video YouTube về VBee
4. Tạo bài báo tổng hợp với nhận định và đánh giá

## Yêu cầu

- Perplexica server phải đang chạy
- Node.js và npm đã được cài đặt

## Cách sử dụng

### 1. Đảm bảo Perplexica server đang chạy

```bash
# Trong một terminal khác, chạy Perplexica server
npm run dev
# hoặc
npm start
```

### 2. Chạy script nghiên cứu

```bash
# Sử dụng tsx trực tiếp
tsx vbee-research-runner.ts

# Hoặc sử dụng npm script
npm run research:vbee
```

### 3. Xem kết quả

Script sẽ:
- In ra console các logs từ quá trình thực thi
- Hiển thị kết quả JSON
- Lưu kết quả vào file `vbee-research-result.json`

## Cấu trúc kết quả

File `vbee-research-result.json` sẽ chứa:

```json
{
  "title": "VBee AI - Tổng quan và Đánh giá",
  "sections": [
    {
      "title": "Thông tin về VBee AI",
      "content": "...",
      "sources": [...]
    },
    {
      "title": "Công nghệ và Ứng dụng",
      "content": "...",
      "sources": [...]
    },
    {
      "title": "Nhận định và Đánh giá",
      "content": "...",
      "sources": [...]
    }
  ],
  "images": [
    {
      "title": "...",
      "url": "...",
      "thumbnail": "..."
    }
  ],
  "videos": [
    {
      "title": "...",
      "url": "...",
      "thumbnail": "...",
      "duration": "..."
    }
  ],
  "sources": ["url1", "url2", ...]
}
```

## Tùy chỉnh

### Thay đổi base URL

```bash
export PERPLEXICA_BASE_URL=http://localhost:3000
tsx vbee-research-runner.ts
```

### Chỉnh sửa code nghiên cứu

Chỉnh sửa file `vbee-research.ts` để thay đổi:
- Câu hỏi tìm kiếm
- Số lượng hình ảnh/video
- Các phần trong bài báo

## Troubleshooting

### Lỗi kết nối API

- Đảm bảo Perplexica server đang chạy tại URL đúng
- Kiểm tra biến môi trường `PERPLEXICA_BASE_URL`

### Timeout

- Code execution có timeout 30 giây
- Nếu cần thời gian lâu hơn, chỉnh sửa timeout trong `src/mcp/code-mode/executor.ts`

### Không tìm thấy hình ảnh/video

- Điều này có thể xảy ra nếu không có kết quả phù hợp
- Thử thay đổi query trong `vbee-research.ts`








