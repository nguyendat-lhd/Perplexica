# Cost Estimation cho Perplexica AWS Deployment

**Region: Singapore (ap-southeast-1)**

## Chi phí ước tính hàng tháng

### 1. Container Hosting - Fargate vs EC2

#### Option A: ECS Fargate (Serverless)

| Service | vCPU | Memory | Giờ/tháng | Chi phí (Singapore) |
|---------|------|--------|-----------|---------------------|
| MCP Server (0.25 vCPU, 512 MB) | 0.25 | 0.5 GB | 730 | ~$8.03 |
| Perplexica Web (0.5 vCPU, 1 GB) | 0.5 | 1 GB | 730 | ~$16.06 |
| SearXNG (0.25 vCPU, 512 MB) | 0.25 | 0.5 GB | 730 | ~$8.03 |
| **Tổng Fargate** | | | | **~$32.12** |

*Giá Singapore: ~$0.044/vCPU-hour + $0.0044/GB-hour*

**Ưu điểm Fargate:**
- ✅ Không cần quản lý EC2 instances
- ✅ Auto-scaling dễ dàng
- ✅ Pay-per-use (chỉ trả cho resources dùng)
- ✅ Không cần patching, updates

**Nhược điểm:**
- ❌ Chi phí cao hơn EC2
- ❌ Không thể tối ưu instance size

#### Option B: ECS trên EC2 (Rẻ hơn cho Dev) ✅

**Tổng workload:** 1 vCPU, 2 GB RAM (có thể chạy tất cả 3 services trên 1 instance)

**Option B1: t3.small EC2 Instance**

| Component | Spec | Chi phí/tháng |
|-----------|------|---------------|
| **t3.small On-Demand** | 2 vCPU, 2 GB RAM | ~$15.18 |
| **t3.small Spot** | 2 vCPU, 2 GB RAM | ~$4.53 (70% discount) |
| EBS Storage (30GB gp3) | 30 GB | ~$3.00 |
| **Tổng EC2 (On-Demand)** | | **~$18.18** |
| **Tổng EC2 (Spot)** | | **~$7.53** |

*Giá Singapore: t3.small ~$0.0208/hour (On-Demand), ~$0.0062/hour (Spot)*

**Option B2: t3.medium EC2 Instance** (nhiều headroom hơn)

| Component | Spec | Chi phí/tháng |
|-----------|------|---------------|
| **t3.medium On-Demand** | 2 vCPU, 4 GB RAM | ~$30.37 |
| **t3.medium Spot** | 2 vCPU, 4 GB RAM | ~$9.13 (70% discount) |
| EBS Storage (30GB gp3) | 30 GB | ~$3.00 |
| **Tổng EC2 (On-Demand)** | | **~$33.37** |
| **Tổng EC2 (Spot)** | | **~$12.13** |

*Giá Singapore: t3.medium ~$0.0416/hour (On-Demand), ~$0.0125/hour (Spot)*

**So sánh Fargate vs EC2:**

| Option | Chi phí/tháng | Tiết kiệm | Phù hợp |
|--------|---------------|-----------|---------|
| **Fargate** | $32.12 | - | Production, Auto-scaling |
| **EC2 t3.small On-Demand** | $18.18 | **~$14** (44%) | Dev/Staging |
| **EC2 t3.small Spot** | $7.53 | **~$25** (77%) | Dev (có thể bị interrupt) |
| **EC2 t3.medium On-Demand** | $33.37 | -$1.25 | Production (nhiều RAM) |
| **EC2 t3.medium Spot** | $12.13 | **~$20** (62%) | Dev (nhiều RAM) |

**Khuyến nghị cho Dev:**
- ✅ **EC2 t3.small Spot**: ~$7.53/tháng (rẻ nhất, tiết kiệm 77%)
- ✅ **EC2 t3.small On-Demand**: ~$18.18/tháng (ổn định hơn, tiết kiệm 44%)

**Khuyến nghị cho Production:**
- ✅ **Fargate**: Dễ quản lý, auto-scaling tốt
- ✅ **EC2 Reserved Instance**: Nếu commit lâu dài, có thể rẻ hơn Fargate

**Lưu ý về EC2:**
- ⚠️ Cần quản lý EC2 instance (patching, updates, monitoring)
- ⚠️ Spot instances có thể bị interrupt (AWS sẽ cảnh báo 2 phút trước)
- ⚠️ Cần setup ECS cluster và container instances
- ✅ Có thể dùng Auto Scaling Group để tự động replace nếu Spot bị interrupt

### 2. Application Load Balancer

- **Base cost**: ~$17.82/tháng (Singapore)
- **LCU (Load Balancer Capacity Units)**: ~$5-10/tháng (tùy traffic)
- **Tổng ALB**: **~$23-28/tháng**

### 3. NAT Solution - So sánh cho Dev Environment

#### Option A: NAT Gateway (Không khuyến nghị cho Dev)

- **Per NAT Gateway**: ~$35.64/tháng (Singapore)
- **Data Processing**: ~$0.0495/GB (Singapore)
- **Tổng NAT Gateway (1x)**: **~$36-40/tháng** (tùy traffic)
- **Tổng NAT Gateway (2x)**: **~$71-80/tháng** (HA)

**Nhược điểm cho Dev:**
- Chi phí cao nhất
- Không thể tắt khi không dùng
- Phải trả phí 24/7

#### Option B: NAT Instance (Khuyến nghị cho Dev) ✅

**t3.nano NAT Instance:**
- **Instance cost**: ~$0.0052/giờ = **~$3.74/tháng** (Singapore)
- **EBS Storage (8GB gp3)**: ~$0.80/tháng
- **Elastic IP**: Free (khi attach với instance)
- **Data Transfer**: Standard AWS data transfer rates
- **Tổng NAT Instance**: **~$4.50-6/tháng** (tùy traffic)

**t3.micro NAT Instance (nếu cần nhiều bandwidth hơn):**
- **Instance cost**: ~$0.0116/giờ = **~$8.35/tháng** (Singapore)
- **EBS Storage (8GB gp3)**: ~$0.80/tháng
- **Tổng**: **~$9-11/tháng**

**Ưu điểm NAT Instance cho Dev:**
- ✅ **Rẻ hơn ~85-90%** so với NAT Gateway
- ✅ Có thể **stop/start** khi không dùng (chỉ trả EBS storage)
- ✅ Đủ cho dev/testing workloads
- ✅ Có thể tự động start/stop theo schedule

**Nhược điểm:**
- ⚠️ Cần tự quản lý (updates, monitoring)
- ⚠️ Không có SLA như NAT Gateway
- ⚠️ Bandwidth thấp hơn (t3.nano: ~5 Gbps, t3.micro: ~5 Gbps)
- ⚠️ Single point of failure (không có HA)

**Khuyến nghị cho Dev:**
- ✅ Dùng **t3.nano NAT Instance** (đủ cho dev)
- ✅ Setup **auto start/stop** schedule (chỉ chạy giờ làm việc)
- ✅ **Tiết kiệm**: ~$30-35/tháng so với NAT Gateway

### 4. EFS (Elastic File System)

- **Storage**: ~$0.33/GB/tháng (Singapore)
- **Giả sử**: 10 GB storage = **~$3.30/tháng**
- **Data Transfer**: ~$0.011/GB (in), ~$0.011/GB (out)
- **Tổng EFS**: **~$3-5/tháng**

### 5. ECR (Elastic Container Registry)

- **Storage**: ~$0.11/GB/tháng (Singapore)
- **Data Transfer**: Free (trong cùng region)
- **Giả sử**: 5 GB images = **~$0.55/tháng**

### 6. CloudWatch Logs

- **Ingestion**: ~$0.55/GB (Singapore)
- **Storage**: ~$0.033/GB/tháng
- **Giả sử**: 5 GB logs/tháng = **~$2.75/tháng**

### 7. Data Transfer

- **Out to Internet**: ~$0.099/GB (Singapore, first 10 TB)
- **Giả sử**: 50 GB/tháng = **~$4.95/tháng**
- **Inter-AZ**: ~$0.011/GB = **~$1.10/tháng**
- **Tổng Data Transfer**: **~$6-11/tháng**

### 8. VPC & Networking

- **VPC**: Free
- **Subnets**: Free
- **Security Groups**: Free
- **Internet Gateway**: Free
- **Elastic IPs**: Free (khi attach với NAT Gateway)
- **Tổng**: **$0**

### 9. CloudFormation

- **Free** (không tính phí)

## Tổng chi phí ước tính (Singapore Region)

### Scenario 1: Production với NAT Gateway (2x)

| Component | Chi phí/tháng |
|-----------|---------------|
| ECS Fargate | $32.12 |
| ALB | $23-28 |
| NAT Gateway (2x) | $71-80 |
| EFS | $3-5 |
| ECR | $0.55 |
| CloudWatch | $2.75 |
| Data Transfer | $6-11 |
| **TỔNG** | **~$138-163/tháng** |

### Scenario 2: Dev với NAT Instance + Fargate

| Component | Chi phí/tháng |
|-----------|---------------|
| ECS Fargate | $32.12 |
| ALB | $23-28 |
| NAT Instance (t3.nano) | $4.50-6 |
| EFS | $3-5 |
| ECR | $0.55 |
| CloudWatch | $2.75 |
| Data Transfer | $6-11 |
| **TỔNG** | **~$72-87/tháng** |

**Tiết kiệm: ~$66-76/tháng** so với NAT Gateway (2x)

### Scenario 2B: Dev với NAT Instance + EC2 (Rẻ nhất) ✅✅

| Component | Chi phí/tháng |
|-----------|---------------|
| ECS trên EC2 (t3.small Spot) | $7.53 |
| ALB | $23-28 |
| NAT Instance (t3.nano) | $4.50-6 |
| EFS | $3-5 |
| ECR | $0.55 |
| CloudWatch | $2.75 |
| Data Transfer | $6-11 |
| **TỔNG** | **~$48-58/tháng** |

**Tiết kiệm: ~$90-100/tháng** so với Production setup (NAT Gateway + Fargate)

### Scenario 3: Dev với NAT Instance + EC2 + Auto Start/Stop (Tối ưu nhất) ✅✅✅

Nếu setup auto start/stop cho cả NAT Instance và EC2 (chỉ chạy 8h/ngày, 22 ngày/tháng):

- **NAT Instance runtime**: 8h × 22 days = 176 giờ/tháng
- **NAT Instance cost**: ~$0.0052 × 176 = **~$0.92/tháng**
- **EC2 Spot runtime**: 8h × 22 days = 176 giờ/tháng
- **EC2 Spot cost**: ~$0.0062 × 176 = **~$1.09/tháng**
- **EBS Storage**: ~$0.80/tháng (NAT) + ~$3/tháng (EC2) = **~$3.80/tháng** (luôn trả)

| Component | Chi phí/tháng |
|-----------|---------------|
| ECS trên EC2 (t3.small Spot, auto stop) | $1.09 |
| ALB | $23-28 |
| NAT Instance (auto stop/start) | $1.72 |
| EBS Storage | $3.80 |
| EFS | $3-5 |
| ECR | $0.55 |
| CloudWatch | $2.75 |
| Data Transfer | $6-11 |
| **TỔNG** | **~$42-57/tháng** |

**Tiết kiệm: ~$96-106/tháng** so với Production setup (NAT Gateway + Fargate)

## Cost Optimization Strategies (Singapore Region)

### 1. Dùng EC2 thay vì Fargate cho Dev (Tiết kiệm ~$14-25/tháng) ✅✅

**Khuyến nghị cho Dev Environment:**

**Option A: EC2 t3.small Spot**
- Chi phí: ~$7.53/tháng (chạy 24/7)
- Tiết kiệm: ~$25/tháng so với Fargate (77%)
- ⚠️ Có thể bị interrupt (AWS cảnh báo 2 phút trước)
- ✅ Có thể setup Auto Scaling Group để tự động replace

**Option B: EC2 t3.small On-Demand**
- Chi phí: ~$18.18/tháng (chạy 24/7)
- Tiết kiệm: ~$14/tháng so với Fargate (44%)
- ✅ Ổn định, không bị interrupt
- ✅ Phù hợp cho dev/staging

**Option C: EC2 với Auto Start/Stop**
- Chỉ chạy giờ làm việc (8h/ngày, 22 ngày/tháng)
- Chi phí: ~$1.09/tháng (Spot) hoặc ~$2.75/tháng (On-Demand)
- Tiết kiệm: ~$30-31/tháng so với Fargate
- ✅ Tối ưu nhất cho dev environment

**Lưu ý:**
- Cần quản lý EC2 instance (patching, monitoring)
- Cần setup ECS cluster và container instances
- Spot instances phù hợp cho dev, không nên dùng cho production

### 2. Dùng NAT Instance cho Dev (Tiết kiệm ~$66-79/tháng) ✅

**Khuyến nghị cho Dev Environment:**

**Option A: NAT Instance t3.nano (24/7)**
- Chi phí: ~$4.50-6/tháng
- Đủ cho dev/testing workloads
- **Tiết kiệm**: ~$66-76/tháng so với NAT Gateway (2x)

**Option B: NAT Instance với Auto Start/Stop**
- Chỉ chạy giờ làm việc (8h/ngày, 22 ngày/tháng)
- Chi phí: ~$1.72/tháng
- **Tiết kiệm**: ~$69-79/tháng so với NAT Gateway (2x)
- Setup với AWS Systems Manager hoặc Lambda function

**Option C: VPC Endpoints (cho Production)**
- Dùng VPC Endpoints cho S3, ECR, CloudWatch
- Giảm traffic qua NAT Gateway/Instance
- **Tiết kiệm**: ~$10-20/tháng
- Chi phí VPC Endpoints: ~$7.20/tháng (S3) + ~$7.20/tháng (ECR) = ~$14.40/tháng
- **Chỉ đáng khi traffic > 100GB/tháng**

### 3. Fargate Spot (Tiết kiệm ~$22/tháng)

- Dùng Fargate Spot cho non-critical services
- Giảm ~70% chi phí Fargate
- **Tiết kiệm**: ~$22/tháng (Singapore)
- ⚠️ Nhưng EC2 Spot vẫn rẻ hơn (~$25/tháng tiết kiệm)

### 4. Reserved Capacity / Reserved Instances

**Cho Fargate:**
- Commit 1 năm cho Fargate
- Giảm ~40% chi phí
- **Tiết kiệm**: ~$13/tháng

**Cho EC2:**
- EC2 Reserved Instances giảm ~40-60% chi phí
- t3.small Reserved (1 year): ~$9.11/tháng (tiết kiệm ~$6/tháng)
- t3.small Reserved (3 years): ~$6.07/tháng (tiết kiệm ~$9/tháng)

### 5. Giảm CloudWatch Logs Retention

- Giảm từ 7 days xuống 3 days
- **Tiết kiệm**: ~$1/tháng

### 6. EFS Infrequent Access

- Dùng cho old data
- **Tiết kiệm**: ~$1/tháng

## Scenario: Optimized Dev Setup (Singapore)

### Option 1: Fargate Spot + NAT Instance Auto Stop

| Component | Original (NAT Gateway 2x) | Optimized Dev | Savings |
|-----------|---------------------------|---------------|---------|
| ECS Fargate | $32.12 | $22.48 (Spot) | $9.64 |
| ALB | $25.50 | $25.50 | $0 |
| NAT Gateway | $75.50 (2x) | $1.72 (Instance auto stop) | $73.78 |
| EFS | $4 | $3 | $1 |
| ECR | $0.55 | $0.55 | $0 |
| CloudWatch | $2.75 | $1.65 | $1.10 |
| Data Transfer | $8.50 | $6 | $2.50 |
| **TỔNG** | **~$148** | **~$61** | **~$87** |

**Optimized Dev cost: ~$61/tháng** (tiết kiệm ~59%)

### Option 2: EC2 Spot + NAT Instance Auto Stop (Rẻ nhất) ✅✅✅

| Component | Original (NAT Gateway 2x + Fargate) | Optimized Dev EC2 | Savings |
|-----------|-------------------------------------|-------------------|---------|
| ECS Fargate | $32.12 | $1.09 (EC2 Spot auto stop) | $31.03 |
| ALB | $25.50 | $25.50 | $0 |
| NAT Gateway | $75.50 (2x) | $1.72 (Instance auto stop) | $73.78 |
| EBS Storage | $0 | $3.80 | -$3.80 |
| EFS | $4 | $3 | $1 |
| ECR | $0.55 | $0.55 | $0 |
| CloudWatch | $2.75 | $1.65 | $1.10 |
| Data Transfer | $8.50 | $6 | $2.50 |
| **TỔNG** | **~$148** | **~$42** | **~$106** |

**Optimized Dev cost với EC2: ~$42/tháng** (tiết kiệm ~72%)

### Breakdown Optimized Dev với EC2:
- ECS trên EC2 Spot (auto stop): $1.09
- ALB: $25.50
- NAT Instance (auto stop): $1.72
- EBS Storage: $3.80
- EFS: $3
- ECR: $0.55
- CloudWatch: $1.65
- Data Transfer: $6
- **Total: ~$42/tháng**

## Development/Staging Environment (Singapore)

### Minimal Dev Setup (EC2 Spot + Auto Stop):

| Component | Cost |
|-----------|------|
| ECS trên EC2 (t3.small Spot, auto stop) | $1.09 |
| ALB | $23 |
| NAT Instance (t3.nano, auto stop) | $1.72 |
| EBS Storage | $3.80 |
| EFS | $2 |
| ECR | $0.55 |
| CloudWatch | $1.50 |
| Data Transfer | $3 |
| **TỔNG** | **~$36/tháng** |

### Standard Dev Setup (EC2 Spot 24/7):

| Component | Cost |
|-----------|------|
| ECS trên EC2 (t3.small Spot) | $7.53 |
| ALB | $25.50 |
| NAT Instance (t3.nano) | $4.50 |
| EBS Storage | $3.00 |
| EFS | $3 |
| ECR | $0.55 |
| CloudWatch | $2.75 |
| Data Transfer | $6 |
| **TỔNG** | **~$56/tháng** |

### Standard Dev Setup (EC2 On-Demand):

| Component | Cost |
|-----------|------|
| ECS trên EC2 (t3.small On-Demand) | $18.18 |
| ALB | $25.50 |
| NAT Instance (t3.nano) | $4.50 |
| EBS Storage | $3.00 |
| EFS | $3 |
| ECR | $0.55 |
| CloudWatch | $2.75 |
| Data Transfer | $6 |
| **TỔNG** | **~$65/tháng** |

## Monitoring Costs

Để theo dõi chi phí:

1. **AWS Cost Explorer**
   - Xem chi phí theo service
   - Set budgets và alerts

2. **AWS Budgets**
   - Set monthly budget: $150
   - Alert khi đạt 80% và 100%

3. **Cost Allocation Tags**
   - Tag resources với Environment, Project
   - Track costs theo tag

## Recommendations cho Dev Environment

1. ✅✅ **Dùng EC2 thay vì Fargate** (Tiết kiệm lớn nhất!)
   - EC2 t3.small Spot: ~$7.53/tháng (tiết kiệm ~$25 so với Fargate)
   - EC2 t3.small On-Demand: ~$18.18/tháng (tiết kiệm ~$14 so với Fargate)
   - Với auto start/stop: ~$1.09/tháng (tiết kiệm ~$31 so với Fargate)
   - ⚠️ Cần quản lý EC2 instance nhưng tiết kiệm đáng kể

2. ✅✅ **Setup Auto Start/Stop cho EC2 và NAT Instance**
   - Chỉ chạy giờ làm việc (8h/ngày, 22 ngày/tháng)
   - EC2: Tiết kiệm thêm ~$6-17/tháng
   - NAT Instance: Tiết kiệm thêm ~$2.78/tháng
   - **Tổng tiết kiệm: ~$8-20/tháng**

3. ✅ **Dùng NAT Instance t3.nano** thay vì NAT Gateway
   - Tiết kiệm ~$66-79/tháng
   - Đủ cho dev/testing workloads
   - Có thể auto start/stop để tiết kiệm thêm

4. ⚠️ **Monitor costs** trong tháng đầu
   - Setup AWS Budgets alerts
   - Review Cost Explorer hàng tuần

5. ⚠️ **Scale down** khi không dùng
   - Stop ECS services khi không cần
   - Stop EC2 và NAT Instance khi không làm việc
   - **Với auto start/stop: chỉ ~$42/tháng** (tiết kiệm ~$106 so với production setup)

## Recommendations cho Production

1. **Dùng NAT Gateway** (không dùng NAT Instance)
   - Có SLA và high availability
   - Tự động scale
   - Không cần quản lý

2. **Dùng Reserved Capacity** nếu chắc chắn sẽ dùng lâu dài
   - Tiết kiệm ~40% chi phí Fargate

3. **Setup VPC Endpoints** nếu traffic cao (>100GB/tháng)
   - Giảm NAT Gateway data processing costs

## Additional Notes

- ✅ **Giá ở đây là cho Singapore (ap-southeast-1)**
- ⚠️ Singapore thường cao hơn us-east-1 khoảng **10-15%**
- ⚠️ Chi phí sẽ tăng theo traffic và usage
- ✅ **NAT Instance phù hợp cho Dev**, không nên dùng cho Production
- ✅ Nên test với small instance trước, scale up sau
- ✅ Setup auto start/stop để tối ưu chi phí dev environment

## So sánh tổng hợp

### NAT Gateway vs NAT Instance

| Feature | NAT Gateway | NAT Instance (t3.nano) |
|---------|-------------|------------------------|
| **Chi phí/tháng** | ~$36 (1x) / ~$72 (2x) | ~$4.50 (24/7) / ~$1.72 (auto stop) |
| **Availability** | 99.99% SLA | Không có SLA |
| **Bandwidth** | Up to 100 Gbps | ~5 Gbps |
| **Management** | Fully managed | Tự quản lý |
| **Scaling** | Tự động | Manual |
| **Suitable for** | Production | Dev/Testing |
| **Auto Start/Stop** | Không | Có thể |

**Kết luận cho Dev:** NAT Instance rẻ hơn ~85-90% và đủ cho dev workloads.

### Fargate vs EC2

| Feature | Fargate | EC2 (t3.small) |
|---------|---------|---------------|
| **Chi phí/tháng** | $32.12 | $7.53 (Spot) / $18.18 (On-Demand) |
| **Chi phí với auto stop** | $32.12 | $1.09 (Spot) / $2.75 (On-Demand) |
| **Management** | Fully managed | Tự quản lý EC2 |
| **Scaling** | Tự động | Manual hoặc Auto Scaling Group |
| **Interrupt risk** | Không | Có (Spot instances) |
| **Suitable for** | Production, Auto-scaling | Dev/Testing, Fixed workloads |
| **Auto Start/Stop** | Không | Có thể |

**Kết luận cho Dev:** EC2 rẻ hơn ~77% (Spot) hoặc ~44% (On-Demand) so với Fargate.

### Tổng kết Cost Comparison

| Setup | Chi phí/tháng | Tiết kiệm |
|-------|---------------|-----------|
| **Production** (NAT Gateway 2x + Fargate) | ~$148 | - |
| **Dev** (NAT Gateway + Fargate) | ~$87 | $61 (41%) |
| **Dev** (NAT Instance + Fargate) | ~$72 | $76 (51%) |
| **Dev** (NAT Instance + EC2 Spot) | ~$56 | $92 (62%) |
| **Dev Optimized** (NAT Instance + EC2 Spot + Auto Stop) | ~$42 | **$106 (72%)** ✅ |

**Khuyến nghị tối ưu cho Dev:** EC2 Spot + NAT Instance + Auto Start/Stop = **~$42/tháng** (tiết kiệm 72%)

