# Hướng dẫn Setup tiếp theo - Railway MCP Server

## ✅ Trạng thái hiện tại

- ✅ MCP server đã deploy lên Railway
- ✅ Cursor config đã được cập nhật (`~/.cursor/mcp.json`)
- ✅ Endpoint đang hoạt động: `https://perplexica-production-1bd4.up.railway.app/v1/sse`

## 🔧 Các bước tiếp theo

### Bước 1: Kiểm tra Environment Variables trên Railway

**QUAN TRỌNG**: Cần set `PERPLEXICA_BASE_URL` để MCP server có thể kết nối với Perplexica API.

1. Vào Railway Dashboard: https://railway.app/
2. Click vào service **Perplexica**
3. Vào **Settings** → **Variables**
4. Thêm biến môi trường:

```
PERPLEXICA_BASE_URL=https://your-perplexica-api.com
```

**Lưu ý**:
- Nếu Perplexica API cũng chạy trên Railway, có thể dùng internal service URL
- Nếu chạy local: `http://localhost:3000` (chỉ hoạt động nếu Railway có thể access được)
- Nếu chạy trên server khác: dùng public URL

### Bước 2: Restart Cursor hoàn toàn

**QUAN TRỌNG**: Phải restart Cursor để load config mới.

1. **Quit Cursor hoàn toàn**:
   - macOS: `Cmd + Q` hoặc Cursor → Quit Cursor
   - Windows: Alt + F4 hoặc File → Exit
   - Linux: Quit từ menu

2. **Mở lại Cursor**

3. **Kiểm tra MCP connection**:
   - Mở một chat mới
   - Cursor sẽ tự động kết nối với MCP server

### Bước 3: Kiểm tra MCP Tools có sẵn

Trong Cursor chat, thử hỏi:

```
What MCP tools are available from perplexica server?
```

Hoặc:

```
List all available MCP tools
```

Cursor sẽ liệt kê các tools có sẵn từ perplexica MCP server.

### Bước 4: Test MCP Tools

Thử sử dụng các tools:

#### 1. Search Tool
```
Use perplexica_search to search for "latest news today"
```

#### 2. Chat Tool
```
Use perplexica_chat to chat about "what is Perplexica?"
```

#### 3. Get Models
```
Use perplexica_get_models to get available models
```

#### 4. Get Config
```
Use perplexica_get_config to get server configuration
```

### Bước 5: Xem Logs trên Railway

Khi Cursor sử dụng MCP tools, bạn sẽ thấy logs trong Railway:

1. Vào Railway Dashboard
2. Click vào service **Perplexica**
3. Tab **Deployments** → Click deployment mới nhất
4. Xem logs:
   - `[MCP] Session initialized: <session-id>`
   - Tool calls và responses
   - Errors (nếu có)

## 🔍 Troubleshooting

### Vấn đề: Cursor không nhận diện MCP server

**Giải pháp**:
1. Đảm bảo đã restart Cursor hoàn toàn
2. Kiểm tra `~/.cursor/mcp.json` có đúng format không
3. Xem Cursor logs: Help → Toggle Developer Tools → Console
4. Tìm lỗi liên quan đến MCP

### Vấn đề: "Server not initialized" error

**Nguyên nhân**: SSE endpoint cần được initialize đúng cách từ client

**Giải pháp**: 
- Đây là bình thường khi test bằng curl
- Cursor sẽ tự động initialize khi kết nối
- Không cần lo lắng về lỗi này khi test bằng curl

### Vấn đề: CORS Error

**Giải pháp**: Thêm vào Railway Variables:

```
MCP_ALLOWED_ORIGINS=https://cursor.sh,app://cursor,*
```

### Vấn đề: Cannot connect to Perplexica API

**Nguyên nhân**: `PERPLEXICA_BASE_URL` sai hoặc không accessible

**Giải pháp**:
1. Kiểm tra `PERPLEXICA_BASE_URL` trong Railway Variables
2. Test URL từ browser hoặc curl
3. Đảm bảo Perplexica API đang chạy và accessible

### Vấn đề: MCP tools không hoạt động

**Giải pháp**:
1. Kiểm tra Railway logs để xem có lỗi gì không
2. Đảm bảo `PERPLEXICA_BASE_URL` đúng
3. Test endpoint bằng cách gọi tool trực tiếp
4. Xem Cursor console logs

## 📋 Checklist

- [x] MCP server đã deploy lên Railway ✅
- [x] Cursor config đã được cập nhật ✅
- [ ] Set `PERPLEXICA_BASE_URL` trên Railway
- [ ] Restart Cursor hoàn toàn
- [ ] Kiểm tra MCP tools có sẵn trong Cursor
- [ ] Test sử dụng MCP tools
- [ ] Xem logs trên Railway để verify

## 🎯 Các MCP Tools có sẵn

Sau khi setup xong, bạn có thể sử dụng:

1. **perplexica_search** - AI-powered search
   - Parameters: `query`, `focusMode` (webSearch, academicSearch, etc.)

2. **perplexica_chat** - Chat với AI
   - Parameters: `message`, `focusMode`

3. **perplexica_search_images** - Tìm kiếm hình ảnh
   - Parameters: `query`

4. **perplexica_search_videos** - Tìm kiếm video
   - Parameters: `query`

5. **perplexica_get_models** - Lấy danh sách models
   - No parameters

6. **perplexica_get_config** - Lấy config
   - No parameters

7. **perplexica_search_tools** - Tìm kiếm tools
   - Parameters: `query`, `detailLevel`

## 💡 Tips

1. **Monitor Logs**: Luôn xem logs trên Railway để debug
2. **Test từng tool**: Test từng tool một để đảm bảo hoạt động
3. **Check Environment Variables**: Đảm bảo tất cả env vars đã được set
4. **Restart khi cần**: Nếu có vấn đề, restart cả Cursor và Railway service

## 📚 Tài liệu tham khảo

- Railway Dashboard: https://railway.app/
- Cursor MCP Docs: https://docs.cursor.com/mcp
- MCP Specification: https://modelcontextprotocol.io





