# 🔧 Troubleshooting Documentation

Tài liệu xử lý lỗi và sửa chữa các vấn đề thường gặp trong Perplexica.

## 📑 Nội dung

### Hướng dẫn chung
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** ⭐ - Hướng dẫn xử lý sự cố chung
- **[TROUBLESHOOTING_LLM.md](./TROUBLESHOOTING_LLM.md)** - Xử lý lỗi liên quan đến LLM

### Bug Fixes
- **[BUG_FIX_LANGCHAIN_TEMPLATE.md](./BUG_FIX_LANGCHAIN_TEMPLATE.md)** - Template và hướng dẫn sửa lỗi LangChain
- **[FIX_SUMMARY.md](./FIX_SUMMARY.md)** - Tổng hợp các fix đã thực hiện

### Lỗi LLM
- **[FIX_LLM_500_ERROR.md](./FIX_LLM_500_ERROR.md)** - Sửa lỗi 500 Internal Server Error từ LLM
- **[FIX_TIMEOUT_API.md](./FIX_TIMEOUT_API.md)** - Xử lý lỗi timeout của API
- **[FIX_TIMEOUT_30S.md](./FIX_TIMEOUT_30S.md)** - Xử lý lỗi timeout 30 giây

## 🔍 Tìm lỗi nhanh

### Theo loại lỗi

#### 🤖 LLM Errors
- **500 Error** → [FIX_LLM_500_ERROR.md](./FIX_LLM_500_ERROR.md)
- **Timeout** → [FIX_TIMEOUT_API.md](./FIX_TIMEOUT_API.md), [FIX_TIMEOUT_30S.md](./FIX_TIMEOUT_30S.md)
- **API Connection** → [TROUBLESHOOTING_LLM.md](./TROUBLESHOOTING_LLM.md)

#### 🔌 Connection Issues
- **API Connection Failed** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Timeout Errors** → [FIX_TIMEOUT_API.md](./FIX_TIMEOUT_API.md)

#### 🛠️ Development Issues
- **LangChain Errors** → [BUG_FIX_LANGCHAIN_TEMPLATE.md](./BUG_FIX_LANGCHAIN_TEMPLATE.md)

## 🚨 Common Issues

### 1. LLM 500 Error
**Triệu chứng**: API trả về lỗi 500 khi gọi LLM  
**Nguyên nhân**: 
- API key không hợp lệ
- Rate limit exceeded
- Model không khả dụng

**Giải pháp**: Xem chi tiết tại [FIX_LLM_500_ERROR.md](./FIX_LLM_500_ERROR.md)

### 2. Timeout Errors
**Triệu chứng**: Request timeout sau 30 giây  
**Nguyên nhân**:
- Query quá phức tạp
- LLM response chậm
- Network issues

**Giải pháp**: 
- [FIX_TIMEOUT_30S.md](./FIX_TIMEOUT_30S.md) - Tăng timeout limit
- [FIX_TIMEOUT_API.md](./FIX_TIMEOUT_API.md) - Optimize API calls

### 3. LangChain Template Errors
**Triệu chứng**: Lỗi format template trong LangChain  
**Nguyên nhân**: Template syntax không đúng

**Giải pháp**: [BUG_FIX_LANGCHAIN_TEMPLATE.md](./BUG_FIX_LANGCHAIN_TEMPLATE.md)

## 🔧 Quick Fixes

### Check Application Status
```bash
# Check if app is running
docker compose ps

# Check logs
docker compose logs -f

# Restart application
docker compose restart
```

### Check LLM Configuration
```bash
# Test LLM connection
curl http://localhost:3000/api/config

# Check available models
curl http://localhost:3000/api/models
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=perplexica:*

# Run with verbose output
npm run dev
```

## 📊 Diagnostic Steps

### Bước 1: Xác định vấn đề
1. Xem logs: `docker compose logs -f`
2. Kiểm tra error messages
3. Note down error codes và timestamps

### Bước 2: Tra cứu tài liệu
1. Tìm trong [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Check specific fix guides
3. Review [FIX_SUMMARY.md](./FIX_SUMMARY.md)

### Bước 3: Áp dụng fix
1. Follow hướng dẫn trong tài liệu
2. Test lại functionality
3. Monitor logs

### Bước 4: Verify fix
1. Run health checks
2. Test all features
3. Monitor for 24h

## 🆘 Escalation Path

### Nếu không tự fix được:

1. **Gather Information**
   - Error logs (last 100 lines)
   - System information
   - Steps to reproduce
   - Configuration files

2. **Check Resources**
   - [GitHub Issues](https://github.com/your-repo/issues)
   - [Documentation](../README.md)
   - [Community Forum](https://forum.example.com)

3. **Create Issue**
   - Use [BUG_FIX_LANGCHAIN_TEMPLATE.md](./BUG_FIX_LANGCHAIN_TEMPLATE.md) as template
   - Include all diagnostic information
   - Tag appropriately

## 📚 Related Documentation

- [Deployment Troubleshooting](../deployment/DEPLOYMENT_GUIDE.md#troubleshooting)
- [API Documentation](../API/)
- [Architecture](../architecture/)
- [Testing](../testing/)

## 💡 Tips

- **Enable verbose logging** để debug dễ hơn
- **Check logs regularly** để phát hiện vấn đề sớm
- **Document fixes** để tham khảo sau này
- **Update config** sau khi fix thành công

## 📝 Contributing

Nếu bạn fix được một lỗi mới:
1. Document fix trong file riêng
2. Update [FIX_SUMMARY.md](./FIX_SUMMARY.md)
3. Add to this README
4. Create PR với clear description

[← Quay lại Docs chính](../README.md)

