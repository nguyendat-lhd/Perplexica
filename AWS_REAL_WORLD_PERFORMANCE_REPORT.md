# 📊 Báo cáo Đánh giá Hiệu năng Thực tế trên AWS

**Ngày test**: $(date +%Y-%m-%d)  
**Environment**: Development  
**Instance**: t3.medium (2 vCPU, 4GB RAM)  
**Region**: ap-southeast-1 (Singapore)

---

## 🔍 Thông tin Infrastructure Thực tế

### Instance Details

| Metric | Value |
|--------|-------|
| **Instance Type** | t3.medium |
| **vCPU** | 2 |
| **Memory** | 4 GB |
| **Instance Lifecycle** | On-Demand |
| **Availability Zone** | ap-southeast-1a |
| **Public IP** | 13.228.19.21 |
| **Status** | Running |

### Services Running

- ✅ **Perplexica Web**: Port 3000 (Up 6+ hours)
- ✅ **SearXNG**: Port 4000 (Up 6+ hours)
- ✅ **MCP Server**: Port 3001

---

## ⏱️ Performance Test Results

### 1. Homepage Response Time

**Test**: `GET http://13.228.19.21:3000/`

| Metric | Value |
|--------|-------|
| **Response Time** | ~0.24s |
| **Connect Time** | ~0.09s |
| **Time to First Byte** | ~0.19s |
| **HTTP Status** | 200 OK |

**Đánh giá**: ✅ **Tốt** - Homepage load nhanh, không có vấn đề

---

### 2. Search API Performance

**Test**: `POST /api/search` với query "What is artificial intelligence?"

#### Kết quả Test:

| Metric | Value | Status |
|--------|-------|--------|
| **Response Time** | **>60s (Timeout)** | 🔴 **CRITICAL** |
| **Timeout Setting** | 60 seconds | - |
| **HTTP Status** | Timeout (không có response) | 🔴 |

**Phân tích**:
- ⚠️ **Request timeout sau 60 giây** - Đây là vấn đề nghiêm trọng
- Search request không hoàn thành trong thời gian hợp lý
- Có thể do:
  1. SearXNG search chậm
  2. Embedding generation mất nhiều thời gian
  3. LLM response generation chậm
  4. Network latency giữa các services

---

## 📈 So sánh với Phân tích Lý thuyết

### Phân tích Lý thuyết (PERFORMANCE_ANALYSIS_AWS.md)

| Component | Estimated Time |
|-----------|----------------|
| SearXNG Search | 1-2s |
| Embedding Generation | 1.2-3.5s |
| LLM Answer | 2-5s |
| **Total Estimated** | **6-13s** |

### Thực tế đo được

| Component | Actual Time |
|-----------|-------------|
| **Total Response** | **>60s (Timeout)** |
| **Status** | 🔴 **Không hoàn thành** |

**Kết luận**: 
- ⚠️ **Thực tế chậm hơn nhiều so với ước tính**
- Request không hoàn thành trong 60 giây
- Cần điều tra nguyên nhân cụ thể

---

## 🔴 Vấn đề Phát hiện

### 1. Search API Timeout

**Vấn đề**: Search request timeout sau 60 giây

**Nguyên nhân có thể**:
1. **SearXNG chậm hoặc không phản hồi**
   - SearXNG có thể đang rate-limited
   - Network latency cao
   - SearXNG instance không đủ resources

2. **Embedding Generation chậm**
   - Model embedding lớn
   - Single-threaded processing
   - Không có caching

3. **LLM Response chậm**
   - LLM provider (OpenAI/Anthropic) chậm
   - Large context window
   - Network latency đến LLM API

4. **Database queries chậm**
   - SQLite trên EFS có thể chậm
   - No connection pooling
   - Sequential queries

### 2. Resource Utilization

**Instance**: t3.medium (2 vCPU, 4GB RAM)

**Đánh giá**:
- ✅ **Đủ resources** cho development
- ⚠️ Có thể cần nhiều hơn cho production
- ⚠️ CPU/Memory có thể đang bottleneck khi có nhiều requests

---

## 💡 Đề xuất Khắc phục Ngay lập tức

### Priority 1: Debug và Fix Timeout Issue

#### 1. Kiểm tra SearXNG

```bash
# Test SearXNG trực tiếp
curl -s "http://13.228.19.21:4000/search?q=test&format=json" | jq '.results | length'
```

**Nếu SearXNG chậm**:
- Check SearXNG logs
- Verify SearXNG có đủ resources
- Check network connectivity

#### 2. Kiểm tra Logs

```bash
# SSH vào instance
ssh ubuntu@13.228.19.21

# Check Perplexica logs
docker logs perplexica-app-1 --tail 100

# Check SearXNG logs  
docker logs perplexica-searxng-1 --tail 100
```

#### 3. Test từng Component

**Test Embedding Generation**:
- Check xem embedding model có load được không
- Test embedding generation time

**Test LLM API**:
- Verify LLM API key có valid không
- Test LLM response time trực tiếp

### Priority 2: Optimize Performance

Sau khi fix timeout issue, implement các optimizations:

1. **Tăng Resources** (nếu cần)
   - Upgrade lên t3.large (4 vCPU, 8GB) nếu cần
   - Hoặc scale horizontally

2. **Implement Caching**
   - Redis cache cho embeddings
   - Cache SearXNG results

3. **Optimize Code**
   - Parallel embedding generation
   - Connection pooling
   - Batch processing

---

## 📋 Action Items

### Immediate (Ngay lập tức)

- [ ] **Debug timeout issue**
  - [ ] Check SearXNG logs
  - [ ] Check Perplexica logs
  - [ ] Test SearXNG API trực tiếp
  - [ ] Test LLM API connectivity
  - [ ] Check database queries

- [ ] **Identify root cause**
  - [ ] Measure time cho từng component
  - [ ] Check resource utilization
  - [ ] Monitor network latency

### Short-term (1-2 tuần)

- [ ] **Fix timeout issue**
- [ ] **Implement optimizations từ PERFORMANCE_ANALYSIS_AWS.md**
- [ ] **Setup monitoring** (CloudWatch dashboards)
- [ ] **Test với real queries**

### Long-term (1 tháng)

- [ ] **Database migration** (SQLite → PostgreSQL)
- [ ] **Redis caching**
- [ ] **Auto scaling setup**
- [ ] **Performance tuning**

---

## 🎯 Kết luận

### Hiện trạng

1. ✅ **Homepage**: Hoạt động tốt (~0.24s)
2. 🔴 **Search API**: **Timeout sau 60s** - Cần fix ngay
3. ⚠️ **Infrastructure**: t3.medium đủ cho development, có thể cần optimize

### So sánh với Mục tiêu

| Metric | Mục tiêu | Thực tế | Status |
|--------|----------|---------|--------|
| **Search Response** | 3-6s | >60s (timeout) | 🔴 **FAIL** |
| **Homepage Response** | <1s | 0.24s | ✅ **PASS** |

### Next Steps

1. **URGENT**: Debug và fix timeout issue
2. **HIGH**: Implement optimizations từ PERFORMANCE_ANALYSIS_AWS.md
3. **MEDIUM**: Setup monitoring và alerting
4. **LOW**: Long-term optimizations

---

## 📊 Metrics cần Monitor

### CloudWatch Metrics

1. **EC2 Metrics**
   - CPU Utilization (target: <70%)
   - Memory Utilization (target: <80%)
   - Network In/Out

2. **Application Metrics** (cần implement)
   - Search API response time
   - SearXNG response time
   - Embedding generation time
   - LLM API response time
   - Database query time

3. **Error Metrics**
   - Timeout rate
   - Error rate
   - Failed requests

---

## 🔧 Scripts để Debug

### 1. Test từng Component

```bash
# Test SearXNG
curl "http://13.228.19.21:4000/search?q=test&format=json"

# Test Perplexica API với timeout dài hơn
curl -X POST "http://13.228.19.21:3000/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","focusMode":"webSearch","stream":false}' \
  --max-time 120
```

### 2. Check Logs

```bash
# Perplexica logs
docker logs perplexica-app-1 --tail 200 -f

# SearXNG logs
docker logs perplexica-searxng-1 --tail 200 -f
```

### 3. Monitor Resources

```bash
# CPU/Memory usage
docker stats perplexica-app-1 perplexica-searxng-1

# System resources
htop  # hoặc top
```

---

## 📚 References

- [PERFORMANCE_ANALYSIS_AWS.md](./PERFORMANCE_ANALYSIS_AWS.md) - Phân tích chi tiết
- [PERFORMANCE_OPTIMIZATION_QUICKSTART.md](./PERFORMANCE_OPTIMIZATION_QUICKSTART.md) - Quick start guide
- [MONITORING_GUIDE.md](./aws-cloudformation/MONITORING_GUIDE.md) - Monitoring setup

---

**Lưu ý**: Báo cáo này dựa trên test thực tế ngày $(date +%Y-%m-%d). Performance có thể thay đổi tùy thuộc vào:
- Load hiện tại
- Network conditions
- LLM API response times
- SearXNG performance

**Recommendation**: Cần debug timeout issue ngay lập tức trước khi implement các optimizations khác.

