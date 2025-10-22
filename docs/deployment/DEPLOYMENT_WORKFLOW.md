# Deployment Workflow cho Perplexica

## Tổng quan

Workflow deployment tự động cho Perplexica lên EC2 instance với các tính năng:
- ✅ Tự động build và test
- ✅ Tự động tạo EC2 infrastructure (nếu chưa có)
- ✅ Deploy code lên EC2
- ✅ Setup PM2 process manager
- ✅ Health check và monitoring

## Quy trình hoạt động

### 1. Trigger Deployment

Workflow tự động chạy khi:
- Push code lên branch `develop-deployment`
- Hoặc trigger thủ công từ GitHub Actions UI

### 2. Build & Test Phase

```yaml
- Install dependencies: npm ci
- Run linting: npm run lint (cho phép warnings)
- Run type checking: npx tsc --noEmit (cho phép warnings)
- Database migration: npm run db:migrate
- Build Next.js: npm run build
```

### 3. Infrastructure Setup

Workflow sẽ kiểm tra và tạo EC2 infrastructure nếu chưa có:

```bash
Stack Name: trangvang-perplexica-staging
Instance Type: t3.small
Volume Size: 20GB
Region: ap-southeast-1 (Singapore)
```

**CloudFormation Parameters:**
- KeyName: trangvang-perplexica-key
- AllocateElasticIP: true (IP tĩnh)
- DomainName: staging-perplexica.trangvang.ai
- EmailAddress: admin@trangvang.ai

### 4. EC2 Setup Phase

Tự động setup các dependencies trên EC2:

```bash
- Update system packages
- Install Node.js 18.x
- Install PM2 globally
- Create app directory: /var/www/perplexica
- Set permissions cho ubuntu user
```

### 5. Application Deployment

Deploy code lên EC2:

```bash
1. Tạo deployment package (tar.gz)
   - Exclude: node_modules, .git, .next/cache

2. Copy lên EC2 qua SCP

3. Extract và install trên EC2:
   - npm ci --production
   - npm run build (nếu cần)
   - PM2 start ecosystem.config.js
   - PM2 save và setup startup
```

### 6. Health Check

```bash
- Đợi 10s để app khởi động
- Check PM2 status
- Xem PM2 logs (50 dòng cuối)
```

## GitHub Secrets cần thiết

### AWS Credentials
```bash
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
```

### EC2 SSH Key
```bash
EC2_SSH_PRIVATE_KEY=<nội-dung-file-pem>
```

## Setup GitHub Secrets

### 1. AWS Access Keys

```bash
# Tạo IAM User với quyền:
- AmazonEC2FullAccess
- CloudFormationFullAccess
- AWSCloudFormationReadOnlyAccess

# Lấy Access Key ID và Secret Access Key
```

### 2. EC2 SSH Private Key

```bash
# Nếu đã có file .pem:
cat trangvang-perplexica-key.pem

# Copy toàn bộ nội dung (bao gồm -----BEGIN RSA PRIVATE KEY-----)
# Paste vào GitHub Secret: EC2_SSH_PRIVATE_KEY
```

### 3. Add vào GitHub

1. Vào repository: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add từng secret:
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: `<your-key>`
   - Click `Add secret`
4. Lặp lại cho các secrets khác

## Sử dụng

### Deploy tự động

```bash
# Commit và push code lên develop-deployment
git checkout develop-deployment
git add .
git commit -m "feat: new feature"
git push origin develop-deployment

# Workflow tự động chạy
```

### Deploy thủ công

1. Vào GitHub repository
2. Click tab `Actions`
3. Chọn workflow `Deploy to EC2 Staging`
4. Click `Run workflow`
5. Chọn branch `develop-deployment`
6. Click `Run workflow`

## Kiểm tra deployment

### 1. Xem workflow progress

```
GitHub → Actions → Workflow run đang chạy
```

### 2. Xem deployment summary

Sau khi workflow hoàn thành, xem `Summary` tab:

```markdown
## 🚀 Deployment Summary

**Environment:** Staging
**Branch:** `develop-deployment`
**Commit:** `abc123...`
**Instance IP:** `13.229.xxx.xxx`

### Access
- **Application:** http://13.229.xxx.xxx:3000
- **SSH:** `ssh -i private_key.pem ubuntu@13.229.xxx.xxx`

### Status
✅ Deployment completed successfully!
```

### 3. SSH vào EC2

```bash
# Sử dụng private key từ CloudFormation
ssh -i trangvang-perplexica-key.pem ubuntu@<instance-ip>

# Check PM2 status
pm2 status

# Xem logs
pm2 logs perplexica

# Restart app
pm2 restart perplexica
```

### 4. Kiểm tra application

```bash
# Test API endpoint
curl http://<instance-ip>:3000/api/health

# Test web interface
# Mở browser: http://<instance-ip>:3000
```

## PM2 Process Manager

### Ecosystem Config

```javascript
// ecosystem.config.js
{
  name: 'perplexica',
  script: 'npm',
  args: 'start',
  cwd: '/var/www/perplexica',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: 'production',
    PORT: 3000
  }
}
```

### PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs perplexica
pm2 logs perplexica --lines 100

# Restart
pm2 restart perplexica

# Stop
pm2 stop perplexica

# Delete
pm2 delete perplexica

# Monitor
pm2 monit
```

## Troubleshooting

### Workflow fails tại build step

```bash
# Linting errors
- Check code với: npm run lint
- Fix errors locally

# Type errors
- Check với: npx tsc --noEmit
- Fix type errors
```

### Workflow fails tại deploy step

```bash
# SSH connection timeout
- Check security group cho phép SSH (port 22)
- Check EC2_SSH_PRIVATE_KEY secret đúng format

# SCP failed
- Check disk space trên EC2
- Check permissions của /var/www/perplexica
```

### Application không start

```bash
# SSH vào EC2
ssh -i key.pem ubuntu@<instance-ip>

# Check PM2 logs
pm2 logs perplexica --lines 100

# Check if port 3000 đang được sử dụng
sudo netstat -tlnp | grep 3000

# Restart manually
cd /var/www/perplexica
pm2 delete perplexica
pm2 start ecosystem.config.js
```

### CloudFormation stack creation failed

```bash
# Check AWS Console → CloudFormation
# Xem Events tab để biết lỗi

# Common issues:
- Key pair không tồn tại
- VPC/Subnet issues
- IAM permissions
```

## Monitoring & Logs

### CloudWatch Logs (nếu có setup)

```bash
# EC2 instance logs
/var/log/perplexica/combined.log
/var/log/perplexica/out.log
/var/log/perplexica/error.log
```

### PM2 Logs

```bash
# Real-time logs
pm2 logs perplexica

# Last 100 lines
pm2 logs perplexica --lines 100 --nostream

# Error logs only
pm2 logs perplexica --err
```

### System Logs

```bash
# SSH vào EC2
ssh -i key.pem ubuntu@<instance-ip>

# System logs
sudo journalctl -u pm2-ubuntu

# Nginx logs (nếu có)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Rollback

### 1. Rollback thủ công

```bash
# SSH vào EC2
ssh -i key.pem ubuntu@<instance-ip>

# Checkout previous commit
cd /var/www/perplexica
git fetch origin
git checkout <previous-commit-hash>

# Install và rebuild
npm ci
npm run build

# Restart PM2
pm2 restart perplexica
```

### 2. Rollback qua workflow

```bash
# Trigger workflow với commit cũ
git checkout develop-deployment
git revert <bad-commit>
git push origin develop-deployment

# Hoặc force push commit cũ (CẢNH BÁO!)
git reset --hard <good-commit>
git push -f origin develop-deployment
```

## Performance Tuning

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
{
  instances: 'max', // Hoặc số cụ thể: 2, 4
  exec_mode: 'cluster'
}
```

### Memory Management

```javascript
{
  max_memory_restart: '1G', // Restart nếu vượt 1GB
  node_args: '--max-old-space-size=2048' // Tăng heap size
}
```

## Security Best Practices

### 1. Restrict SSH Access

```yaml
# CloudFormation Parameter
SSHLocation: <your-ip>/32  # Thay vì 0.0.0.0/0
```

### 2. Use IAM Roles

```yaml
# Thay vì AWS Access Keys, dùng IAM Role cho EC2
```

### 3. Enable HTTPS

```bash
# Setup Let's Encrypt
sudo certbot --nginx -d staging-perplexica.trangvang.ai
```

### 4. Environment Variables

```bash
# Không commit sensitive data
# Sử dụng GitHub Secrets hoặc AWS Secrets Manager
```

## Next Steps

1. ✅ Setup monitoring với CloudWatch
2. ✅ Add auto-scaling policies
3. ✅ Setup HTTPS với Let's Encrypt
4. ✅ Add database backup automation
5. ✅ Setup CI/CD cho production environment

## Support

Nếu gặp vấn đề, check:
1. GitHub Actions workflow logs
2. AWS CloudFormation Events
3. EC2 System logs
4. PM2 application logs

Hoặc tạo issue trên GitHub repository.

