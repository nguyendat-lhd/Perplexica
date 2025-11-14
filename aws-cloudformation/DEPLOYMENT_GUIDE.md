# Hướng dẫn Triển khai Perplexica lên AWS

Hướng dẫn chi tiết từng bước để deploy Perplexica stack lên AWS Singapore với EC2 và NAT Instance (tối ưu chi phí cho dev).

## 📋 Mục lục

1. [Prerequisites](#prerequisites)
2. [Bước 1: Chuẩn bị AWS](#bước-1-chuẩn-bị-aws)
3. [Bước 2: Build Docker Images](#bước-2-build-docker-images)
4. [Bước 3: Deploy Main Stack](#bước-3-deploy-main-stack)
5. [Bước 4: Setup Monitoring](#bước-4-setup-monitoring)
6. [Bước 5: Verify Deployment](#bước-5-verify-deployment)
7. [Bước 6: Access Services](#bước-6-access-services)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Cài đặt Tools

```bash
# AWS CLI
# macOS
brew install awscli

# Linux
sudo apt-get install awscli

# Verify
aws --version

# Docker
# macOS: Download từ https://www.docker.com/products/docker-desktop
# Linux
sudo apt-get install docker.io

# Verify
docker --version
```

### 2. AWS Account Setup

1. Tạo AWS Account tại https://aws.amazon.com
2. Login vào AWS Console
3. Tạo IAM User với permissions:
   - CloudFormation (Full Access)
   - ECS (Full Access)
   - ECR (Full Access)
   - VPC (Full Access)
   - EC2 (Full Access)
   - IAM (Limited - chỉ để tạo roles)
   - EFS (Full Access)
   - ELB (Full Access)
   - CloudWatch (Full Access)
   - SNS (Full Access)

4. Tạo Access Key cho IAM User
5. Configure AWS CLI:

```bash
aws configure
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: ap-southeast-1
# Default output format: json

# Verify
aws sts get-caller-identity
```

---

## Bước 1: Chuẩn bị AWS

### 1.1. Chọn Region

```bash
# Set region (Singapore)
export AWS_REGION=ap-southeast-1
export AWS_DEFAULT_REGION=ap-southeast-1
```

### 1.2. Tạo ECR Repositories (nếu chưa có)

```bash
cd aws-cloudformation

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"

# Create ECR repositories
aws ecr create-repository \
  --repository-name production-perplexica-web \
  --region ap-southeast-1 \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "Repository already exists"

aws ecr create-repository \
  --repository-name production-perplexica-mcp-server \
  --region ap-southeast-1 \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "Repository already exists"
```

---

## Bước 2: Build Docker Images

### 2.1. Build Perplexica Web App

```bash
# Từ root directory của project
cd /Users/nguyendat/Working/mcp/Perplexica

# Build image
docker build -f app.dockerfile -t perplexica-web:latest .

# Verify image
docker images | grep perplexica-web
```

### 2.2. Build MCP Server

```bash
# Build MCP server
cd apps/mcp-server
docker build -t perplexica-mcp-server:latest .
cd ../..

# Verify image
docker images | grep perplexica-mcp-server
```

### 2.3. Login to ECR

```bash
# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com
```

### 2.4. Tag và Push Images

```bash
# Tag images
docker tag perplexica-web:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-web:latest

docker tag perplexica-mcp-server:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-mcp-server:latest

# Push images
echo "Pushing Perplexica Web image..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-web:latest

echo "Pushing MCP Server image..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-mcp-server:latest

echo "Images pushed successfully!"
```

**Lưu ý:** Quá trình push có thể mất 5-10 phút tùy vào kích thước images.

---

## Bước 3: Deploy Main Stack

### 3.1. Chuẩn bị Parameters

Chỉnh sửa `parameters.json`:

```bash
cd aws-cloudformation

# Xem file parameters.json
cat parameters.json
```

Cập nhật với ECR image URIs:

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "production"
  },
  {
    "ParameterKey": "PerplexicaImage",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "MCPServerImage",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "SearXNGImage",
    "ParameterValue": "searxng/searxng:latest"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "CertificateArn",
    "ParameterValue": ""
  }
]
```

**Lưu ý:** Để `PerplexicaImage` và `MCPServerImage` trống - CloudFormation sẽ tự động dùng ECR repositories.

### 3.2. Deploy Stack

**Cách 1: Dùng script (Khuyến nghị)**

```bash
cd aws-cloudformation

# Make script executable
chmod +x deploy.sh

# Deploy (sẽ tự động build và push images nếu cần)
./deploy.sh production build-deploy
```

**Cách 2: Deploy thủ công**

```bash
cd aws-cloudformation

# Deploy stack
aws cloudformation create-stack \
  --stack-name perplexica-production \
  --template-body file://perplexica-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1 \
  --tags Key=Environment,Value=production Key=Project,Value=Perplexica

# Chờ stack tạo xong (5-10 phút)
aws cloudformation wait stack-create-complete \
  --stack-name perplexica-production \
  --region ap-southeast-1

echo "Stack deployed successfully!"
```

### 3.3. Kiểm tra Stack Status

```bash
# Xem stack status
aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --query "Stacks[0].[StackStatus,StackStatusReason]" \
  --output table

# Xem stack events (nếu có lỗi)
aws cloudformation describe-stack-events \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --max-items 20 \
  --query "StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]" \
  --output table
```

### 3.4. Lấy Outputs

```bash
# Xem tất cả outputs
aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs" \
  --output table

# Lấy ALB URL
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ALBURL'].OutputValue" \
  --output text)

echo "ALB URL: ${ALB_URL}"
```

---

## Bước 4: Setup Monitoring

### 4.1. Deploy Monitoring Stack

```bash
cd aws-cloudformation

# Make script executable
chmod +x setup-monitoring.sh

# Setup monitoring với email của bạn
./setup-monitoring.sh production your-email@example.com
```

### 4.2. Confirm SNS Subscription

1. Kiểm tra email inbox
2. Tìm email từ AWS SNS với subject "AWS Notification - Subscription Confirmation"
3. Click link "Confirm subscription"
4. Sẽ thấy trang "Subscription confirmed!"

### 4.3. Test Alarms

```bash
# Test alarm
aws cloudwatch set-alarm-state \
  --alarm-name production-perplexica-web-cpu-high \
  --state-value ALARM \
  --state-reason "Testing alarm" \
  --region ap-southeast-1

# Kiểm tra email - bạn sẽ nhận được alert
```

---

## Bước 5: Verify Deployment

### 5.1. Kiểm tra ECS Services

```bash
# List services
aws ecs list-services \
  --cluster production-perplexica-cluster \
  --region ap-southeast-1

# Check service status
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web production-perplexica-mcp-server production-perplexica-searxng \
  --region ap-southeast-1 \
  --query "services[*].[serviceName,runningCount,desiredCount,status]" \
  --output table
```

### 5.2. Kiểm tra Tasks

```bash
# List running tasks
aws ecs list-tasks \
  --cluster production-perplexica-cluster \
  --service-name production-perplexica-web \
  --region ap-southeast-1

# Get task details
TASK_ARN=$(aws ecs list-tasks \
  --cluster production-perplexica-cluster \
  --service-name production-perplexica-web \
  --region ap-southeast-1 \
  --query "taskArns[0]" \
  --output text)

aws ecs describe-tasks \
  --cluster production-perplexica-cluster \
  --tasks ${TASK_ARN} \
  --region ap-southeast-1 \
  --query "tasks[0].[lastStatus,healthStatus,containers[0].name]" \
  --output table
```

### 5.3. Kiểm tra ALB Target Health

```bash
# Get target group ARN
TG_ARN=$(aws elbv2 describe-target-groups \
  --region ap-southeast-1 \
  --query "TargetGroups[?contains(TargetGroupName, 'perplexica-web')].TargetGroupArn" \
  --output text)

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn ${TG_ARN} \
  --region ap-southeast-1 \
  --query "TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason]" \
  --output table
```

### 5.4. Kiểm tra Logs

```bash
# View Perplexica web logs
aws logs tail /ecs/production-perplexica-web --follow --region ap-southeast-1

# View MCP server logs
aws logs tail /ecs/production-perplexica-mcp-server --follow --region ap-southeast-1

# View SearXNG logs
aws logs tail /ecs/production-perplexica-searxng --follow --region ap-southeast-1
```

---

## Bước 6: Access Services

### 6.1. Lấy ALB URL

```bash
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ALBURL'].OutputValue" \
  --output text)

echo "Access your services at: ${ALB_URL}"
```

### 6.2. Test Services

```bash
# Test Perplexica Web
curl http://${ALB_URL}/

# Test MCP Server health
curl http://${ALB_URL}/mcp/health

# Test SearXNG
curl http://${ALB_URL}/searxng/
```

### 6.3. Access trong Browser

Mở browser và truy cập:
- **Perplexica Web**: `http://<ALB-DNS-NAME>/`
- **MCP Server**: `http://<ALB-DNS-NAME>/mcp/health`
- **SearXNG**: `http://<ALB-DNS-NAME>/searxng/`

---

## Troubleshooting

### Stack Creation Failed

```bash
# Xem stack events
aws cloudformation describe-stack-events \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --max-items 50 \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED'].[Timestamp,LogicalResourceId,ResourceStatusReason]" \
  --output table
```

**Common Issues:**

1. **IAM Permissions**: Đảm bảo IAM user có đủ permissions
2. **ECR Images**: Đảm bảo đã push images lên ECR
3. **VPC Limits**: Kiểm tra VPC limits trong account
4. **Service Quotas**: Kiểm tra ECS/Fargate quotas

### Service không start

```bash
# Check service events
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web \
  --region ap-southeast-1 \
  --query "services[0].events[0:5]" \
  --output table

# Check task stopped reason
aws ecs describe-tasks \
  --cluster production-perplexica-cluster \
  --tasks <task-arn> \
  --region ap-southeast-1 \
  --query "tasks[0].stoppedReason"
```

### Health Check Failed

```bash
# Check target health
TG_ARN=$(aws elbv2 describe-target-groups \
  --region ap-southeast-1 \
  --query "TargetGroups[?contains(TargetGroupName, 'perplexica-web')].TargetGroupArn" \
  --output text)

aws elbv2 describe-target-health \
  --target-group-arn ${TG_ARN} \
  --region ap-southeast-1

# Common reasons:
# - Container không listen đúng port
# - Security group không allow traffic
# - Health check path sai
```

### High CPU/Memory

```bash
# Check current metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=production-perplexica-web Name=ClusterName,Value=production-perplexica-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-southeast-1

# Auto scaling sẽ tự động scale up nếu đã setup monitoring
```

### Cannot Access Services

1. **Check Security Groups:**
```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=production-perplexica-ecs-sg" \
  --region ap-southeast-1 \
  --query "SecurityGroups[0].IpPermissions"
```

2. **Check ALB Listener:**
```bash
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --region ap-southeast-1 \
  --query "LoadBalancers[?contains(DNSName, 'production-perplexica')].LoadBalancerArn" \
  --output text)

aws elbv2 describe-listeners \
  --load-balancer-arn ${ALB_ARN} \
  --region ap-southeast-1
```

---

## Quick Reference Commands

### Useful Commands

```bash
# Get stack outputs
aws cloudformation describe-stacks --stack-name perplexica-production --query "Stacks[0].Outputs" --output table

# Scale service manually
aws ecs update-service --cluster production-perplexica-cluster --service production-perplexica-web --desired-count 2

# View logs
aws logs tail /ecs/production-perplexica-web --follow

# Check costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

---

## Next Steps

Sau khi deploy thành công:

1. ✅ **Setup Custom Domain** (nếu có)
   - Tạo ACM certificate
   - Update Route53 records
   - Update stack với DomainName và CertificateArn

2. ✅ **Review Monitoring**
   - Check CloudWatch Dashboard
   - Review alarm thresholds sau 1-2 tuần
   - Adjust auto scaling policies nếu cần

3. ✅ **Setup CI/CD**
   - GitHub Actions hoặc AWS CodePipeline
   - Auto build và deploy khi có code changes

4. ✅ **Cost Optimization**
   - Review costs sau 1 tuần
   - Setup AWS Budgets alerts
   - Consider Reserved Instances nếu dùng lâu dài

5. ✅ **Security Hardening**
   - Review security groups
   - Enable WAF cho ALB (nếu cần)
   - Setup VPC Flow Logs

---

## Support

Nếu gặp vấn đề:
1. Check logs: `aws logs tail /ecs/production-perplexica-web --follow`
2. Check CloudWatch metrics
3. Review stack events
4. Xem MONITORING_GUIDE.md cho troubleshooting chi tiết

**Happy Deploying! 🚀**

