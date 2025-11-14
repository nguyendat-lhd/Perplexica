# 📊 Phân tích Hiệu năng Perplexica trên AWS

## Tổng quan

Báo cáo này phân tích tốc độ hiện tại của Perplexica trên AWS và đề xuất các giải pháp để tăng tốc độ **x2**.

**Ngày phân tích**: $(date)
**Kiến trúc hiện tại**: AWS ECS Fargate với ALB, NAT Gateway, EFS

---

## 🔍 Đánh giá Tốc độ Hiện tại

### 1. Cấu hình Infrastructure hiện tại

| Component | Spec | Chi phí/tháng |
|-----------|------|----------------|
| **Perplexica Web** | 0.5 vCPU, 1 GB RAM | ~$14 |
| **MCP Server** | 0.25 vCPU, 512 MB RAM | ~$7 |
| **SearXNG** | 0.25 vCPU, 512 MB RAM | ~$7 |
| **ALB** | Application Load Balancer | ~$23-28 |
| **NAT Gateway** | 2x (HA) | ~$71-80 |
| **EFS** | Bursting mode | ~$3-5 |

**Tổng chi phí**: ~$138-163/tháng (Production setup)

### 2. Thời gian xử lý một request điển hình

#### Luồng xử lý một search request:

```
1. Request đến ALB                    → ~50ms
2. ALB → Perplexica Web (ECS)         → ~20ms
3. Search Retriever Chain (LLM)       → ~500-1000ms ⚠️
4. SearXNG Search                     → ~1000-2000ms ⚠️
5. Generate Embeddings (query)        → ~200-500ms ⚠️
6. Generate Embeddings (documents)    → ~1000-3000ms ⚠️
7. Rerank Documents                   → ~100-300ms
8. LLM Answer Generation              → ~2000-5000ms ⚠️
9. Stream Response                    → ~500-1000ms
```

**Tổng thời gian ước tính**: **~6-13 giây** cho một search request hoàn chỉnh

#### Breakdown theo component:

| Bước | Thời gian | % tổng | Bottleneck? |
|------|-----------|--------|------------|
| SearXNG Search | 1-2s | 15-20% | ⚠️ Medium |
| Embedding Generation | 1.2-3.5s | 20-30% | ⚠️ **HIGH** |
| LLM Answer | 2-5s | 30-40% | ⚠️ **HIGH** |
| Network Latency | 0.5-1s | 8-10% | Low |
| Other Processing | 0.5-1s | 8-10% | Low |

### 3. Performance Bottlenecks chính

#### 🔴 **Critical Bottlenecks:**

1. **Embedding Generation (1.2-3.5s)**
   - Sequential processing: Query embedding → Document embeddings
   - Single-threaded embedding model
   - No caching cho embeddings
   - **Impact**: 20-30% tổng thời gian

2. **LLM Answer Generation (2-5s)**
   - Depends on LLM provider (OpenAI, Anthropic, etc.)
   - Large context window processing
   - Sequential token generation
   - **Impact**: 30-40% tổng thời gian

3. **SearXNG Search (1-2s)**
   - External API call
   - Network latency
   - Rate limiting có thể xảy ra
   - **Impact**: 15-20% tổng thời gian

#### 🟡 **Medium Bottlenecks:**

4. **Database Queries (SQLite trên EFS)**
   - EFS latency: ~1-2ms per operation
   - No connection pooling
   - Sequential queries
   - **Impact**: 5-10% tổng thời gian

5. **Network Latency giữa Services**
   - ALB → ECS: ~20ms
   - ECS → SearXNG: ~10-20ms
   - ECS → EFS: ~1-2ms
   - **Impact**: 8-10% tổng thời gian

#### 🟢 **Low Impact:**

6. **Request Routing (ALB)**
   - ALB processing: ~10-20ms
   - Path-based routing: Negligible
   - **Impact**: <2% tổng thời gian

---

## 🚀 Đề xuất Tối ưu để đạt Tốc độ x2

### Mục tiêu: Giảm từ **6-13 giây** xuống **3-6.5 giây** (nhanh hơn x2)

### 1. ⚡ Tăng Resources (Quick Win)

#### A. Tăng CPU/Memory cho Perplexica Web

**Hiện tại:**
- CPU: 0.5 vCPU
- Memory: 1 GB

**Đề xuất:**
- CPU: **1 vCPU** (tăng x2)
- Memory: **2 GB** (tăng x2)

**Lợi ích:**
- Parallel processing tốt hơn
- Faster embedding generation
- Better LLM response handling
- **Giảm thời gian**: ~20-30% (1-2 giây)

**Chi phí tăng**: ~$14/tháng → ~$28/tháng (+$14)

#### B. Tăng CPU cho SearXNG

**Hiện tại:**
- CPU: 0.25 vCPU
- Memory: 512 MB

**Đề xuất:**
- CPU: **0.5 vCPU** (tăng x2)
- Memory: **1 GB** (tăng x2)

**Lợi ích:**
- Faster search processing
- Better concurrent request handling
- **Giảm thời gian**: ~10-15% (0.5-1 giây)

**Chi phí tăng**: ~$7/tháng → ~$14/tháng (+$7)

**Tổng chi phí tăng**: +$21/tháng

---

### 2. 🔄 Parallel Processing

#### A. Parallel Embedding Generation

**Hiện tại:**
```typescript
// Sequential
const queryEmbedding = await embeddings.embedQuery(query);
const docEmbeddings = await embeddings.embedDocuments(docs);
```

**Đề xuất:**
```typescript
// Parallel
const [queryEmbedding, docEmbeddings] = await Promise.all([
  embeddings.embedQuery(query),
  embeddings.embedDocuments(docs)
]);
```

**Lợi ích:**
- Giảm thời gian embedding từ 1.2-3.5s → 1-2s
- **Giảm thời gian**: ~0.5-1 giây (15-20%)

**Implementation**: Đã có trong code nhưng cần verify

#### B. Parallel SearXNG Requests

**Hiện tại:**
- Single SearXNG request per query

**Đề xuất:**
- Nếu query phức tạp, split thành multiple queries và search parallel
- Combine results sau

**Lợi ích:**
- Giảm thời gian search từ 1-2s → 0.8-1.5s
- **Giảm thời gian**: ~0.2-0.5 giây (5-10%)

---

### 3. 💾 Caching Strategy

#### A. Embedding Cache

**Hiện tại:**
- No caching cho embeddings
- Mỗi request phải generate lại embeddings

**Đề xuất:**
- Cache embeddings cho documents đã search
- Cache key: Document content hash
- TTL: 24 hours

**Implementation:**
```typescript
// Redis hoặc in-memory cache
const cacheKey = hashDocument(doc.content);
const cachedEmbedding = await cache.get(cacheKey);
if (cachedEmbedding) {
  return cachedEmbedding;
}
const embedding = await embeddings.embedDocuments([doc]);
await cache.set(cacheKey, embedding, { ttl: 86400 });
```

**Lợi ích:**
- Giảm embedding time từ 1.2-3.5s → 0.3-1s (cho cached docs)
- **Giảm thời gian**: ~0.5-1.5 giây (10-20%) cho repeat queries

**Chi phí**: Redis ElastiCache t2.micro: ~$15/tháng

#### B. SearXNG Result Cache

**Hiện tại:**
- In-memory cache với TTL 30 giây
- Chỉ cache trong process

**Đề xuất:**
- Redis cache với TTL 5 phút
- Shared cache across all instances

**Lợi ích:**
- Giảm SearXNG calls
- **Giảm thời gian**: ~0.5-1 giây (10-15%) cho cached queries

#### C. LLM Response Cache

**Đề xuất:**
- Cache LLM responses cho similar queries
- Use semantic similarity để match queries
- TTL: 1 hour

**Lợi ích:**
- **Giảm thời gian**: ~2-4 giây (30-40%) cho similar queries

---

### 4. 🗄️ Database Optimization

#### A. Migrate từ SQLite sang PostgreSQL (RDS)

**Hiện tại:**
- SQLite trên EFS
- Single file database
- No connection pooling
- EFS latency: ~1-2ms

**Đề xuất:**
- PostgreSQL trên RDS (db.t3.micro)
- Connection pooling (pgBouncer)
- Better concurrent access
- Lower latency: ~0.5ms

**Lợi ích:**
- Faster queries: ~50% improvement
- Better concurrency
- **Giảm thời gian**: ~0.2-0.5 giây (5-10%)

**Chi phí**: RDS db.t3.micro: ~$15/tháng

#### B. Database Indexing

**Đề xuất:**
- Add indexes cho frequently queried columns
- Optimize query patterns

**Lợi ích:**
- **Giảm thời gian**: ~0.1-0.3 giây (2-5%)

---

### 5. 🌐 Network Optimization

#### A. VPC Endpoints cho AWS Services

**Hiện tại:**
- Traffic đi qua NAT Gateway
- Latency: ~10-20ms

**Đề xuất:**
- VPC Endpoints cho S3, ECR, CloudWatch
- PrivateLink cho các services
- Direct connection, không qua NAT

**Lợi ích:**
- Giảm latency: ~5-10ms
- **Giảm thời gian**: ~0.1-0.2 giây (2-3%)

**Chi phí**: VPC Endpoints: ~$7.20/tháng per endpoint

#### B. Connection Pooling

**Đề xuất:**
- HTTP connection pooling cho SearXNG
- Keep-alive connections
- Reuse connections

**Lợi ích:**
- Giảm connection overhead
- **Giảm thời gian**: ~0.1-0.2 giây (2-3%)

---

### 6. ⚙️ Code Optimization

#### A. Optimize Embedding Batch Size

**Hiện tại:**
- Batch size: 512 (default)

**Đề xuất:**
- Tune batch size dựa trên memory available
- Larger batches = fewer API calls

**Lợi ích:**
- **Giảm thời gian**: ~0.2-0.5 giây (5-10%)

#### B. Early Return cho Simple Queries

**Đề xuất:**
- Detect simple queries (factual, definition)
- Skip reranking, return top results directly
- Use "speed" optimization mode

**Lợi ích:**
- **Giảm thời gian**: ~1-2 giây (15-25%) cho simple queries

#### C. Streaming Response Optimization

**Đề xuất:**
- Start streaming ngay khi có first chunk
- Don't wait for full response

**Lợi ích:**
- Perceived performance improvement
- **Giảm perceived time**: ~1-2 giây

---

### 7. 📈 Auto Scaling

#### A. Horizontal Scaling

**Hiện tại:**
- Single instance mỗi service
- No auto scaling

**Đề xuất:**
- Auto scaling based on CPU/Memory
- Min: 1, Max: 5 instances
- Target: 70% CPU

**Lợi ích:**
- Better handling concurrent requests
- **Giảm thời gian**: ~20-30% khi có nhiều requests

**Chi phí**: Tăng theo usage (pay-per-use)

---

## 📋 Tổng hợp Đề xuất theo Priority

### 🥇 **Priority 1: Quick Wins (Implement ngay)**

1. ✅ **Tăng Resources** (CPU/Memory)
   - Perplexica Web: 0.5 → 1 vCPU, 1GB → 2GB
   - SearXNG: 0.25 → 0.5 vCPU, 512MB → 1GB
   - **Giảm thời gian**: ~1.5-3 giây (25-40%)
   - **Chi phí**: +$21/tháng

2. ✅ **Parallel Embedding Generation**
   - Code change đơn giản
   - **Giảm thời gian**: ~0.5-1 giây (10-15%)
   - **Chi phí**: $0

3. ✅ **Optimize Batch Size**
   - Tune embedding batch size
   - **Giảm thời gian**: ~0.2-0.5 giây (5-10%)
   - **Chi phí**: $0

**Tổng giảm thời gian Priority 1**: ~2.2-4.5 giây (35-55%)
**Tổng chi phí**: +$21/tháng

---

### 🥈 **Priority 2: Medium Impact (Implement sau 1-2 tuần)**

4. ✅ **Redis Caching**
   - Embedding cache
   - SearXNG result cache
   - **Giảm thời gian**: ~1-2.5 giây (15-25%) cho cached queries
   - **Chi phí**: +$15/tháng (ElastiCache)

5. ✅ **Database Migration**
   - SQLite → PostgreSQL (RDS)
   - **Giảm thời gian**: ~0.2-0.5 giây (5-10%)
   - **Chi phí**: +$15/tháng (RDS)

6. ✅ **Connection Pooling**
   - HTTP connection reuse
   - **Giảm thời gian**: ~0.1-0.2 giây (2-3%)
   - **Chi phí**: $0

**Tổng giảm thời gian Priority 2**: ~1.3-3.2 giây (20-40%)
**Tổng chi phí**: +$30/tháng

---

### 🥉 **Priority 3: Long-term Optimization (Implement sau 1 tháng)**

7. ✅ **VPC Endpoints**
   - Reduce NAT Gateway traffic
   - **Giảm thời gian**: ~0.1-0.2 giây (2-3%)
   - **Chi phí**: +$7-14/tháng

8. ✅ **Auto Scaling**
   - Handle concurrent requests
   - **Giảm thời gian**: ~20-30% khi có nhiều users
   - **Chi phí**: Pay-per-use

9. ✅ **LLM Response Cache**
   - Cache similar queries
   - **Giảm thời gian**: ~2-4 giây (30-40%) cho cached queries
   - **Chi phí**: +$5/tháng (storage)

**Tổng giảm thời gian Priority 3**: ~2.3-4.4 giây (35-55%)
**Tổng chi phí**: +$12-19/tháng

---

## 🎯 Kết quả Mong đợi

### Scenario: Implement Priority 1 + Priority 2

**Thời gian hiện tại**: 6-13 giây
**Thời gian sau tối ưu**: **3-6 giây** ✅ (nhanh hơn x2)

**Breakdown:**

| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| SearXNG Search | 1-2s | 0.8-1.5s | 20-25% |
| Embedding Generation | 1.2-3.5s | 0.5-1.5s | 50-60% |
| LLM Answer | 2-5s | 1.5-3s | 25-40% |
| Database Queries | 0.3-0.5s | 0.1-0.2s | 50-60% |
| Network Latency | 0.5-1s | 0.3-0.5s | 40-50% |
| **TOTAL** | **6-13s** | **3-6s** | **50%** ✅ |

### Chi phí tăng:

**Hiện tại**: ~$138-163/tháng
**Sau tối ưu**: ~$189-214/tháng (+$51/tháng)

**ROI**: 
- Tốc độ tăng x2
- User experience tốt hơn đáng kể
- Có thể handle nhiều concurrent users hơn

---

## 📝 Implementation Plan

### Week 1: Quick Wins

1. **Day 1-2**: Tăng resources trong CloudFormation
   - Update `perplexica-stack.yaml`
   - Deploy updated stack
   - Monitor performance

2. **Day 3-4**: Implement parallel embedding generation
   - Verify code đã có parallel processing
   - Test và optimize

3. **Day 5**: Tune batch sizes
   - Test different batch sizes
   - Find optimal value

### Week 2-3: Medium Impact

4. **Week 2**: Setup Redis caching
   - Deploy ElastiCache
   - Implement embedding cache
   - Implement SearXNG cache

5. **Week 3**: Database migration
   - Setup RDS PostgreSQL
   - Migrate data
   - Update connection strings

### Month 2: Long-term

6. **Month 2**: VPC Endpoints, Auto Scaling, LLM Cache

---

## 🔧 Configuration Changes

### 1. Update CloudFormation Template

```yaml
# perplexica-stack.yaml
Mappings:
  InstanceTypeMap:
    production:
      WebCpu: 1024      # Tăng từ 512
      WebMemory: 2048    # Tăng từ 1024
      SearXNGCpu: 512    # Tăng từ 256
      SearXNGMemory: 1024 # Tăng từ 512
```

### 2. Add Redis Cache

```yaml
# Thêm vào CloudFormation
RedisCache:
  Type: AWS::ElastiCache::ReplicationGroup
  Properties:
    ReplicationGroupDescription: Perplexica cache
    CacheNodeType: cache.t3.micro
    Engine: redis
    NumCacheClusters: 1
```

### 3. Add RDS Database

```yaml
# Thêm vào CloudFormation
PerplexicaDB:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceClass: db.t3.micro
    Engine: postgres
    EngineVersion: '15.4'
    AllocatedStorage: 20
```

---

## 📊 Monitoring & Validation

### Metrics để theo dõi:

1. **Response Time**
   - P50, P95, P99 latencies
   - Target: P95 < 5s

2. **Throughput**
   - Requests per second
   - Concurrent users

3. **Resource Utilization**
   - CPU, Memory usage
   - Target: 60-70% average

4. **Cache Hit Rate**
   - Embedding cache hit rate
   - SearXNG cache hit rate
   - Target: >50%

### CloudWatch Dashboards:

- Response time trends
- Cache performance
- Resource utilization
- Error rates

---

## ✅ Checklist Implementation

### Priority 1 (Week 1)
- [ ] Update CloudFormation với resources cao hơn
- [ ] Deploy updated stack
- [ ] Verify parallel embedding generation
- [ ] Tune batch sizes
- [ ] Monitor performance improvements

### Priority 2 (Week 2-3)
- [ ] Setup ElastiCache Redis
- [ ] Implement embedding cache
- [ ] Implement SearXNG cache
- [ ] Setup RDS PostgreSQL
- [ ] Migrate database
- [ ] Implement connection pooling

### Priority 3 (Month 2)
- [ ] Setup VPC Endpoints
- [ ] Configure auto scaling
- [ ] Implement LLM response cache
- [ ] Monitor và optimize

---

## 🎓 Best Practices

1. **Monitor trước khi optimize**
   - Baseline metrics
   - Identify real bottlenecks

2. **Test từng optimization**
   - Don't implement tất cả cùng lúc
   - Measure impact của từng change

3. **Cost vs Performance**
   - Balance giữa cost và performance
   - ROI analysis

4. **User Experience**
   - Focus on perceived performance
   - Streaming responses
   - Progressive loading

---

## 📚 References

- [AWS ECS Performance Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/performance.html)
- [CloudFormation Template](./aws-cloudformation/perplexica-stack.yaml)
- [Cost Estimation](./aws-cloudformation/COST_ESTIMATION.md)
- [Monitoring Guide](./aws-cloudformation/MONITORING_GUIDE.md)

---

**Kết luận**: Với việc implement Priority 1 và Priority 2, bạn có thể đạt được tốc độ **nhanh hơn x2** với chi phí tăng ~$51/tháng. Đây là investment hợp lý cho significant performance improvement.

