# Perplexica AWS CloudFormation Deployment

CloudFormation template để deploy Perplexica stack lên AWS với 3 services:
- **MCP Server**: Model Context Protocol server
- **Perplexica Web**: Next.js web application
- **SearXNG**: Search engine service

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Hướng dẫn triển khai chi tiết từng bước ⭐
- **[MONITORING_GUIDE.md](./MONITORING_GUIDE.md)** - Hướng dẫn setup monitoring và alerting
- **[COST_ESTIMATION.md](./COST_ESTIMATION.md)** - Ước tính chi phí và tối ưu
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide

## Kiến trúc

### Hạ tầng được tạo:

1. **VPC với 2 Availability Zones**
   - Public subnets cho ALB và NAT Gateways
   - Private subnets cho ECS tasks

2. **ECS Fargate Cluster**
   - Không cần quản lý EC2 instances
   - Auto-scaling support
   - Container Insights enabled

3. **Application Load Balancer**
   - HTTP → HTTPS redirect
   - Path-based routing:
     - `/mcp/*` → MCP Server
     - `/searxng/*` → SearXNG
     - `/` → Perplexica Web

4. **EFS (Elastic File System)**
   - Mount cho SQLite database và uploads
   - Multi-AZ với automatic backup
   - Bursting mode (cost-effective)

5. **ECR Repositories**
   - Perplexica web app
   - MCP server

6. **CloudWatch Logs**
   - Centralized logging
   - 7-day retention

### Resource Sizing (Production):

| Service | CPU | Memory | Estimated Cost/Month |
|---------|-----|--------|---------------------|
| MCP Server | 0.25 vCPU | 512 MB | ~$7 |
| Perplexica Web | 0.5 vCPU | 1 GB | ~$14 |
| SearXNG | 0.25 vCPU | 512 MB | ~$7 |
| ALB | - | - | ~$16 |
| NAT Gateway (2x) | - | - | ~$65 |
| EFS | - | - | ~$3 |
| Data Transfer | - | - | ~$10-20 |
| **Total** | | | **~$120-130/month** |

*Note: Chi phí có thể thấp hơn với Reserved Capacity hoặc Savings Plans*

## Prerequisites

1. **AWS CLI** installed và configured
   ```bash
   aws configure
   ```

2. **Docker** installed (để build images)

3. **jq** (optional, để parse JSON outputs)

4. **AWS Account** với permissions:
   - CloudFormation
   - ECS
   - ECR
   - VPC
   - IAM
   - EFS
   - ELB

## Quick Start

### 1. Chuẩn bị Parameters

Chỉnh sửa `parameters.json`:

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "production"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "your-domain.com"
  },
  {
    "ParameterKey": "CertificateArn",
    "ParameterValue": "arn:aws:acm:region:account:certificate/cert-id"
  }
]
```

**Lưu ý về Certificate:**
- Nếu có domain, cần tạo ACM certificate trước
- Certificate phải ở cùng region với stack
- Nếu không có domain, để trống `DomainName` và `CertificateArn`

### 2. Build và Push Docker Images

```bash
cd aws-cloudformation
chmod +x deploy.sh
./deploy.sh production build-and-push
```

Hoặc build thủ công:

```bash
# Build Perplexica web
docker build -f app.dockerfile -t perplexica-web:latest .

# Build MCP server
cd apps/mcp-server
docker build -t perplexica-mcp-server:latest .
cd ../..

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push (sau khi stack được tạo)
docker tag perplexica-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/production-perplexica-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/production-perplexica-web:latest
```

### 3. Deploy Stack

**Lần đầu (create):**
```bash
./deploy.sh production create
```

**Cập nhật (update):**
```bash
./deploy.sh production update
```

**Build và deploy cùng lúc:**
```bash
./deploy.sh production build-deploy
```

### 4. Kiểm tra Deployment

Sau khi deploy xong, lấy ALB URL:

```bash
aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='ALBURL'].OutputValue" \
  --output text
```

Hoặc xem tất cả outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs" \
  --output table
```

## Manual Deployment

Nếu không dùng script, có thể deploy thủ công:

```bash
# Create stack
aws cloudformation create-stack \
  --stack-name perplexica-production \
  --template-body file://perplexica-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Update stack
aws cloudformation update-stack \
  --stack-name perplexica-production \
  --template-body file://perplexica-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Configuration

### Environment Variables

Các environment variables được set tự động trong Task Definitions:

**Perplexica Web:**
- `SEARXNG_API_URL`: Internal service URL
- `DATA_DIR`: `/home/perplexica`
- `NODE_ENV`: `production`

**MCP Server:**
- `PORT`: `3001`
- `PERPLEXICA_BASE_URL`: Internal service URL
- `MCP_ALLOWED_HOSTS`: ALB DNS name hoặc domain
- `MCP_ALLOWED_ORIGINS`: HTTPS URL

**SearXNG:**
- `SEARXNG_HOSTNAME`: ALB DNS name hoặc domain

### EFS Mount Points

- `/home/perplexica/data`: SQLite database
- `/home/perplexica/uploads`: User uploads

### Health Checks

- **Perplexica Web**: `GET /` (200-399)
- **MCP Server**: `GET /health` (cần implement endpoint này)
- **SearXNG**: `GET /` (200-399)

## Cost Optimization Tips

1. **Sử dụng Fargate Spot** (có thể chỉnh trong Capacity Provider Strategy)
   - Tiết kiệm ~70% chi phí
   - Phù hợp cho non-critical workloads

2. **Reserved Capacity**
   - Commit 1-3 năm để giảm ~40% chi phí Fargate

3. **NAT Gateway**
   - Nếu traffic thấp, có thể dùng NAT Instance thay vì NAT Gateway
   - Hoặc dùng VPC Endpoints cho AWS services

4. **EFS**
   - Bursting mode đã được set (rẻ nhất)
   - Có thể dùng Infrequent Access storage class nếu cần

5. **CloudWatch Logs**
   - Retention 7 days (có thể giảm xuống 3 days)
   - Có thể export sang S3 để archive

6. **ALB**
   - Chỉ tạo 1 ALB cho tất cả services
   - Có thể dùng NLB nếu không cần advanced routing

## Scaling

### Auto Scaling

Có thể thêm Auto Scaling cho các services:

```yaml
# Thêm vào CloudFormation template
PerplexicaAutoScaling:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    MinCapacity: 1
    MaxCapacity: 10
    ResourceId: !Sub 'service/${ECSCluster}/${PerplexicaService.Name}'
    ScalableDimension: ecs:service:DesiredCount
    ServiceNamespace: ecs
```

### Manual Scaling

```bash
aws ecs update-service \
  --cluster production-perplexica-cluster \
  --service production-perplexica-web \
  --desired-count 2 \
  --region us-east-1
```

## Monitoring

### CloudWatch Metrics

- ECS Service metrics: CPU, Memory, Request count
- ALB metrics: Request count, Response time, Error rate
- EFS metrics: Data read/write, IOPS

### Logs

```bash
# View Perplexica web logs
aws logs tail /ecs/production-perplexica-web --follow --region us-east-1

# View MCP server logs
aws logs tail /ecs/production-perplexica-mcp-server --follow --region us-east-1

# View SearXNG logs
aws logs tail /ecs/production-perplexica-searxng --follow --region us-east-1
```

## Troubleshooting

### Service không start được

1. Kiểm tra logs:
```bash
aws logs tail /ecs/production-perplexica-web --follow
```

2. Kiểm tra task status:
```bash
aws ecs describe-tasks \
  --cluster production-perplexica-cluster \
  --tasks <task-id> \
  --region us-east-1
```

3. Kiểm tra security groups:
```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=production-perplexica-ecs-sg" \
  --region us-east-1
```

### Health check failed

1. Kiểm tra health check path có đúng không
2. Kiểm tra container có listen đúng port không
3. Kiểm tra security group rules

### EFS mount failed

1. Kiểm tra EFS security group có allow traffic từ ECS security group không
2. Kiểm tra IAM role có permissions không
3. Kiểm tra Access Point có được tạo đúng không

### Image pull failed

1. Kiểm tra ECR repository có tồn tại không
2. Kiểm tra image tag có đúng không
3. Kiểm tra ECS task execution role có ECR permissions không

## Cleanup

Để xóa toàn bộ stack:

```bash
./deploy.sh production delete
```

Hoặc thủ công:

```bash
aws cloudformation delete-stack \
  --stack-name perplexica-production \
  --region us-east-1
```

**Lưu ý:** ECR repositories và EFS sẽ không bị xóa tự động. Cần xóa thủ công nếu không cần:

```bash
# Xóa ECR repositories
aws ecr delete-repository \
  --repository-name production-perplexica-web \
  --force \
  --region us-east-1

aws ecr delete-repository \
  --repository-name production-perplexica-mcp-server \
  --force \
  --region us-east-1

# Xóa EFS (sau khi unmount tất cả)
aws efs delete-file-system \
  --file-system-id <efs-id> \
  --region us-east-1
```

## Security Best Practices

1. **VPC**: Services chạy trong private subnets
2. **Security Groups**: Chỉ allow traffic cần thiết
3. **EFS**: Encryption at rest và in transit
4. **IAM Roles**: Least privilege principle
5. **HTTPS**: Luôn dùng HTTPS với custom domain
6. **Secrets**: Dùng AWS Secrets Manager hoặc Parameter Store cho sensitive data

## Next Steps

1. **Custom Domain**: Setup Route53 và ACM certificate
2. **CI/CD**: Setup GitHub Actions hoặc CodePipeline
3. **Monitoring**: Setup CloudWatch Alarms và SNS notifications
4. **Backup**: Setup EFS backup với AWS Backup
5. **CDN**: Thêm CloudFront cho static assets

## Support

Nếu gặp vấn đề, kiểm tra:
- CloudFormation Events: `aws cloudformation describe-stack-events --stack-name perplexica-production`
- ECS Service Events: `aws ecs describe-services --cluster production-perplexica-cluster --services production-perplexica-web`
- CloudWatch Logs: Xem logs của từng service

