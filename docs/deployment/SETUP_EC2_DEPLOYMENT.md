# 🚀 Hướng dẫn Setup EC2 Deployment

## 📋 Yêu cầu

Workflow deploy đã sẵn sàng và sẽ **tự động chạy** khi push code. Tuy nhiên, cần setup GitHub Secrets trước.

## 🔐 Bước 1: Tạo AWS Credentials

### 1.1. Tạo IAM User cho GitHub Actions

**Vào AWS Console:**
```
AWS Console → IAM → Users → Create User
```

**Thông tin User:**
- User Name: `github-actions-perplexica`
- Access Type: ✅ Programmatic access (Access Key)

**Permissions cần thiết:**
```json
Policies cần attach:
1. AmazonEC2FullAccess
2. CloudFormationFullAccess
3. IAMReadOnlyAccess (optional, cho monitoring)
```

**Lấy Credentials:**
```
Sau khi tạo user, AWS sẽ hiển thị:
- Access Key ID: AKIA...
- Secret Access Key: xxx...

⚠️ LƯU Ý: Chỉ hiển thị 1 lần duy nhất!
Copy và lưu ngay.
```

### 1.2. Hoặc sử dụng AWS CLI

Nếu đã có AWS CLI configured:

```bash
# Tạo IAM user
aws iam create-user --user-name github-actions-perplexica

# Attach policies
aws iam attach-user-policy \
  --user-name github-actions-perplexica \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

aws iam attach-user-policy \
  --user-name github-actions-perplexica \
  --policy-arn arn:aws:iam::aws:policy/AWSCloudFormationFullAccess

# Tạo access key
aws iam create-access-key --user-name github-actions-perplexica

# Output:
# AccessKeyId: AKIA...
# SecretAccessKey: xxx...
```

---

## 🔑 Bước 2: Tạo EC2 Key Pair

### 2.1. Tạo Key Pair trên AWS Console

```
AWS Console → EC2 → Key Pairs → Create Key Pair
```

**Thông tin:**
- Name: `trangvang-perplexica-key`
- Key pair type: RSA
- Private key file format: `.pem`

**Download file `.pem`:**
```bash
# File tự động download: trangvang-perplexica-key.pem
# Copy nội dung file này để paste vào GitHub Secret
```

### 2.2. Hoặc sử dụng AWS CLI

```bash
# Tạo key pair và lưu vào file
aws ec2 create-key-pair \
  --key-name trangvang-perplexica-key \
  --query 'KeyMaterial' \
  --output text \
  --region ap-southeast-1 > trangvang-perplexica-key.pem

# Set permissions
chmod 400 trangvang-perplexica-key.pem

# Xem nội dung để copy
cat trangvang-perplexica-key.pem
```

### 2.3. Nếu đã có Key Pair

Nếu đã có file `.pem` từ trước:

```bash
# Chỉ cần copy nội dung
cat trangvang-perplexica-key.pem

# Output sẽ có dạng:
# -----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# ...nhiều dòng...
# -----END RSA PRIVATE KEY-----

# Copy TOÀN BỘ (bao gồm BEGIN và END)
```

---

## 📦 Bước 3: Add GitHub Secrets

### 3.1. Vào GitHub Repository Settings

```
GitHub Repository → Settings → Secrets and variables → Actions
```

### 3.2. Add các Secrets

Click **"New repository secret"** và add từng secret:

#### Secret 1: AWS_ACCESS_KEY_ID
```
Name: AWS_ACCESS_KEY_ID
Value: AKIA... (Access Key ID từ bước 1)
```

#### Secret 2: AWS_SECRET_ACCESS_KEY
```
Name: AWS_SECRET_ACCESS_KEY
Value: xxx... (Secret Access Key từ bước 1)
```

#### Secret 3: EC2_SSH_PRIVATE_KEY
```
Name: EC2_SSH_PRIVATE_KEY
Value: (Paste TOÀN BỘ nội dung file .pem)

-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----

⚠️ LƯU Ý: 
- Phải bao gồm dòng BEGIN và END
- Không có space thừa ở đầu/cuối
- Giữ nguyên format xuống dòng
```

### 3.3. Verify Secrets

Sau khi add xong, bạn sẽ thấy 3 secrets:

```
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ EC2_SSH_PRIVATE_KEY
```

---

## 🚀 Bước 4: Trigger Deployment

Bạn có 2 cách để deploy:

### Cách 1: Automatic Deployment (Recommended)

Workflow đã được cấu hình để **tự động chạy** khi push:

```bash
# Workflow sẽ tự động chạy với push bất kỳ
git checkout develop-deployment
git add .
git commit -m "trigger deployment"
git push origin develop-deployment

# Hoặc nếu không có thay đổi, tạo empty commit
git commit --allow-empty -m "trigger EC2 deployment"
git push origin develop-deployment
```

### Cách 2: Manual Deployment

1. Vào GitHub Repository
2. Click tab **Actions**
3. Chọn workflow **"Deploy to EC2 Staging"**
4. Click nút **"Run workflow"** (bên phải)
5. Chọn branch: `develop-deployment`
6. Click **"Run workflow"**

---

## 📊 Bước 5: Monitor Deployment

### 5.1. Xem Progress

```
GitHub → Actions → Deploy to EC2 Staging
```

Workflow sẽ chạy các steps:
```
1. ✅ Checkout code
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Linting (allow warnings)
5. ✅ Type checking (allow warnings)
6. ✅ Database migration
7. ✅ Build Next.js
8. ✅ Configure AWS credentials
9. ✅ Check if EC2 exists
10. 🚀 Create EC2 infrastructure (if needed)
11. 📍 Get EC2 instance IP
12. 🔑 Setup SSH key
13. ⏳ Wait for EC2 to be ready
14. 🔧 Setup EC2 instance (Node.js + PM2)
15. 📦 Deploy application
16. 🏥 Health check
17. ✅ Cleanup
18. 📝 Deployment summary
```

### 5.2. Deployment Summary

Sau khi thành công, xem **Summary** tab:

```markdown
## 🚀 Deployment Summary

**Environment:** Staging
**Branch:** develop-deployment
**Commit:** abc123...
**Instance IP:** 13.229.xxx.xxx

### Access
- **Application:** http://13.229.xxx.xxx:3000
- **SSH:** ssh -i private_key.pem ubuntu@13.229.xxx.xxx

### Status
✅ Deployment completed successfully!
```

---

## 🎯 Bước 6: Verify Deployment

### 6.1. Test Application

```bash
# Get IP từ deployment summary
IP=<ec2-ip-from-summary>

# Test API
curl http://$IP:3000/api/config

# Test web interface
# Mở browser: http://<ec2-ip>:3000
```

### 6.2. SSH vào EC2

```bash
# Sử dụng private key đã tạo
ssh -i trangvang-perplexica-key.pem ubuntu@<ec2-ip>

# Check PM2 status
pm2 status

# Xem logs
pm2 logs perplexica

# Xem last 100 lines
pm2 logs perplexica --lines 100
```

### 6.3. Check Application Health

```bash
# On EC2 instance
cd /var/www/perplexica

# Check if app is running
pm2 status

# Check process details
pm2 info perplexica

# Monitor real-time
pm2 monit
```

---

## 🔍 Troubleshooting

### Problem 1: Workflow fails at "Configure AWS credentials"

**Error:**
```
Error: Credentials could not be loaded
```

**Fix:**
```bash
# Check GitHub Secrets:
1. AWS_ACCESS_KEY_ID - Phải chính xác
2. AWS_SECRET_ACCESS_KEY - Phải chính xác
3. Không có space thừa ở đầu/cuối

# Verify IAM user có đúng permissions
```

### Problem 2: Workflow fails at "Create EC2 infrastructure"

**Error:**
```
Error: The key pair 'trangvang-perplexica-key' does not exist
```

**Fix:**
```bash
# Tạo key pair trên AWS:
AWS Console → EC2 → Key Pairs → Create

# Hoặc dùng CLI:
aws ec2 create-key-pair \
  --key-name trangvang-perplexica-key \
  --region ap-southeast-1 \
  --query 'KeyMaterial' \
  --output text > trangvang-perplexica-key.pem
```

### Problem 3: Workflow fails at "Wait for EC2 to be ready"

**Error:**
```
SSH connection timeout
```

**Fix:**
```bash
# Check security group allows SSH (port 22)
# Check EC2_SSH_PRIVATE_KEY format:
- Phải có -----BEGIN RSA PRIVATE KEY-----
- Phải có -----END RSA PRIVATE KEY-----
- Giữ nguyên format xuống dòng
```

### Problem 4: Application won't start on EC2

```bash
# SSH vào EC2
ssh -i key.pem ubuntu@<ec2-ip>

# Check PM2 logs
pm2 logs perplexica --lines 200

# Common issues:
1. Port 3000 already in use
   → pm2 delete all && pm2 start ecosystem.config.js

2. Missing dependencies
   → cd /var/www/perplexica && npm ci

3. Build failed
   → npm run build

# Restart manually
pm2 restart perplexica
pm2 status
```

---

## 📋 Checklist

Trước khi deploy, đảm bảo:

- [ ] ✅ Đã tạo IAM User với EC2 + CloudFormation permissions
- [ ] ✅ Đã lấy AWS Access Key ID và Secret Access Key
- [ ] ✅ Đã tạo EC2 Key Pair (trangvang-perplexica-key)
- [ ] ✅ Đã lưu file .pem
- [ ] ✅ Đã add 3 GitHub Secrets:
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
  - [ ] EC2_SSH_PRIVATE_KEY
- [ ] ✅ Code đã push lên branch develop-deployment
- [ ] ✅ Workflow "Deploy to EC2 Staging" đã trigger

---

## 🎉 Next Steps

Sau khi deployment thành công:

### 1. Setup Domain (Optional)

```bash
# Point domain to EC2 Elastic IP
Domain: staging-perplexica.trangvang.ai
Record Type: A
Value: <ec2-elastic-ip>
```

### 2. Setup HTTPS (Optional)

```bash
# SSH vào EC2
ssh -i key.pem ubuntu@<ec2-ip>

# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d staging-perplexica.trangvang.ai
```

### 3. Setup Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Enable PM2 monitoring dashboard
pm2 web
```

### 4. Regular Deployments

```bash
# Mỗi lần update code:
git add .
git commit -m "update feature"
git push origin develop-deployment

# Workflow tự động deploy!
```

---

## 📞 Support

Nếu gặp vấn đề:

1. **Check GitHub Actions logs:**
   ```
   GitHub → Actions → Failed workflow → View logs
   ```

2. **Check AWS CloudFormation:**
   ```
   AWS Console → CloudFormation → Events tab
   ```

3. **Check EC2 logs:**
   ```bash
   ssh -i key.pem ubuntu@<ec2-ip>
   pm2 logs perplexica
   ```

4. **Review documentation:**
   - `DEPLOYMENT_WORKFLOW.md`
   - `DEPLOYMENT_SUMMARY.md`
   - `GITHUB_WORKFLOWS_STATUS.md`

---

**TL;DR:**
```bash
# 1. Add GitHub Secrets (AWS credentials + SSH key)
# 2. Push code hoặc trigger workflow manually
# 3. Monitor GitHub Actions
# 4. Access app: http://<ec2-ip>:3000
```

🚀 **Ready to deploy!**

