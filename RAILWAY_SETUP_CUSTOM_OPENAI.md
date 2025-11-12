# Setup Custom OpenAI trên Railway

## Thông tin Custom OpenAI đã được cấu hình:

- **API Key**: `7864229fc2c1456691354b14fc0bf409.CVcNCXDV450XMBKI`
- **Model Name**: `glm-4.5`
- **Base URL**: `https://api.z.ai/api/coding/paas/v4`

## Cách 1: Setup qua Settings UI (Khuyến nghị)

1. **Truy cập web app**: `https://your-app.up.railway.app/settings`

2. **Vào Model Settings**:
   - Scroll xuống phần **Model Settings**
   - Trong **Chat Model Provider**, chọn **"Custom OpenAI"**

3. **Điền thông tin**:
   - **Custom OpenAI Model Name**: `glm-4.5`
   - **Custom OpenAI API Key**: `7864229fc2c1456691354b14fc0bf409.CVcNCXDV450XMBKI`
   - **Custom OpenAI Base URL**: `https://api.z.ai/api/coding/paas/v4`

4. **Save từng field**:
   - Click vào icon save (✓) bên cạnh mỗi field sau khi điền

5. **Reload page**:
   - Sau khi save, reload page (F5 hoặc Cmd+R)
   - Custom OpenAI sẽ có model `glm-4.5` và có thể sử dụng

## Cách 2: Setup qua Railway Environment Variables

Nếu muốn setup tự động khi deploy:

1. **Vào Railway Dashboard**:
   - Chọn project → Chọn Perplexica Web App service
   - Vào **Settings** → **Variables**

2. **Tạo file config.toml trên Railway**:
   
   Railway không hỗ trợ trực tiếp upload file config.toml, nhưng bạn có thể:
   
   - **Option A**: Sử dụng Railway's file system (nếu có)
   - **Option B**: Setup qua Settings UI (Cách 1 - Khuyến nghị)

## Cách 3: Tạo config.toml trong codebase (Không khuyến nghị)

⚠️ **Cảnh báo**: Không nên commit API key vào git!

Nếu muốn tự động setup, có thể:
1. Tạo script để generate config.toml từ environment variables
2. Hoặc sử dụng Settings UI (Cách 1)

## Kiểm tra sau khi setup:

1. **Vào Settings** → **Model Settings**
2. **Chọn Custom OpenAI** trong Chat Model Provider dropdown
3. **Kiểm tra**:
   - Model Name hiển thị: `glm-4.5`
   - Có thể chọn model `glm-4.5` trong Chat Model dropdown
4. **Test**: Thử chat một message để kiểm tra kết nối

## Troubleshooting:

### Lỗi: Cannot connect to Custom OpenAI

**Nguyên nhân**: 
- URL sai
- API key sai
- Model name sai

**Giải pháp**:
1. Kiểm tra Base URL: `https://api.z.ai/api/coding/paas/v4`
2. Kiểm tra API Key có đúng không
3. Kiểm tra Model Name: `glm-4.5`
4. Test API từ curl:
   ```bash
   curl https://api.z.ai/api/coding/paas/v4/chat/completions \
     -H "Authorization: Bearer 7864229fc2c1456691354b14fc0bf409.CVcNCXDV450XMBKI" \
     -H "Content-Type: application/json" \
     -d '{"model":"glm-4.5","messages":[{"role":"user","content":"test"}]}'
   ```

### Custom OpenAI không xuất hiện trong dropdown

**Giải pháp**:
1. Đảm bảo đã deploy code mới nhất (có fix Custom OpenAI)
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Kiểm tra console logs để xem có lỗi không

## Lưu ý:

- ✅ File `config.toml` đã được cấu hình local với thông tin trên
- ✅ Trên Railway, nên setup qua Settings UI (Cách 1)
- ✅ Sau khi setup, reload page để model xuất hiện
- ✅ API key đã được lưu trong `config.toml` local (không commit vào git)

