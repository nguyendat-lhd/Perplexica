# Hướng dẫn Rebuild Services sau khi Commit Code

Sau khi commit code, bạn cần rebuild Docker images và deploy lại các services. Script `rebuild.sh` giúp bạn làm điều này dễ dàng.

## 📋 Tổng quan

Có 3 services trong Perplexica stack:
- **Perplexica Web** (port 3000) - Web application
- **MCP Server** (port 3001) - MCP server
- **SearXNG** (port 4000) - Search engine (dùng public image, không cần build)

## 🚀 Cách sử dụng

### 1. Build và Push tất cả services

```bash
cd aws-cloudformation
./rebuild.sh production all
```

### 2. Build và Push chỉ 1 service

**Chỉ build Perplexica Web:**
```bash
./rebuild.sh production web
```

**Chỉ build MCP Server:**
```bash
./rebuild.sh production mcp
```

### 3. Build, Push và Force Update ECS Service

**Build và force update Perplexica Web:**
```bash
./rebuild.sh production web --force-update
```

**Build và force update MCP Server:**
```bash
./rebuild.sh production mcp --force-update
```

**Build và force update tất cả:**
```bash
./rebuild.sh production all --force-update
```

## 📝 Workflow sau khi Commit Code

### Option 1: Rebuild tất cả (Khuyến nghị cho lần đầu)

```bash
# 1. Commit code
git add .
git commit -m "Add Bedrock support"
git push

# 2. Rebuild và deploy tất cả
cd aws-cloudformation
./rebuild.sh production all --force-update
```

### Option 2: Rebuild chỉ service đã thay đổi

**Nếu chỉ sửa code trong `src/` (Perplexica Web):**
```bash
git commit -m "Update web app"
cd aws-cloudformation
./rebuild.sh production web --force-update
```

**Nếu chỉ sửa code trong `apps/mcp-server/` (MCP Server):**
```bash
git commit -m "Update MCP server"
cd aws-cloudformation
./rebuild.sh production mcp --force-update
```

## 🔍 Kiểm tra Status

### Xem ECS Service Status

```bash
# Lấy cluster name
CLUSTER=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \
  --output text)

# Xem tất cả services
aws ecs list-services --cluster ${CLUSTER} --region ap-southeast-1

# Xem chi tiết một service
aws ecs describe-services \
  --cluster ${CLUSTER} \
  --services production-perplexica-web \
  --region ap-southeast-1 \
  --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount,Deployments:deployments[*].{Status:status,Running:runningCount}}"
```

### Xem Logs

```bash
# Logs của Perplexica Web
aws logs tail /aws/ecs/perplexica-production-web --follow --region ap-southeast-1

# Logs của MCP Server
aws logs tail /aws/ecs/perplexica-production-mcp-server --follow --region ap-southeast-1
```

## ⚙️ Cấu hình

Script tự động detect:
- **Environment**: Mặc định `production`, có thể thay đổi
- **Region**: Từ biến môi trường `AWS_REGION` hoặc mặc định `ap-southeast-1`
- **ECR Repositories**: Tự động lấy từ CloudFormation stack outputs
- **ECS Services**: Tự động detect từ stack

## 🎯 Khi nào cần rebuild?

### Cần rebuild khi:
- ✅ Sửa code trong `src/` → Rebuild **web**
- ✅ Sửa code trong `apps/mcp-server/` → Rebuild **mcp**
- ✅ Sửa `app.dockerfile` → Rebuild **web**
- ✅ Sửa `apps/mcp-server/Dockerfile` → Rebuild **mcp**
- ✅ Thêm dependencies mới → Rebuild service tương ứng

### Không cần rebuild khi:
- ❌ Chỉ sửa `config.toml` (config được mount từ EFS)
- ❌ Chỉ sửa CloudFormation templates (chỉ cần `update` stack)
- ❌ Chỉ sửa documentation

## 🔄 So sánh với deploy.sh

| Script | Mục đích | Khi nào dùng |
|--------|----------|--------------|
| `deploy.sh` | Deploy CloudFormation stack | Lần đầu deploy, thay đổi infrastructure |
| `rebuild.sh` | Rebuild và update Docker images | Sau khi commit code, cần deploy code mới |

## 💡 Tips

1. **Build nhanh hơn**: Nếu chỉ sửa 1 service, chỉ rebuild service đó
   ```bash
   ./rebuild.sh production web --force-update
   ```

2. **Kiểm tra trước khi deploy**: Build và push trước, sau đó mới force update
   ```bash
   ./rebuild.sh production web          # Build và push
   # Kiểm tra image trên ECR
   ./rebuild.sh production web --force-update  # Force update
   ```

3. **Monitor deployment**: Sau khi force update, monitor logs để đảm bảo service chạy OK
   ```bash
   aws logs tail /aws/ecs/perplexica-production-web --follow
   ```

4. **Rollback nếu cần**: Nếu có vấn đề, có thể rollback về image cũ bằng cách update task definition với image tag cũ

## 🐛 Troubleshooting

### Lỗi: "Stack does not exist"
```bash
# Kiểm tra stack name
aws cloudformation describe-stacks --region ap-southeast-1 | grep StackName
```

### Lỗi: "Service not found"
```bash
# List tất cả services trong cluster
CLUSTER=$(aws cloudformation describe-stacks \
  --stack-name perplexica-production \
  --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \
  --output text)
aws ecs list-services --cluster ${CLUSTER}
```

### Service không update sau khi force update
```bash
# Kiểm tra task definition có đúng image không
aws ecs describe-task-definition \
  --task-definition production-perplexica-web \
  --query "taskDefinition.containerDefinitions[0].image"
```

