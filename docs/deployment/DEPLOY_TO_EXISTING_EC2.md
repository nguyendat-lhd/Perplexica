# 🎯 Deploy to Existing EC2 Server

## Server Info

```
IP: 13.228.19.21
User: ubuntu
App Directory: /var/www/perplexica
```

## 🔄 Deployment Flow

Workflow mới **KHÔNG TẠO EC2**, chỉ deploy code lên server có sẵn:

```
1. 🔨 Build & Test
   ├─ npm ci
   ├─ npm run lint (allow warnings)
   ├─ npx tsc --noEmit (allow warnings)
   ├─ npm run db:migrate
   └─ npm run build

2. 📦 Create Package
   └─ tar -czf deploy.tar.gz (exclude node_modules, .git, etc)

3. 📤 Copy to EC2
   └─ scp deploy.tar.gz ubuntu@13.228.19.21:/tmp/

4. 🚀 Deploy on Server
   ├─ Extract package to /var/www/perplexica
   ├─ Install dependencies (npm ci --production)
   ├─ Stop PM2 process
   ├─ Start new PM2 process
   └─ Save PM2 process list

5. 🏥 Health Check
   ├─ Wait 10 seconds
   ├─ Check http://13.228.19.21:3000
   └─ Show PM2 status

6. ✅ Complete
   └─ Generate deployment summary
```

## 📋 Prerequisites

### GitHub Secrets Required

Chỉ cần 1 secret:

```
EC2_SSH_PRIVATE_KEY = (nội dung file .pem để SSH vào 13.228.19.21)
```

**Note:** AWS credentials KHÔNG cần thiết cho workflow này!

### Server Requirements

Server `13.228.19.21` cần có:
- [x] Ubuntu/Debian OS
- [x] SSH access (port 22)
- [x] User `ubuntu` với sudo permissions
- [ ] Node.js 18+ (workflow sẽ tự động cài nếu chưa có)
- [ ] PM2 (workflow sẽ tự động cài nếu chưa có)

## 🚀 How to Deploy

### Automatic (Recommended)

Mỗi khi push code:

```bash
git add .
git commit -m "update feature"
git push origin develop-deployment
```

→ Workflow tự động chạy và deploy lên `13.228.19.21`

### Manual Trigger

```
GitHub → Actions → Deploy to Existing EC2 → Run workflow
```

## 📊 Monitor Deployment

### Check Workflow

```
https://github.com/nguyendat-lhd/Perplexica/actions
```

### Watch Progress

```bash
gh run watch
```

### Expected Timeline

```
Total: ~3-5 minutes

├─ Build & Test    : ~2 min
├─ Create Package  : ~10s
├─ Copy to EC2     : ~20s (tùy package size)
├─ Deploy on EC2   : ~1 min
└─ Health Check    : ~30s
```

## 🎯 After Deployment

### Access Application

```bash
# Web interface
http://13.228.19.21:3000

# API
http://13.228.19.21:3000/api/config
```

### SSH to Server

```bash
# Sử dụng private key
ssh -i .aws-credentials/trangvang-perplexica-key.pem ubuntu@13.228.19.21

# Check PM2 status
pm2 status

# View logs
pm2 logs perplexica

# Restart if needed
pm2 restart perplexica
```

## 📁 Deployment Structure on EC2

```
/var/www/perplexica/
├── .next/              # Built Next.js app
├── node_modules/       # Production dependencies
├── public/             # Static files
├── src/                # Source code
├── package.json
├── ecosystem.config.js # PM2 config
└── backup/             # Previous deployment backup
```

## 🔧 PM2 Configuration

Workflow sử dụng `ecosystem.config.js`:

```javascript
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

## 🐛 Troubleshooting

### Problem 1: SSH Connection Failed

```
Error: Permission denied (publickey)
```

**Fix:**
```bash
# Check GitHub Secret EC2_SSH_PRIVATE_KEY
# Phải có format đúng:
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----

# Test SSH locally:
ssh -i key.pem ubuntu@13.228.19.21
```

### Problem 2: Application Won't Start

```bash
# SSH vào server
ssh -i key.pem ubuntu@13.228.19.21

# Check PM2 logs
pm2 logs perplexica --lines 100

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000

# Restart manually
pm2 restart perplexica
```

### Problem 3: Health Check Failed

```
Warning: Application may not be fully ready yet
```

**Reasons:**
- Application takes longer to start
- Port 3000 not accessible from internet
- Firewall/Security group blocking traffic

**Fix:**
```bash
# Check if app is running locally on server
ssh ubuntu@13.228.19.21
curl http://localhost:3000

# Check security group allows port 3000
# AWS Console → EC2 → Security Groups
```

### Problem 4: Out of Disk Space

```
Error: ENOSPC: no space left on device
```

**Fix:**
```bash
# SSH to server
ssh ubuntu@13.228.19.21

# Check disk usage
df -h

# Clean up
sudo apt-get clean
sudo apt-get autoremove
pm2 flush  # Clear PM2 logs
rm -rf /tmp/*

# Or increase EBS volume size
```

## 🔄 Rollback

### Quick Rollback

```bash
# SSH to server
ssh -i key.pem ubuntu@13.228.19.21

# Use backup
cd /var/www/perplexica
rm -rf .next
mv backup/.next .next

# Restart PM2
pm2 restart perplexica
```

### Deploy Previous Commit

```bash
# Checkout previous commit locally
git checkout <previous-commit-hash>

# Push to trigger deployment
git push origin develop-deployment -f
```

## 📊 Comparison với CloudFormation Workflow

| Feature | Existing EC2 | CloudFormation |
|---------|-------------|----------------|
| Tạo EC2 | ❌ No | ✅ Yes (nếu chưa có) |
| Deploy time | ~3-5 min | ~10-15 min (lần đầu) |
| AWS credentials | ❌ Not needed | ✅ Required |
| Server | `13.228.19.21` | Dynamic IP |
| Setup | Simple | Complex |
| Best for | Production | Testing/Staging |

## 🎯 Best Practices

### 1. Backup Strategy

Workflow tự động backup `.next` folder trước mỗi deployment:

```
/var/www/perplexica/backup/
└── .next/  # Previous build
```

### 2. Zero-Downtime Deployment

```bash
# PM2 reload instead of restart (no downtime)
pm2 reload perplexica
```

### 3. Environment Variables

```bash
# Trên server, tạo .env file
ssh ubuntu@13.228.19.21
cd /var/www/perplexica
nano .env

# Add environment variables
NODE_ENV=production
PORT=3000
DATABASE_URL=...
```

### 4. Monitoring

```bash
# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Real-time monitoring
pm2 monit
```

## 🔐 Security

### SSH Key Management

```
✅ DO: Store SSH key in GitHub Secrets
✅ DO: Use restrictive permissions (chmod 600)
❌ DON'T: Commit SSH keys to repository
❌ DON'T: Share SSH keys
```

### Server Security

```bash
# Update system regularly
sudo apt update && sudo apt upgrade

# Enable firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Application
sudo ufw enable

# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

## 📚 Related Documentation

- `DEPLOYMENT_WORKFLOW.md` - General deployment guide
- `QUICK_DEPLOY_GUIDE.md` - Quick start
- `DEPLOYMENT_COMPLETED.md` - Setup completion summary

## 🎉 Summary

```
✅ Simple SSH-based deployment
✅ No AWS CloudFormation needed
✅ Deploy lên server cố định: 13.228.19.21
✅ Automatic backup before deployment
✅ PM2 process management
✅ Health check after deployment
✅ ~3-5 minutes deployment time
```

**Next:** Just push code → Automatic deployment! 🚀

---

**Server:** 13.228.19.21  
**App Dir:** /var/www/perplexica  
**Workflow:** .github/workflows/deploy-to-existing-ec2.yml  
**PM2 Process:** perplexica  

