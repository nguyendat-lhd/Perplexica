# 🚀 Hướng dẫn nhanh: Tính năng Dịch tự động

## Tổng quan
Trang `/discover` giờ đây tự động dịch tất cả nội dung tin tức sang tiếng Việt.

## 🔧 Công nghệ sử dụng
- **MyMemory Translation API**: Miễn phí, không cần API key
- **Batch processing**: Dịch 5 text cùng lúc để tối ưu tốc độ
- **Auto fallback**: Hiển thị tiếng Anh nếu dịch lỗi

## ✅ Test ngay

### 1. Khởi động server
```bash
npm run dev
```

### 2. Mở trình duyệt
```
http://localhost:3001/discover
```

### 3. Quan sát
- Chọn một chủ đề (Công nghệ, Tài chính, etc.)
- Đợi 5-10 giây để dịch
- Xem tin tức hiển thị bằng tiếng Việt

### 4. Kiểm tra log (Terminal server)
```
🌐 Đang dịch 20 tin tức sang tiếng Việt...
✅ Dịch xong 40 đoạn văn bản
```

## 📁 Files chính

```
src/lib/translator.ts              # Library dịch
src/app/api/translate/route.ts     # API endpoint dịch  
src/app/api/discover/route.ts      # API discover có dịch
src/app/discover/page.tsx          # UI tiếng Việt
```

## 🎯 Tính năng

✅ Dịch tự động title và content  
✅ Giao diện tiếng Việt  
✅ Không cần API key  
✅ Không cần cài package thêm  
✅ Fallback về tiếng Anh nếu lỗi  

## ⚡ Hiệu suất

- Thời gian dịch: **5-10 giây** cho ~20 tin tức
- Rate limit: **500 requests/day** (MyMemory API)
- Batch size: **5 text/batch**
- Delay: **100-200ms** giữa requests

## 🐛 Troubleshooting

### Không dịch được?
1. Kiểm tra internet
2. Xem log terminal
3. Thử reload trang

### Quá chậm?
- Giảm batch size: Sửa `5` → `3` trong `discover/route.ts` dòng 94
- Giảm delay: Sửa `100` và `200` trong `translator.ts`

### Rate limit?
- Đợi 24h để reset
- Hoặc đăng ký tài khoản MyMemory để tăng limit

## 📚 Tài liệu đầy đủ

Xem: `docs/FEATURE_DISCOVER_VIETNAMESE.md`

---

**Lưu ý**: API MyMemory miễn phí, chất lượng dịch ổn cho mục đích đọc tin tức. Nếu cần chất lượng cao hơn, có thể chuyển sang Google Translate hoặc DeepL (trả phí).

