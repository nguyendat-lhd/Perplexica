# Quick Start Guide - Deploy Perplexica lên AWS

## Bước 1: Chuẩn bị

```bash
# Install AWS CLI (nếu chưa có)
# macOS: brew install awscli
# Linux: sudo apt-get install awscli

# Configure AWS credentials
aws configure
# Nhập: Access Key ID, Secret Access Key, Region (ví dụ: us-east-1), Output format (json)

# Verify
aws sts get-caller-identity
```

## Bước 2: Build và Push Docker Images

```bash
cd aws-cloudformation

# Build Perplexica web app
cd ..
docker build -f app.dockerfile -t perplexica-web:latest .

# Build MCP server
cd apps/mcp-server
docker build -t perplexica-mcp-server:latest .
cd ../..
```

## Bước 3: Deploy Stack

### Option A: Dùng script (Khuyến nghị)

```bash
cd aws-cloudformation
chmod +x deploy.sh

# Lần đầu - tạo stack và push images
./deploy.sh production build-deploy

# Hoặc từng bước:
./deploy.sh production build-and-push  # Build và push images
./deploy.sh production create          # Tạo stack lần đầu
./deploy.sh production update          # Update stack
```

### Option B: Deploy thủ công

```bash
# 1. Tạo ECR repositories (nếu chưa có)
aws ecr create-repository --repository-name production-perplexica-web --region us-east-1
aws ecr create-repository --repository-name production-perplexica-mcp-server --region us-east-1

# 2. Login to ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag và push images
docker tag perplexica-web:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/production-perplexica-web:latest
docker tag perplexica-mcp-server:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/production-perplexica-mcp-server:latest

docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/production-perplexica-web:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/production-perplexica-mcp-server:latest

# 4. Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name perplexica-production \
  --template-body file://perplexica-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# 5. Chờ stack tạo xong (5-10 phút)
aws cloudformation wait stack-create-complete --stack-name perplexica-production --region us-east-1
```

## Bước 4: Lấy URLs

```bash
# Lấy ALB URL
aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='ALBURL'].OutputValue" \
  --output text

# Xem tất cả outputs
aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs" \
  --output table
```

## Bước 5: Test

```bash
# Test Perplexica web
curl http://<ALB-DNS-NAME>/

# Test MCP server health
curl http://<ALB-DNS-NAME>/mcp/health

# Test SearXNG
curl http://<ALB-DNS-NAME>/searxng/
```

## Cấu hình Custom Domain (Optional)

1. **Tạo ACM Certificate** (phải ở cùng region với stack):
```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS \
  --region us-east-1
```

2. **Validate certificate** (thêm DNS records vào domain)

3. **Update stack với certificate**:
```bash
# Update parameters.json
{
  "ParameterKey": "DomainName",
  "ParameterValue": "your-domain.com"
},
{
  "ParameterKey": "CertificateArn",
  "ParameterValue": "arn:aws:acm:us-east-1:account:certificate/cert-id"
}

# Update stack
./deploy.sh production update
```

4. **Setup Route53** (nếu dùng Route53):
```bash
# Lấy ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" \
  --output text)

# Tạo A record alias trong Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "your-domain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "'${ALB_DNS}'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

## Troubleshooting

### Stack creation failed

```bash
# Xem events
aws cloudformation describe-stack-events \
  --stack-name perplexica-production \
  --max-items 20 \
  --query "StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]" \
  --output table
```

### Service không start

```bash
# Xem logs
aws logs tail /ecs/production-perplexica-web --follow

# Xem service status
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web
```

### Health check failed

```bash
# Kiểm tra target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## Cleanup

```bash
# Xóa stack
./deploy.sh production delete

# Hoặc
aws cloudformation delete-stack --stack-name perplexica-production
```

## Cost Monitoring

```bash
# Xem cost estimate
cat COST_ESTIMATION.md

# Setup budget alert
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "perplexica-monthly",
    "BudgetLimit": {"Amount": "150", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "your-email@example.com"}]
  }]'
```

## Next Steps

1. ✅ Deploy stack
2. ✅ Test services
3. ⬜ Setup custom domain
4. ⬜ Configure CI/CD
5. ⬜ Setup monitoring alerts
6. ⬜ Enable auto-scaling
7. ⬜ Setup backups

