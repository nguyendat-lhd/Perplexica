# ✅ Setup tiếp theo - Railway Deployment

Từ logs Railway, server đã chạy thành công! Bây giờ cần cấu hình Cursor để kết nối.

## 🎯 Railway URL của bạn

Từ logs, Railway URL là:
```
https://perplexica-production-1bd4.up.railway.app
```

**Endpoint MCP SSE:**
```
https://perplexica-production-1bd4.up.railway.app/v1/sse
```

## ✅ Đã cập nhật Cursor Config

File `~/.cursor/mcp.json` đã được cập nhật với Railway URL.

## 📋 Các bước tiếp theo

### 1. Kiểm tra Environment Variables trên Railway

Vào Railway Dashboard → Settings → Variables, đảm bảo có:

```
PERPLEXICA_BASE_URL=https://your-perplexica-api.com
```

**Lưu ý**: 
- Nếu Perplexica API cũng trên Railway, có thể dùng internal service URL
- Nếu chạy ở nơi khác, dùng public URL

### 2. Test Endpoint

Mở terminal và test:

```bash
curl -N -H "Accept: text/event-stream" \
     https://perplexica-production-1bd4.up.railway.app/v1/sse
```

Nếu thấy SSE stream (các dòng `data: ...`), endpoint đã hoạt động! ✅

### 3. Khởi động lại Cursor

**QUAN TRỌNG**: Phải restart Cursor hoàn toàn để load config mới:

1. **Quit Cursor hoàn toàn** (không chỉ đóng window)
   - macOS: Cmd + Q
   - Windows/Linux: Quit từ menu
2. Mở lại Cursor
3. MCP server sẽ tự động kết nối

### 4. Kiểm tra Kết nối

Trong Cursor, mở chat và thử:

```
What MCP tools are available?
```

Hoặc test trực tiếp:

```
Use perplexica_search to search for "what is Perplexica"
```

### 5. Xem Logs trên Railway

Khi Cursor kết nối, bạn sẽ thấy logs trong Railway:
- `[MCP] Session initialized: <session-id>`
- Tool calls và responses

## 🔧 Troubleshooting

### Nếu không kết nối được:

1. **Check Railway logs**: Xem có lỗi gì không
2. **Test endpoint**: Dùng curl như trên
3. **Check Cursor logs**: 
   - Help → Toggle Developer Tools → Console
   - Tìm lỗi liên quan đến MCP

### Nếu gặp CORS error:

Thêm vào Railway Variables:
```
MCP_ALLOWED_ORIGINS=https://cursor.sh,app://cursor
```

### Nếu không thấy MCP tools:

1. Đảm bảo đã restart Cursor hoàn toàn
2. Check `~/.cursor/mcp.json` có đúng format không
3. Xem Cursor console logs

## 📊 Monitoring

### Xem Logs trên Railway:
- Railway Dashboard → Service → Deployments → Click deployment → Logs

### Metrics:
- Railway Dashboard → Service → Metrics
- Xem CPU, Memory, Network traffic

## ✅ Checklist

- [x] MCP server đã deploy lên Railway ✅
- [x] Cursor config đã được cập nhật ✅
- [ ] Set `PERPLEXICA_BASE_URL` trên Railway
- [ ] Test endpoint bằng curl
- [ ] Restart Cursor
- [ ] Test kết nối từ Cursor
- [ ] Verify MCP tools hoạt động

## 🚀 Sau khi setup xong

Bạn có thể sử dụng các MCP tools:
- `perplexica_search` - AI-powered search
- `perplexica_chat` - Chat với AI
- `perplexica_search_images` - Tìm kiếm hình ảnh
- `perplexica_search_videos` - Tìm kiếm video
- `perplexica_get_models` - Lấy danh sách models
- `perplexica_get_config` - Lấy config

Xem chi tiết trong `RAILWAY_SETUP_NEXT_STEPS.md`




