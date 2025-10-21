# Node.js CI/CD Setup Guide

Hướng dẫn setup CI/CD cho Perplexica sử dụng Node.js thay vì Docker.

## 📋 Tổng quan

### Kiến trúc hệ thống
- **Frontend**: Next.js 15.2.2
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)
- **SSL**: Let's Encrypt (Certbot)
- **Infrastructure**: AWS EC2 + CloudFormation
- **CI/CD**: GitHub Actions

### Các file chính
- `ecosystem.config.js` - PM2 configuration
- `scripts/deploy-nodejs.sh` - Deployment script
- `scripts/setup-ec2-nodejs.sh` - EC2 setup script
- `scripts/health-check-nodejs.sh` - Health check script
- `.github/workflows/deploy-nodejs.yml` - GitHub Actions workflow

---

## 🚀 Quick Start

### 1. Cấu hình GitHub Secrets

Thêm các secrets sau vào GitHub repository:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# LLM API Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
CUSTOM_OPENAI_API_KEY=your_custom_openai_key

# Optional: Slack notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 2. Tạo EC2 Key Pair

```bash
# Tạo key pair trên AWS
aws ec2 create-key-pair --key-name perplexica-key --query 'KeyMaterial' --output text > ~/.ssh/perplexica-key.pem
chmod 400 ~/.ssh/perplexica-key.pem
```

### 3. Deploy lần đầu

#### Staging Environment
```bash
# Deploy staging
./scripts/deploy-nodejs.sh staging

# Hoặc với IP cụ thể
./scripts/deploy-nodejs.sh staging 1.2.3.4
```

#### Production Environment
```bash
# Deploy production
./scripts/deploy-nodejs.sh production

# Hoặc với IP cụ thể
./scripts/deploy-nodejs.sh production 1.2.3.4
```

---

## 🔧 Chi tiết Setup

### 1. EC2 Instance Setup

Script `setup-ec2-nodejs.sh` sẽ tự động cài đặt:

- **Node.js 18**: Runtime environment
- **PM2**: Process manager
- **Nginx**: Web server và reverse proxy
- **Certbot**: SSL certificate management
- **Build tools**: Python3, build-essential
- **Firewall**: UFW configuration

### 2. Application Deployment

Script `deploy-nodejs.sh` sẽ:

1. **Build application**: `npm run build`
2. **Create deployment package**: Tar.gz với code
3. **Upload to EC2**: SCP deployment package
4. **Install dependencies**: `npm ci --production`
5. **Run migrations**: `npm run db:migrate`
6. **Start with PM2**: `pm2 start ecosystem.config.js`
7. **Health check**: Verify application is running

### 3. PM2 Configuration

File `ecosystem.config.js` cấu hình:

```javascript
{
  name: 'perplexica',
  script: 'npm',
  args: 'start',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000
  }
}
```

### 4. Nginx Configuration

Nginx được cấu hình để:

- **Reverse proxy** đến Node.js app (port 3000)
- **SSL termination** với Let's Encrypt
- **Static file caching**
- **Gzip compression**
- **Security headers**

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

File `.github/workflows/deploy-nodejs.yml` bao gồm:

#### Staging Deployment
- **Trigger**: Push to `develop` branch
- **Steps**:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run linting & type checking
  5. Build application
  6. Deploy to EC2
  7. Health check
  8. Slack notification

#### Production Deployment
- **Trigger**: Push to `main` branch hoặc manual dispatch
- **Steps**: Tương tự staging + approval required

### Manual Deployment

```bash
# Deploy staging
gh workflow run deploy-nodejs.yml -f environment=staging

# Deploy production
gh workflow run deploy-nodejs.yml -f environment=production
```

---

## 📊 Monitoring & Health Checks

### Health Check Script

```bash
# Check staging
./scripts/health-check-nodejs.sh staging

# Check production
./scripts/health-check-nodejs.sh production
```

Script sẽ kiểm tra:

- ✅ EC2 connectivity
- ✅ PM2 process status
- ✅ Application health endpoint
- ✅ Nginx status
- ✅ SSL certificate
- ✅ System resources (CPU, Memory, Disk)
- ✅ Response time

### PM2 Monitoring

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs perplexica

# Restart service
pm2 restart perplexica

# Monitor resources
pm2 monit
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔐 Security

### SSL Certificate

```bash
# Setup SSL cho domain
sudo certbot --nginx -d perplexica.trangvang.ai

# Auto-renewal
sudo crontab -e
# Thêm: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall

```bash
# Check status
sudo ufw status

# Allow specific ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
```

### PM2 Security

```bash
# Setup PM2 key
pm2 link <secret_key> <public_key>

# Disable PM2 web interface
pm2 set pm2:autodump false
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. EC2 Connection Failed
```bash
# Check key permissions
chmod 400 ~/.ssh/perplexica-key.pem

# Test connection
ssh -i ~/.ssh/perplexica-key.pem ubuntu@EC2_IP
```

#### 2. PM2 Process Not Starting
```bash
# Check logs
pm2 logs perplexica

# Check ecosystem config
pm2 show perplexica

# Restart
pm2 restart perplexica
```

#### 3. Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Log Locations

- **Application logs**: `/var/log/perplexica/`
- **PM2 logs**: `pm2 logs perplexica`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `journalctl -u nginx`

---

## 📈 Performance Optimization

### PM2 Clustering

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'perplexica',
    script: 'npm',
    args: 'start',
    instances: 'max', // Sử dụng tất cả CPU cores
    exec_mode: 'cluster'
  }]
}
```

### Nginx Optimization

```nginx
# /etc/nginx/sites-available/perplexica
worker_processes auto;
worker_connections 1024;

# Enable gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# Caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Node.js Optimization

```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable production mode
export NODE_ENV=production
```

---

## 🔄 Backup & Recovery

### Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "perplexica_backup_$DATE.tar.gz" /opt/Perplexica
aws s3 cp "perplexica_backup_$DATE.tar.gz" s3://your-backup-bucket/
```

### Recovery

```bash
# Download backup
aws s3 cp s3://your-backup-bucket/perplexica_backup_20240101_120000.tar.gz ./

# Extract backup
tar -xzf perplexica_backup_20240101_120000.tar.gz

# Restore application
sudo cp -r opt/Perplexica /opt/
sudo chown -R ubuntu:ubuntu /opt/Perplexica

# Restart service
pm2 restart perplexica
```

---

## 📞 Support

### Useful Commands

```bash
# Check service status
sudo systemctl status nginx
pm2 status

# View logs
pm2 logs perplexica --lines 100
sudo journalctl -u nginx -f

# Restart services
pm2 restart perplexica
sudo systemctl restart nginx

# Check disk space
df -h
du -sh /opt/Perplexica

# Check memory usage
free -h
pm2 monit
```

### Emergency Procedures

1. **Service Down**: `pm2 restart perplexica`
2. **Nginx Down**: `sudo systemctl restart nginx`
3. **SSL Issues**: `sudo certbot renew`
4. **Disk Full**: Clean logs và old backups
5. **Memory Issues**: Restart PM2 processes

---

## 🎯 Next Steps

1. **Setup monitoring**: CloudWatch, DataDog, hoặc New Relic
2. **Implement logging**: Winston, Morgan
3. **Add alerting**: Slack, PagerDuty
4. **Performance monitoring**: APM tools
5. **Security scanning**: OWASP ZAP, Snyk
6. **Load testing**: Artillery, k6
7. **Backup automation**: Scheduled backups
8. **Disaster recovery**: Multi-region setup

---

**Lưu ý**: Đảm bảo thay thế các placeholder values (API keys, domains, IPs) bằng giá trị thực tế của bạn.



