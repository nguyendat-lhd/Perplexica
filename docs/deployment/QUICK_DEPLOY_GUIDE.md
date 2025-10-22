# ⚡ Quick Deploy Guide - EC2 Deployment

## 🎯 Mục tiêu
Deploy Perplexica lên AWS EC2 thông qua GitHub Actions

## ✅ Prerequisites
- [x] GitHub repository với code
- [x] AWS Account
- [x] GitHub Actions workflows đã setup

## 🚀 3 Bước Deploy Nhanh

### Bước 1️⃣: Setup AWS Credentials (5 phút)

**Tạo IAM User:**
```
AWS Console → IAM → Users → Create User
- Name: github-actions-perplexica
- Permissions: AmazonEC2FullAccess + CloudFormationFullAccess
- Lấy Access Key ID và Secret Access Key
```

**Tạo EC2 Key Pair:**
```
AWS Console → EC2 → Key Pairs → Create
- Name: trangvang-perplexica-key
- Type: RSA, Format: .pem
- Download file .pem
```

### Bước 2️⃣: Add GitHub Secrets (3 phút)

```
GitHub Repository → Settings → Secrets and variables → Actions
```

Add 3 secrets:

| Secret Name | Value | Note |
|-------------|-------|------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Từ IAM User |
| `AWS_SECRET_ACCESS_KEY` | `xxx...` | Từ IAM User |
| `EC2_SSH_PRIVATE_KEY` | Nội dung file .pem | Copy toàn bộ file |

**Format EC2_SSH_PRIVATE_KEY:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(nhiều dòng)
-----END RSA PRIVATE KEY-----
```

### Bước 3️⃣: Trigger Deployment (1 phút)

**Cách 1: Auto Deploy (Recommended)**
```bash
# Push bất kỳ thay đổi nào
git add .
git commit -m "deploy to EC2"
git push origin develop-deployment

# Hoặc empty commit để trigger
git commit --allow-empty -m "trigger deployment"
git push origin develop-deployment
```

**Cách 2: Manual Deploy**
```
GitHub → Actions → "Deploy to EC2 Staging" → Run workflow
```

---

## 📊 Monitor Deployment

### Xem Progress
```
GitHub → Actions → Deploy to EC2 Staging
```

Timeline (khoảng 5-10 phút):
```
1. ✅ Build & Test (2 phút)
2. 🚀 Create EC2 (3-5 phút, chỉ lần đầu)
3. 📦 Deploy App (2 phút)
4. 🏥 Health Check (30s)
5. ✅ Done!
```

### Deployment Summary
Sau khi xong, xem tab **Summary**:
```
Instance IP: 13.229.xxx.xxx
Application: http://13.229.xxx.xxx:3000
```

---

## 🎉 Verify Deployment

### Test Application
```bash
# Copy IP từ deployment summary
curl http://<ec2-ip>:3000/api/config

# Mở browser
open http://<ec2-ip>:3000
```

### SSH to EC2
```bash
# Download private key từ AWS (nếu chưa có)
chmod 400 trangvang-perplexica-key.pem

# SSH
ssh -i trangvang-perplexica-key.pem ubuntu@<ec2-ip>

# Check PM2
pm2 status
pm2 logs perplexica
```

---

## 🐛 Quick Troubleshooting

### ❌ "Credentials could not be loaded"
```
→ Check GitHub Secrets (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
→ Verify IAM user permissions
```

### ❌ "Key pair does not exist"
```
→ Create key pair: trangvang-perplexica-key
→ Region phải là: ap-southeast-1
```

### ❌ "SSH connection timeout"
```
→ Check EC2_SSH_PRIVATE_KEY format (phải có BEGIN/END)
→ Check security group allows port 22
```

### ❌ "Application won't start"
```bash
# SSH vào EC2
ssh -i key.pem ubuntu@<ec2-ip>

# Check logs
pm2 logs perplexica --lines 100

# Restart
pm2 restart perplexica
```

---

## 📋 Quick Commands

```bash
# Trigger deployment
git commit --allow-empty -m "deploy" && git push

# SSH to EC2
ssh -i key.pem ubuntu@<ec2-ip>

# PM2 commands (on EC2)
pm2 status              # Check status
pm2 logs perplexica     # View logs
pm2 restart perplexica  # Restart app
pm2 monit               # Monitor

# Check app
curl http://<ec2-ip>:3000/api/config
```

---

## 🔄 Continuous Deployment

Sau lần đầu setup, mỗi khi push code:

```bash
git add .
git commit -m "update feature"
git push origin develop-deployment
```

→ **Tự động deploy lên EC2!** 🚀

---

## 📚 Full Documentation

- `SETUP_EC2_DEPLOYMENT.md` - Chi tiết setup từng bước
- `DEPLOYMENT_WORKFLOW.md` - Quy trình deployment
- `DEPLOYMENT_SUMMARY.md` - Tổng quan về deployment
- `GITHUB_WORKFLOWS_STATUS.md` - Status các workflows

---

## ⏱️ Timeline Summary

```
Total Time: ~15-20 phút (lần đầu)
├─ Setup AWS (5-8 phút)
├─ Add GitHub Secrets (2-3 phút)
├─ Trigger & Wait (8-10 phút)
└─ Verify (2 phút)

Deployments tiếp theo: ~5 phút
```

---

**Next:** Access your app at `http://<ec2-ip>:3000` 🎉

