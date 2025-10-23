# 📦 Installation Documentation

Tài liệu về cài đặt và cấu hình Perplexica.

## 📑 Nội dung

- **[CONFIG_LLM_SETUP.md](./CONFIG_LLM_SETUP.md)** - Hướng dẫn thiết lập và cấu hình LLM
- **[UPDATING.md](./UPDATING.md)** - Hướng dẫn cập nhật phiên bản

## 🚀 Quick Install

### Prerequisites
- Node.js 18+ 
- npm hoặc yarn
- Docker và Docker Compose (recommended)
- Git

### Method 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/your-repo/Perplexica.git
cd Perplexica

# Copy config template
cp sample.config.toml config.toml

# Edit config với API keys
nano config.toml

# Start services
docker compose up -d

# Access at http://localhost:3000
```

### Method 2: Local Development

```bash
# Clone repository
git clone https://github.com/your-repo/Perplexica.git
cd Perplexica

# Install dependencies
npm install

# Setup config
cp sample.config.toml config.toml
nano config.toml

# Setup database
npm run db:push

# Start development server
npm run dev
```

## ⚙️ Configuration

### 1. LLM Setup
Chi tiết xem [CONFIG_LLM_SETUP.md](./CONFIG_LLM_SETUP.md)

#### OpenAI
```toml
[OPENAI]
API_KEY = "sk-xxx"
```

#### Google Gemini
```toml
[GEMINI]
API_KEY = "AIzxxx"
```

#### Groq
```toml
[GROQ]
API_KEY = "gsk_xxx"
```

### 2. Search Engine Setup

#### SearxNG (Recommended)
```yaml
# docker-compose.yaml already includes SearxNG
# Access at http://localhost:4000
```

#### Custom SearxNG
```toml
[SEARXNG]
API_URL = "https://your-searxng-instance.com"
```

### 3. Database Setup

```bash
# Initialize database
npm run db:push

# Or manually
npx drizzle-kit push:sqlite
```

## 📝 Configuration File

### config.toml Structure
```toml
# General Settings
[GENERAL]
PORT = 3000
SIMILARITY_MEASURE = "cosine"

# OpenAI
[OPENAI]
API_KEY = "your-key"
CHAT_MODELS = ["gpt-4", "gpt-3.5-turbo"]
EMBEDDING_MODELS = ["text-embedding-ada-002"]

# Gemini
[GEMINI]
API_KEY = "your-key"
CHAT_MODELS = ["gemini-pro"]

# Groq
[GROQ]
API_KEY = "your-key"
CHAT_MODELS = ["mixtral-8x7b-32768"]

# Anthropic (optional)
[ANTHROPIC]
API_KEY = "your-key"
CHAT_MODELS = ["claude-3-opus-20240229"]

# Search
[SEARXNG]
API_URL = "http://localhost:4000"
```

## 🔑 Getting API Keys

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy và add vào config.toml

### Google Gemini
1. Visit https://makersuite.google.com/app/apikey
2. Create API key
3. Copy và add vào config.toml

### Groq
1. Visit https://console.groq.com/keys
2. Create API key
3. Copy và add vào config.toml

### Anthropic (Optional)
1. Visit https://console.anthropic.com/settings/keys
2. Create API key
3. Copy và add vào config.toml

## 🐳 Docker Setup

### Development
```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Production
```bash
# Use production compose file
docker compose -f docker-compose.prod.yaml up -d
```

### Custom Docker Image
```bash
# Build custom image
docker build -t perplexica:custom -f app.dockerfile .

# Run
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=xxx \
  -e GEMINI_API_KEY=xxx \
  perplexica:custom
```

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Override config.toml với env vars
export OPENAI_API_KEY="sk-xxx"
export GEMINI_API_KEY="AIzxxx"
export GROQ_API_KEY="gsk_xxx"
export PORT=3000
export NODE_ENV=production
```

### PM2 Setup
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs perplexica
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name perplexica.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔄 Updating

Xem chi tiết tại [UPDATING.md](./UPDATING.md)

### Quick Update
```bash
# Pull latest code
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart perplexica
# Or with Docker
docker compose restart
```

## 🧪 Verify Installation

### Health Check
```bash
# Check if app is running
curl http://localhost:3000/api/health

# Check config
curl http://localhost:3000/api/config

# Check models
curl http://localhost:3000/api/models
```

### Test Search
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is AI?", "focusMode": "webSearch"}'
```

## 🚨 Common Installation Issues

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Locked
```bash
# Stop all processes
pm2 stop all
# Or
docker compose down

# Remove lock file
rm data/db.sqlite-wal
rm data/db.sqlite-shm

# Restart
pm2 start all
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Docker Issues
```bash
# Reset Docker
docker compose down -v
docker compose up -d --build

# Check logs
docker compose logs -f
```

## 📊 System Requirements

### Minimum
- CPU: 2 cores
- RAM: 2GB
- Disk: 10GB
- Network: Broadband internet

### Recommended
- CPU: 4 cores
- RAM: 4GB
- Disk: 20GB SSD
- Network: High-speed internet

### Production
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB SSD
- Network: Dedicated server

## 🔐 Security Setup

### Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL/TLS
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d perplexica.example.com
```

### Secure API Keys
```bash
# Use environment variables
export OPENAI_API_KEY="xxx"

# Or use secrets manager (AWS, etc.)
```

## 📚 Related Documentation

- [CONFIG_LLM_SETUP.md](./CONFIG_LLM_SETUP.md) - LLM configuration details
- [UPDATING.md](./UPDATING.md) - Update procedures
- [Deployment Guide](../deployment/) - Production deployment
- [Troubleshooting](../troubleshooting/) - Common issues

## 💡 Tips

- **Use Docker** cho setup dễ dàng nhất
- **Secure your API keys** - never commit to git
- **Enable HTTPS** trong production
- **Regular backups** của database
- **Monitor logs** để phát hiện issues sớm
- **Update regularly** để có latest fixes

## 🎯 Next Steps

1. Complete [LLM setup](./CONFIG_LLM_SETUP.md)
2. Test all features
3. Configure [deployment](../deployment/)
4. Setup [CI/CD](../ci-cd/)
5. Review [troubleshooting](../troubleshooting/)

[← Quay lại Docs chính](../README.md)




