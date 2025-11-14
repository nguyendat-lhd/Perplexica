# Simple Deployment với Docker Compose trên EC2

Giải pháp đơn giản nhất và rẻ nhất để deploy Perplexica: **1 EC2 instance với docker-compose**

## 🎯 Ưu điểm

✅ **Rất đơn giản**: Chỉ cần 1 EC2 instance  
✅ **Rẻ nhất**: ~$7-18/tháng (với Spot: ~$7/tháng)  
✅ **Nhanh deploy**: 5-10 phút  
✅ **Dễ quản lý**: SSH vào và `docker-compose up/down`  
✅ **Dùng docker-compose có sẵn**: Không cần modify nhiều  

## 💰 Chi phí

| Component | Chi phí/tháng |
|-----------|---------------|
| EC2 t3.small Spot | ~$7.53 |
| EBS Storage (30GB) | ~$3.00 |
| EFS (optional) | ~$3.00 |
| **TỔNG** | **~$10-13/tháng** |

**So với ECS Fargate:** Tiết kiệm ~$60-70/tháng! 🎉

## 📋 Prerequisites

1. **AWS Session Manager Plugin** (Khuyến nghị - không cần key pair)
```bash
# macOS
brew install --cask session-manager-plugin

# Linux
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
sudo yum install -y session-manager-plugin.rpm

# Verify
session-manager-plugin
```

**Hoặc** EC2 Key Pair (nếu muốn dùng SSH):
```bash
# Tạo key pair nếu chưa có
aws ec2 create-key-pair \
  --key-name perplexica-dev-key \
  --region ap-southeast-1 \
  --query 'KeyMaterial' \
  --output text > perplexica-dev-key.pem

chmod 400 perplexica-dev-key.pem
```

2. **Docker images đã được build** (hoặc dùng public images)

## 🚀 Quick Deploy

### Bước 1: Chuẩn bị Parameters

Chỉnh sửa `parameters-simple.json`:

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "development"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "t3.small"
  },
  {
    "ParameterKey": "UseSpotInstance",
    "ParameterValue": "true"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "perplexica-dev-key"
  },
  {
    "ParameterKey": "ECRImageURI",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "GitHubRepo",
    "ParameterValue": ""
  }
]
```

### Bước 2: Deploy Stack

**Cách 1: Dùng script (Khuyến nghị)**

```bash
cd aws-cloudformation

# Deploy với Session Manager (không cần key pair)
./deploy-simple.sh development ""

# Hoặc với key pair (nếu muốn dùng SSH)
./deploy-simple.sh development perplexica-dev-key
```

**Cách 2: Deploy thủ công**

```bash
cd aws-cloudformation

# Update parameters-simple.json - để KeyPairName = "" nếu dùng Session Manager
aws cloudformation create-stack \
  --stack-name perplexica-simple-dev \
  --template-body file://perplexica-simple-ec2.yaml \
  --parameters file://parameters-simple.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1

# Chờ stack tạo xong (5-10 phút)
aws cloudformation wait stack-create-complete \
  --stack-name perplexica-simple-dev \
  --region ap-southeast-1
```

### Bước 3: Lấy URLs

```bash
# Get outputs
aws cloudformation describe-stacks \
  --stack-name perplexica-simple-dev \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs" \
  --output table

# Get Public IP
PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name perplexica-simple-dev \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
  --output text)

echo "Perplexica Web: http://${PUBLIC_IP}:3000"
echo "MCP Server: http://${PUBLIC_IP}:3001"
echo "SearXNG: http://${PUBLIC_IP}:4000"
```

### Bước 4: Connect vào instance

**Cách 1: Session Manager (Khuyến nghị) ✅**

```bash
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name perplexica-simple-dev \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
  --output text)

# Connect via Session Manager
aws ssm start-session --target ${INSTANCE_ID} --region ap-southeast-1
```

**Cách 2: SSH (nếu có key pair)**

```bash
PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name perplexica-simple-dev \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
  --output text)

ssh -i perplexica-dev-key.pem ec2-user@${PUBLIC_IP}
```

**Xem SESSION_MANAGER_GUIDE.md để biết chi tiết về Session Manager**

## 🔧 Quản lý Services

### Connect vào instance

**Via Session Manager (Khuyến nghị):**
```bash
aws ssm start-session --target <INSTANCE_ID>
```

**Via SSH (nếu có key pair):**
```bash
ssh -i perplexica-dev-key.pem ec2-user@<PUBLIC_IP>
```

### Kiểm tra services

```bash
cd /home/ec2-user/perplexica
docker-compose ps
docker-compose logs
```

### Restart services

```bash
cd /home/ec2-user/perplexica
docker-compose restart
# hoặc
docker-compose down
docker-compose up -d
```

### Update code/images

```bash
cd /home/ec2-user/perplexica
git pull  # nếu dùng GitHub repo
docker-compose pull
docker-compose up -d --build
```

## 📝 Customization

### Option 1: Dùng ECR Images

Nếu đã có images trên ECR:

```json
{
  "ParameterKey": "ECRImageURI",
  "ParameterValue": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/production-perplexica-web:latest"
}
```

### Option 2: Clone từ GitHub

```json
{
  "ParameterKey": "GitHubRepo",
  "ParameterValue": "https://github.com/your-username/perplexica.git"
}
```

### Option 3: Build trên instance

Để trống cả 2 parameters, instance sẽ tự build từ docker-compose.yml

## 🔒 Security

### Session Manager (Khuyến nghị)

✅ **Không cần mở port 22** - Session Manager không cần port mở  
✅ **IAM-based access** - Quản lý qua IAM permissions  
✅ **Audit logs** - Tất cả sessions được log tự động  

Template đã được cấu hình để **không mở port 22** mặc định.

### Nếu cần SSH

Nếu bạn muốn dùng SSH, cần:
1. Tạo key pair
2. Update `KeyPairName` parameter
3. Thêm SSH rule vào security group (không khuyến nghị)

## 💡 Tips

1. **Auto Start/Stop**: Setup Lambda function để auto start/stop instance khi không dùng
2. **Backup**: EFS được mount tự động, data được persist
3. **Monitoring**: Có thể thêm CloudWatch agent
4. **Domain**: Có thể dùng Route53 để point domain về Public IP

## 🆚 So sánh với ECS

| Feature | Simple EC2 | ECS Fargate |
|---------|------------|-------------|
| **Chi phí/tháng** | ~$10-13 | ~$72-87 |
| **Setup time** | 5-10 phút | 20-30 phút |
| **Complexity** | Đơn giản | Phức tạp |
| **Auto-scaling** | Không | Có |
| **Management** | SSH + docker-compose | AWS Console |
| **Best for** | Dev/Testing | Production |

## 🎉 Kết luận

**Cho Dev Environment:** Dùng Simple EC2 với docker-compose là tốt nhất!
- Rẻ nhất (~$10/tháng)
- Đơn giản nhất
- Nhanh nhất để deploy
- Dễ quản lý

**Cho Production:** Dùng ECS Fargate với ALB
- Auto-scaling
- High availability
- Load balancing

