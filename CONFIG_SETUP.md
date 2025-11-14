# 🔐 Hướng dẫn Setup Config.toml

## Vấn đề đã được giải quyết

✅ **config.toml đã được thêm vào .gitignore**  
✅ **File không còn được track trong git**  
✅ **Bạn có thể điền credentials mà không lo commit lên GitHub**

---

## 📝 Cách sử dụng

### 1. File config.toml

File `config.toml` trong thư mục root là **local config** của bạn:
- ✅ Chứa credentials (API keys, secrets)
- ✅ **KHÔNG được commit lên git**
- ✅ Mỗi developer có thể có config riêng

### 2. File sample.config.toml

File `sample.config.toml` là template:
- ✅ Được commit lên git
- ✅ Không có credentials
- ✅ Dùng làm mẫu cho developers mới

---

## 🚀 Setup cho Developer mới

### Bước 1: Copy sample config

```bash
cp sample.config.toml config.toml
```

### Bước 2: Điền credentials vào config.toml

Mở `config.toml` và điền các API keys cần thiết:

```toml
[MODELS.BEDROCK]
ACCESS_KEY_ID = "your-access-key"
SECRET_ACCESS_KEY = "your-secret-key"
REGION = "ap-southeast-1"

[MODELS.OPENAI]
API_KEY = "your-openai-key"

# ... các models khác
```

### Bước 3: Verify

```bash
# Check xem config.toml có trong git không
git status config.toml

# Nếu thấy "Untracked files" hoặc không thấy gì → ✅ OK
# Nếu thấy "modified" → ⚠️ Cần check .gitignore
```

---

## 🔒 Security Best Practices

### ✅ DO (Nên làm)

1. **Luôn dùng sample.config.toml làm template**
2. **Điền credentials vào config.toml local**
3. **Không commit config.toml lên git**
4. **Dùng environment variables cho production** (nếu có thể)

### ❌ DON'T (Không nên)

1. ❌ **KHÔNG commit config.toml có credentials**
2. ❌ **KHÔNG share credentials qua chat/email**
3. ❌ **KHÔNG hardcode credentials trong code**

---

## 🐛 Troubleshooting

### Vấn đề: Config không được load

**Nguyên nhân**: File config.toml không tồn tại hoặc sai format

**Giải pháp**:
```bash
# Copy từ sample
cp sample.config.toml config.toml

# Verify format
cat config.toml
```

### Vấn đề: Git vẫn track config.toml

**Nguyên nhân**: File đã được track trước khi thêm vào .gitignore

**Giải pháp**:
```bash
# Remove từ git index (nhưng giữ file local)
git rm --cached config.toml

# Verify
git status config.toml
# Nên thấy "Untracked files" hoặc không thấy gì
```

### Vấn đề: Không chọn được Bedrock trong UI

**Nguyên nhân**: Config.toml không có Bedrock credentials hoặc sai format

**Giải pháp**:
1. Check file config.toml có section `[MODELS.BEDROCK]` không
2. Verify credentials đúng format:
   ```toml
   [MODELS.BEDROCK]
   ACCESS_KEY_ID = "AKIA..."
   SECRET_ACCESS_KEY = "your-secret-key"
   REGION = "ap-southeast-1"
   ```
3. Restart application sau khi update config

---

## 📋 Checklist

- [ ] ✅ config.toml đã được thêm vào .gitignore
- [ ] ✅ File config.toml local có credentials
- [ ] ✅ Git không track config.toml (check `git status`)
- [ ] ✅ sample.config.toml được commit (không có credentials)
- [ ] ✅ Application có thể load config và chọn Bedrock

---

## 🔄 Update Config

Khi cần update config:

1. **Update sample.config.toml** (nếu thêm fields mới)
2. **Update config.toml local** với credentials của bạn
3. **Commit sample.config.toml** (không commit config.toml)

---

## 💡 Tips

1. **Backup config.toml**: Nên backup config.toml local của bạn
2. **Use environment variables**: Cho production, nên dùng env vars thay vì file
3. **Rotate credentials**: Định kỳ rotate API keys để bảo mật

---

## 📚 Related Files

- `config.toml` - Local config (không commit)
- `sample.config.toml` - Template (được commit)
- `.gitignore` - Đã có `config.toml`

---

**Lưu ý**: File config.toml hiện tại đã có Bedrock credentials và sẽ không được commit lên git. Bạn có thể sử dụng ngay!

