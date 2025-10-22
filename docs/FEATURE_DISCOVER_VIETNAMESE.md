# 🇻🇳 Tính năng Dịch Tự động cho Trang Khám phá

## Mô tả
Trang `/discover` đã được nâng cấp để tự động dịch toàn bộ nội dung tin tức từ tiếng Anh sang tiếng Việt trước khi hiển thị cho người dùng.

## Thay đổi chính

### 1. Library Dịch mới (`src/lib/translator.ts`)
- Sử dụng **MyMemory Translation API** - miễn phí, không cần API key
- Hỗ trợ dịch hàng loạt với batch processing
- Rate limit: 500 requests/day (đủ dùng)
- Tự động delay giữa các request để tránh rate limit

### 2. API Dịch (`/api/translate`)
- Endpoint để dịch văn bản sang tiếng Việt
- Sử dụng translator library
- Hỗ trợ dịch hàng loạt

### 3. Cập nhật API Discover (`/api/discover`)
- Tự động dịch title và content của tất cả tin tức
- Dịch theo batch (5 text/batch) để tối ưu
- Có fallback trả về nội dung gốc nếu dịch thất bại

### 3. Giao diện tiếng Việt
- Tiêu đề: "Khám phá" (thay vì "Discover")
- Các chủ đề:
  - Công nghệ & Khoa học
  - Tài chính
  - Nghệ thuật & Văn hóa
  - Thể thao
  - Giải trí
- Thông báo lỗi tiếng Việt

## Files thay đổi

1. **src/lib/translator.ts** (Mới)
   - Library dịch văn bản sử dụng MyMemory API
   - Hàm `translateSingle()`, `translateTexts()`, `translateTextsInBatches()`

2. **src/app/api/translate/route.ts** (Mới)
   - API endpoint dịch văn bản
   - Sử dụng translator library
   
3. **src/app/api/discover/route.ts**
   - Import `translateTextsInBatches` từ translator
   - Logic dịch tự động trước khi trả về data
   - Log tiến trình dịch

4. **src/app/discover/page.tsx**
   - Cập nhật tên các chủ đề sang tiếng Việt
   - Thay đổi tiêu đề "Discover" → "Khám phá"
   - Thông báo lỗi tiếng Việt

## Cách hoạt động

```
1. User truy cập /discover
   ↓
2. API discover lấy tin tức từ các nguồn (tiếng Anh)
   ↓
3. Thu thập tất cả title và content cần dịch
   ↓
4. Gọi LLM để dịch hàng loạt sang tiếng Việt
   ↓
5. Parse kết quả và ánh xạ lại vào data
   ↓
6. Trả về data đã dịch cho client
   ↓
7. Hiển thị tin tức bằng tiếng Việt
```

## Tối ưu hiệu suất

- **Batch processing**: Dịch theo batch (5 text/batch) thay vì từng cái
- **Rate limiting**: Tự động delay giữa các request (100-200ms)
- **Error handling**: Fallback về nội dung gốc nếu dịch thất bại
- **Parallel translation**: Các text trong batch được dịch song song

## Ví dụ

### Trước khi dịch:
```json
{
  "title": "Apple Announces New iPhone Features",
  "content": "Apple unveiled new AI-powered features..."
}
```

### Sau khi dịch:
```json
{
  "title": "Apple công bố các tính năng mới của iPhone",
  "content": "Apple đã ra mắt các tính năng mới được hỗ trợ bởi AI..."
}
```

## Yêu cầu

- **Không cần cài đặt gì thêm** - API miễn phí không cần key
- Cần kết nối internet để gọi MyMemory Translation API
- Rate limit: 500 requests/day (đủ cho hầu hết trường hợp sử dụng)

## Troubleshooting

### Nếu nội dung không được dịch:
1. Kiểm tra kết nối internet
2. Xem console log (server-side) để biết lỗi cụ thể:
   ```
   🌐 Đang dịch X tin tức sang tiếng Việt...
   ✅ Dịch xong Y đoạn văn bản
   ```
3. Nội dung gốc (tiếng Anh) sẽ được hiển thị nếu dịch thất bại

### Nếu dịch chậm:
- Thời gian dịch phụ thuộc vào số lượng tin tức (thường 5-10 giây)
- API có delay giữa các request để tránh rate limit
- Có thể giảm batch size trong code nếu cần nhanh hơn

### Nếu gặp rate limit (429 error):
- MyMemory API giới hạn 500 requests/day
- Delay giữa các request sẽ giúp tránh rate limit ngắn hạn
- Có thể đăng ký tài khoản MyMemory để tăng limit

## API Alternative

Nếu cần dịch vụ khác, có thể thay thế trong `src/lib/translator.ts`:
- **Google Translate API** (trả phí)
- **DeepL API** (chất lượng cao, trả phí)
- **LibreTranslate** (self-hosted, miễn phí)
- **Azure Translator** (trả phí)

## Tương lai

Có thể cải thiện:
- [ ] Cache kết quả dịch để tránh dịch lại (sử dụng Redis/Database)
- [ ] Cho phép user toggle ngôn ngữ (vi/en)
- [ ] Dịch song song nhiều batch để tăng tốc
- [ ] Tích hợp nhiều dịch vụ dịch thuật (fallback chain)
- [ ] Lưu bản dịch vào database để tái sử dụng

