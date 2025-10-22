# ✅ AWS EC2 Deployment Setup - COMPLETED

## 🎉 Setup đã hoàn tất!

Deployment đã được trigger và đang chạy trên GitHub Actions.

---

## 📊 Summary

### 1. IAM User Created
```
Name: github-actions-perplexica
User ID: AIDA4OPNTUZCUXZ32WATI
ARN: arn:aws:iam::855733675589:user/github-actions-perplexica
```

**Permissions:**
- ✅ AmazonEC2FullAccess
- ✅ CloudWatchLogsFullAccess
- ✅ PerplexicaCloudFormationPolicy

### 2. Access Keys Created
```
Access Key ID: AKIA4OPNTUZCTS4KODEQ
Secret Access Key: ************ (saved in .aws-credentials/)
```

### 3. EC2 Key Pair Created
```
Name: trangvang-perplexica-key
Region: ap-southeast-1
File: .aws-credentials/trangvang-perplexica-key.pem
```

### 4. GitHub Secrets Added
```
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ EC2_SSH_PRIVATE_KEY
```

---

## 🚀 Deployment Status

**GitHub Actions Workflow:** Deploy to EC2 Staging

**Monitor deployment:**
```
https://github.com/nguyendat-lhd/Perplexica/actions
```

**Expected Timeline:**
```
1. Build & Test         : ~2 minutes
2. Create EC2           : ~5 minutes (first time only)
3. Deploy Application   : ~2 minutes
4. Health Check         : ~30 seconds
─────────────────────────────────────
Total (first time)      : ~10 minutes
Total (after first)     : ~5 minutes
```

---

## 📋 Deployment Workflow Steps

GitHub Actions sẽ tự động thực hiện:

### Phase 1: Build
- [x] Checkout code
- [x] Setup Node.js 18
- [x] Install dependencies
- [x] Run linting (allow warnings)
- [x] Run type checking (allow warnings)
- [x] Database migration
- [x] Build Next.js

### Phase 2: Infrastructure
- [ ] Configure AWS credentials
- [ ] Check if EC2 stack exists
- [ ] Create CloudFormation stack (if needed)
  - Instance Type: t3.small
  - Volume Size: 20GB
  - Region: ap-southeast-1
  - Elastic IP: Yes
- [ ] Get EC2 instance IP

### Phase 3: Deployment
- [ ] Setup SSH key
- [ ] Wait for EC2 ready
- [ ] Setup EC2 (Node.js + PM2)
- [ ] Deploy application
- [ ] Start PM2 process
- [ ] Health check

### Phase 4: Complete
- [ ] Cleanup
- [ ] Generate deployment summary

---

## 🔍 Monitor Progress

### 1. GitHub Actions
```bash
# Open in browser
open https://github.com/nguyendat-lhd/Perplexica/actions

# Or use CLI
gh run watch
```

### 2. Check Workflow Logs
```
GitHub → Actions → Deploy to EC2 Staging → View logs
```

### 3. Get Deployment Summary

Sau khi workflow hoàn thành, xem tab **Summary** để lấy:
- EC2 Instance IP
- Application URL
- SSH command

---

## 📍 After Deployment Completes

### Access Application

```bash
# Get IP from deployment summary
IP=<ec2-ip-from-summary>

# Test API
curl http://$IP:3000/api/config

# Open in browser
open http://$IP:3000
```

### SSH to EC2

```bash
# SSH vào instance
ssh -i .aws-credentials/trangvang-perplexica-key.pem ubuntu@<ec2-ip>

# Check PM2 status
pm2 status

# View logs
pm2 logs perplexica

# Monitor real-time
pm2 monit
```

---

## 🗂️ Files Created

```
.aws-credentials/
├── .gitkeep
├── github-actions-credentials.txt   # AWS credentials
└── trangvang-perplexica-key.pem    # EC2 SSH key
```

**⚠️ QUAN TRỌNG:**
- Folder `.aws-credentials/` đã được add vào `.gitignore`
- **KHÔNG BAO GIỜ commit credentials lên GitHub**
- Backup file `.pem` ở nơi an toàn

---

## 🔄 Continuous Deployment

Sau lần setup này, mỗi khi push code:

```bash
git add .
git commit -m "update feature"
git push origin develop-deployment
```

→ **Tự động deploy lên EC2!** 🚀

---

## 📚 Next Steps

### 1. Wait for Deployment (10 phút)
```
Monitor: https://github.com/nguyendat-lhd/Perplexica/actions
```

### 2. Get EC2 IP
```
Xem deployment summary hoặc:
aws cloudformation describe-stacks \
  --stack-name trangvang-perplexica-staging \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
  --output text \
  --region ap-southeast-1
```

### 3. Test Application
```bash
curl http://<ec2-ip>:3000/api/config
```

### 4. Setup Domain (Optional)
```
Domain: staging-perplexica.trangvang.ai
Record Type: A
Value: <ec2-elastic-ip>
```

### 5. Setup HTTPS (Optional)
```bash
ssh -i .aws-credentials/trangvang-perplexica-key.pem ubuntu@<ec2-ip>
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d staging-perplexica.trangvang.ai
```

---

## 🐛 Troubleshooting

### If deployment fails:

**1. Check GitHub Actions logs:**
```
GitHub → Actions → Failed workflow → View logs
```

**2. Check AWS CloudFormation:**
```bash
aws cloudformation describe-stack-events \
  --stack-name trangvang-perplexica-staging \
  --region ap-southeast-1 \
  --max-items 20
```

**3. Common Issues:**

#### "Stack already exists"
```bash
# Delete existing stack
aws cloudformation delete-stack \
  --stack-name trangvang-perplexica-staging \
  --region ap-southeast-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name trangvang-perplexica-staging \
  --region ap-southeast-1

# Trigger deployment again
git commit --allow-empty -m "retry deployment"
git push origin develop-deployment
```

#### "Key pair does not exist"
```bash
# Verify key pair exists
aws ec2 describe-key-pairs \
  --key-names trangvang-perplexica-key \
  --region ap-southeast-1
```

#### "Insufficient permissions"
```bash
# Check IAM user policies
aws iam list-attached-user-policies \
  --user-name github-actions-perplexica
```

---

## 📞 Support

Nếu cần hỗ trợ:

1. **Documentation:**
   - `DEPLOYMENT_WORKFLOW.md` - Chi tiết workflow
   - `QUICK_DEPLOY_GUIDE.md` - Hướng dẫn nhanh
   - `SETUP_EC2_DEPLOYMENT.md` - Setup chi tiết

2. **AWS Resources:**
   - CloudFormation: https://console.aws.amazon.com/cloudformation
   - EC2: https://console.aws.amazon.com/ec2
   - IAM: https://console.aws.amazon.com/iam

3. **GitHub:**
   - Actions: https://github.com/nguyendat-lhd/Perplexica/actions
   - Secrets: https://github.com/nguyendat-lhd/Perplexica/settings/secrets

---

## 🎯 Summary

```
✅ IAM User:      github-actions-perplexica
✅ Access Keys:   Created and saved
✅ EC2 Key Pair:  trangvang-perplexica-key
✅ GitHub Secrets: Added (3/3)
✅ Deployment:    Triggered and running
```

**Next:** Wait ~10 minutes và check deployment summary! 🎉

---

**Deployment Time:** 2025-10-21 21:35:04 UTC+7  
**AWS Account:** 855733675589  
**Region:** ap-southeast-1 (Singapore)  
**Stack Name:** trangvang-perplexica-staging  
**GitHub Repo:** nguyendat-lhd/Perplexica  
**Branch:** develop-deployment  

