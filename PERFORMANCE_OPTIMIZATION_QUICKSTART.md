# ⚡ Quick Start: Tối ưu Perplexica để đạt Tốc độ x2

## 📊 Tóm tắt

**Hiện tại**: 6-13 giây cho một search request  
**Mục tiêu**: 3-6 giây (nhanh hơn x2)  
**Chi phí tăng**: ~$51/tháng  
**Thời gian implement**: 1-2 tuần

---

## 🚀 3 Bước Đơn giản để Tăng tốc x2

### Bước 1: Tăng Resources (5 phút) ⚡

**File**: `aws-cloudformation/perplexica-stack.yaml`

Tìm section `Mappings` → `InstanceTypeMap` → `production` và update:

```yaml
production:
  MCPCpu: 256
  MCPMemory: 512
  WebCpu: 1024        # Tăng từ 512 (x2)
  WebMemory: 2048     # Tăng từ 1024 (x2)
  SearXNGCpu: 512     # Tăng từ 256 (x2)
  SearXNGMemory: 1024 # Tăng từ 512 (x2)
```

**Deploy**:
```bash
cd aws-cloudformation
./deploy.sh production update
```

**Kết quả**: Giảm ~1.5-3 giây (25-40%)  
**Chi phí**: +$21/tháng

---

### Bước 2: Verify Parallel Processing (2 phút) ✅

**File**: `src/lib/search/metaSearchAgent.ts`

Kiểm tra xem code đã có parallel embedding generation chưa:

```typescript
// Tìm dòng này (khoảng dòng 395):
const [docEmbeddings, queryEmbedding] = await Promise.all([
  embeddings.embedDocuments(docs),
  embeddings.embedQuery(query)
]);
```

Nếu đã có → ✅ Done!  
Nếu chưa có → Cần implement (xem chi tiết trong PERFORMANCE_ANALYSIS_AWS.md)

**Kết quả**: Giảm ~0.5-1 giây (10-15%)  
**Chi phí**: $0

---

### Bước 3: Setup Redis Cache (30 phút) 💾

**Option A: Dùng script tự động**
```bash
cd aws-cloudformation
./optimize-performance.sh production setup-redis
```

**Option B: Manual setup**

1. **Thêm Redis vào CloudFormation** (`perplexica-stack.yaml`):

```yaml
Resources:
  RedisCache:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupDescription: Perplexica cache
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheClusters: 1
      AutomaticFailoverEnabled: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
```

2. **Deploy**:
```bash
./deploy.sh production update
```

3. **Update code để dùng Redis** (cần implement - xem chi tiết trong PERFORMANCE_ANALYSIS_AWS.md)

**Kết quả**: Giảm ~1-2.5 giây (15-25%) cho cached queries  
**Chi phí**: +$15/tháng

---

## 📈 Kết quả Mong đợi

Sau khi implement 3 bước trên:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Response Time** | 6-13s | **3-6s** | **50%** ✅ |
| **Monthly Cost** | $138-163 | $189-214 | +$51 |
| **User Experience** | Good | **Excellent** | ⭐⭐⭐⭐⭐ |

---

## 🔧 Tools & Scripts

### Monitor Performance
```bash
cd aws-cloudformation
./optimize-performance.sh production monitor
```

### Check Current Resources
```bash
./optimize-performance.sh production check
```

### Cost Estimation
```bash
./optimize-performance.sh production cost
```

---

## 📚 Tài liệu Chi tiết

- **[PERFORMANCE_ANALYSIS_AWS.md](./PERFORMANCE_ANALYSIS_AWS.md)** - Phân tích chi tiết và tất cả optimizations
- **[COST_ESTIMATION.md](./aws-cloudformation/COST_ESTIMATION.md)** - Chi tiết về chi phí
- **[MONITORING_GUIDE.md](./aws-cloudformation/MONITORING_GUIDE.md)** - Hướng dẫn monitoring

---

## ✅ Checklist

- [ ] **Bước 1**: Update CloudFormation với resources cao hơn
- [ ] **Bước 2**: Deploy updated stack
- [ ] **Bước 3**: Verify parallel processing
- [ ] **Bước 4**: Setup Redis cache (optional nhưng recommended)
- [ ] **Bước 5**: Monitor performance improvements
- [ ] **Bước 6**: Test với real queries

---

## 🆘 Troubleshooting

### Stack update failed?
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name production-perplexica \
  --max-items 10 \
  --region ap-southeast-1
```

### Services không start?
```bash
# Check ECS service status
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web \
  --region ap-southeast-1
```

### Performance không cải thiện?
- Check CloudWatch metrics
- Verify resources đã được update
- Check logs cho errors

---

## 💡 Tips

1. **Test từng bước**: Implement và test từng optimization một
2. **Monitor metrics**: Theo dõi CloudWatch metrics sau mỗi change
3. **Baseline first**: Ghi lại baseline metrics trước khi optimize
4. **User feedback**: Test với real users để verify improvements

---

## 🎯 Next Steps (Optional - Long-term)

Sau khi đạt được tốc độ x2, có thể tiếp tục optimize:

- **Database Migration**: SQLite → PostgreSQL (+$15/tháng)
- **VPC Endpoints**: Giảm NAT Gateway costs (+$7-14/tháng)
- **Auto Scaling**: Handle concurrent users tốt hơn
- **LLM Response Cache**: Cache similar queries (+$5/tháng)

Xem chi tiết trong [PERFORMANCE_ANALYSIS_AWS.md](./PERFORMANCE_ANALYSIS_AWS.md)

---

**Questions?** Check [PERFORMANCE_ANALYSIS_AWS.md](./PERFORMANCE_ANALYSIS_AWS.md) for detailed analysis.

