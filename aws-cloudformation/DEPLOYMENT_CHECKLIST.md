# Deployment Checklist

Checklist nhanh để deploy Perplexica lên AWS.

## ✅ Pre-Deployment

- [ ] AWS Account đã được tạo
- [ ] AWS CLI đã được cài đặt (`aws --version`)
- [ ] Docker đã được cài đặt (`docker --version`)
- [ ] AWS credentials đã được configure (`aws configure`)
- [ ] Đã verify AWS access (`aws sts get-caller-identity`)

## ✅ Step 1: Build và Push Images

```bash
cd /Users/nguyendat/Working/mcp/Perplexica

# Build images
docker build -f app.dockerfile -t perplexica-web:latest .
cd apps/mcp-server && docker build -t perplexica-mcp-server:latest . && cd ../..

# Login ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com

# Tag và push
docker tag perplexica-web:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-web:latest
docker tag perplexica-mcp-server:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-mcp-server:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-web:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-mcp-server:latest
```

- [ ] Images đã được build thành công
- [ ] Images đã được push lên ECR

## ✅ Step 2: Deploy Main Stack

```bash
cd aws-cloudformation
./deploy.sh production create
```

Hoặc thủ công:

```bash
aws cloudformation create-stack \
  --stack-name perplexica-production \
  --template-body file://perplexica-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

- [ ] Stack đã được tạo thành công
- [ ] Đã lấy được ALB URL từ outputs

## ✅ Step 3: Verify Services

```bash
# Check services
aws ecs describe-services \
  --cluster production-perplexica-cluster \
  --services production-perplexica-web production-perplexica-mcp-server production-perplexica-searxng \
  --region ap-southeast-1 \
  --query "services[*].[serviceName,runningCount,desiredCount]" \
  --output table

# Get ALB URL
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ALBURL'].OutputValue" \
  --output text)

# Test
curl http://${ALB_URL}/
curl http://${ALB_URL}/mcp/health
curl http://${ALB_URL}/searxng/
```

- [ ] Tất cả services đang running (runningCount == desiredCount)
- [ ] Health checks đều pass
- [ ] Có thể access được services qua browser

## ✅ Step 4: Setup Monitoring

```bash
./setup-monitoring.sh production your-email@example.com
```

- [ ] Monitoring stack đã được deploy
- [ ] Đã confirm SNS email subscription
- [ ] Đã test alarm (nhận được email)

## ✅ Step 5: Final Verification

- [ ] Services accessible qua ALB URL
- [ ] Logs đang được ghi vào CloudWatch
- [ ] Alarms đang hoạt động
- [ ] Auto scaling đã được enable

## 🎉 Done!

Hệ thống đã được deploy thành công!

**Next Steps:**
- [ ] Review costs sau 1 tuần
- [ ] Adjust alarm thresholds nếu cần
- [ ] Setup custom domain (nếu có)
- [ ] Setup CI/CD pipeline

---

## 🆘 Nếu có lỗi

1. Check stack events: `aws cloudformation describe-stack-events --stack-name perplexica-production`
2. Check service logs: `aws logs tail /ecs/production-perplexica-web --follow`
3. Xem DEPLOYMENT_GUIDE.md phần Troubleshooting

