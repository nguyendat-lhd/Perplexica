#!/bin/bash

set -e

# Configuration
EC2_HOST="13.228.19.21"
EC2_USER="ubuntu"
EC2_KEY="$HOME/.ssh/trangvang-perplexica-key.pem"
APP_DIR="/var/www/perplexica"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DIRECT DEPLOYMENT TO EC2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Clean and install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 2: Build application
echo ""
echo "🔨 Building Next.js application..."
NODE_ENV=production npm run build

# Step 3: Prepare standalone package
echo ""
echo "📦 Preparing standalone package..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp config.toml .next/standalone/
mkdir -p .next/standalone/data
cp -r data/* .next/standalone/data/ 2>/dev/null || echo "No data to copy"
mkdir -p .next/standalone/uploads

echo ""
echo "✅ Build completed!"
ls -lh .next/standalone/

# Step 4: Check and clean server before deployment
echo ""
echo "🔍 Checking server status..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
  # Check current status
  echo "Current PM2 status:"
  pm2 status || true
  
  echo ""
  echo "Port 3000 usage:"
  sudo lsof -ti:3000 | wc -l || echo "0"
ENDSSH

echo ""
echo "🛑 Stopping application on server..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
  set -e
  
  # Stop PM2
  echo "Stopping PM2 processes..."
  pm2 delete all 2>/dev/null || true
  pm2 kill 2>/dev/null || true
  
  # Kill all node processes
  echo "Killing all node processes..."
  sudo pkill -9 node 2>/dev/null || true
  
  # Free port 3000
  echo "Freeing port 3000..."
  sudo lsof -ti:3000 | xargs -r sudo kill -9 2>/dev/null || true
  
  sleep 3
  
  # Verify port is free
  if sudo lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ ERROR: Port 3000 is still in use!"
    sudo lsof -i:3000
    exit 1
  fi
  
  echo "✅ All processes stopped and port 3000 is free"
ENDSSH

if [ $? -ne 0 ]; then
  echo "❌ Failed to clean server. Aborting deployment."
  exit 1
fi

# Step 5: Sync files to server
echo ""
echo "📤 Syncing files to server..."
rsync -avz --delete \
  -e "ssh -i $EC2_KEY" \
  .next/standalone/ \
  "$EC2_USER@$EC2_HOST:$APP_DIR/"

echo ""
echo "✅ Files synced!"

# Step 6: Start application on server
echo ""
echo "🚀 Starting application on server..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
  cd /var/www/perplexica
  
  # Verify structure
  echo "📁 Verifying deployment structure..."
  ls -la
  
  # Start with PM2
  echo ""
  echo "🚀 Starting with PM2..."
  NODE_ENV=production pm2 start server.js --name perplexica
  pm2 save
  
  # Wait for app to start
  echo ""
  echo "⏳ Waiting for application to start..."
  sleep 5
  
  # Check status
  echo ""
  echo "📊 PM2 Status:"
  pm2 status
  
  # Test localhost
  echo ""
  echo "🧪 Testing localhost:3000..."
  if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application is running!"
  else
    echo "❌ Application failed to start"
    echo ""
    echo "📋 Error logs:"
    pm2 logs perplexica --lines 30 --nostream
    exit 1
  fi
ENDSSH

# Step 7: Test from outside
echo ""
echo "🌐 Testing from outside..."
sleep 3

if curl -f -s https://perplexica.trangvang.ai > /dev/null 2>&1; then
  echo "✅ Application is accessible at https://perplexica.trangvang.ai"
else
  echo "⚠️  Application may not be accessible yet (check Nginx)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Access your app at: https://perplexica.trangvang.ai"
echo ""
echo "📊 Check status: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'pm2 status'"
echo "📋 View logs:    ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'pm2 logs perplexica'"
echo ""

