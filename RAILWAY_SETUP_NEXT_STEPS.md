# Setup tiếp theo sau khi Deploy lên Railway

## Bước 1: Lấy Railway URL

Từ logs bạn đã thấy, Railway URL của bạn là:
```
https://perplexica-production-1bd4.up.railway.app
```

**Endpoint MCP SSE sẽ là:**
```
https://perplexica-production-1bd4.up.railway.app/v1/sse
```

## Bước 2: Kiểm tra Environment Variables

Vào Railway Dashboard → Settings → Variables, đảm bảo có:

```
PERPLEXICA_BASE_URL=https://your-perplexica-api.com
```

**Lưu ý**: 
- Nếu Perplexica API cũng chạy trên Railway, có thể dùng internal service URL
- Nếu chạy ở nơi khác, dùng public URL

## Bước 3: Test Endpoint

Test xem endpoint có hoạt động không:

```bash
curl -N -H "Accept: text/event-stream" \
     https://perplexica-production-1bd4.up.railway.app/v1/sse
```

Nếu thấy SSE stream, endpoint đã hoạt động!

## Bước 4: Cấu hình Cursor

### Cách 1: Qua Cursor Settings UI

1. Mở Cursor
2. Vào **Settings** (Cmd/Ctrl + ,)
3. Tìm **Features** → **Model Context Protocol**
4. Click **Add Server** hoặc **Edit**
5. Thêm cấu hình:
   - **Name**: `perplexica`
   - **URL**: `https://perplexica-production-1bd4.up.railway.app/v1/sse`
   - **Type**: `http`

### Cách 2: Chỉnh sửa file trực tiếp

Mở file `~/.cursor/mcp.json` và thêm/cập nhật:

```json
{
  "mcpServers": {
    "perplexica": {
      "url": "https://perplexica-production-1bd4.up.railway.app/v1/sse",
      "type": "http"
    }
  },
  "inputs": []
}
```

**Lưu ý**: 
- Thay URL bằng URL thực tế của bạn từ Railway
- URL phải kết thúc bằng `/v1/sse`
- Đảm bảo dùng `https://` (Railway tự động cung cấp HTTPS)

## Bước 5: Khởi động lại Cursor

Sau khi cấu hình:
1. **Quit hoàn toàn Cursor** (không chỉ đóng window)
2. Mở lại Cursor
3. MCP server sẽ tự động kết nối

## Bước 6: Kiểm tra Kết nối

### Trong Cursor:

1. Mở một chat mới với AI
2. Thử hỏi về MCP tools:
   ```
   What MCP tools are available?
   ```
3. Hoặc test trực tiếp:
   ```
   Use perplexica_search to search for "what is Perplexica"
   ```

### Kiểm tra Logs trên Railway:

Nếu có request từ Cursor, bạn sẽ thấy logs trong Railway:
- Session initialized
- Tool calls
- Requests/Responses

## Troubleshooting

### Lỗi: Cannot connect to MCP server

**Kiểm tra**:
1. URL có đúng không? (phải kết thúc `/v1/sse`)
2. Railway service có đang chạy không?
3. Có lỗi gì trong Railway logs không?

**Giải pháp**:
- Check Railway logs để xem có lỗi
- Test endpoint bằng curl
- Đảm bảo Cursor đã restart

### Lỗi: CORS

**Nguyên nhân**: Origin không được phép

**Giải pháp**:
Vào Railway → Settings → Variables, thêm:
```
MCP_ALLOWED_ORIGINS=https://cursor.sh,app://cursor
```

Hoặc để cho phép tất cả (chỉ dev):
```
MCP_ALLOWED_ORIGINS=*
```

### Lỗi: Cannot connect to Perplexica API

**Nguyên nhân**: `PERPLEXICA_BASE_URL` sai hoặc không accessible

**Giải pháp**:
1. Kiểm tra `PERPLEXICA_BASE_URL` trong Railway Variables
2. Test URL từ browser hoặc curl
3. Nếu Perplexica API cũng trên Railway, dùng internal service URL

### MCP tools không xuất hiện trong Cursor

**Giải pháp**:
1. Đảm bảo đã restart Cursor hoàn toàn
2. Check Cursor logs (Help → Toggle Developer Tools → Console)
3. Kiểm tra `mcp.json` có đúng format không

## Setup Custom Domain (Optional)

Nếu muốn dùng domain riêng:

1. Vào Railway → Settings → Networking
2. Click **"Custom Domain"**
3. Add domain của bạn
4. Railway sẽ cung cấp DNS records
5. Update `MCP_ALLOWED_HOSTS` và `MCP_ALLOWED_ORIGINS` với domain mới
6. Update Cursor config với domain mới

## Monitoring

### Xem Logs trên Railway:

1. Vào Railway Dashboard
2. Click vào service
3. Tab **Deployments** → Click deployment → Xem logs

### Metrics:

Railway cung cấp metrics tự động:
- CPU usage
- Memory usage
- Network traffic
- Request count

Xem trong tab **Metrics** của service.

## Quick Checklist

- [x] MCP server đã deploy lên Railway ✅
- [ ] Set `PERPLEXICA_BASE_URL` environment variable
- [ ] Test endpoint `/v1/sse` bằng curl
- [ ] Cấu hình Cursor với Railway URL
- [ ] Restart Cursor
- [ ] Test kết nối từ Cursor
- [ ] Verify MCP tools hoạt động

## Next Steps

Sau khi setup xong:

1. **Test các MCP tools**:
   - `perplexica_search` - Tìm kiếm AI-powered
   - `perplexica_chat` - Chat với AI
   - `perplexica_search_images` - Tìm kiếm hình ảnh
   - `perplexica_search_videos` - Tìm kiếm video

2. **Monitor usage**:
   - Xem logs trên Railway
   - Check metrics
   - Monitor costs

3. **Optimize**:
   - Setup custom domain nếu cần
   - Configure security headers
   - Setup alerts

## Tài liệu tham khảo

- Railway Dashboard: https://railway.app/
- Cursor MCP Docs: https://docs.cursor.com/mcp
- MCP Specification: https://modelcontextprotocol.io




