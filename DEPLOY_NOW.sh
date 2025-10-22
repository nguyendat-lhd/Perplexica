#!/bin/bash

# Script để deploy lên production server
# Chạy script này trên production server sau khi SSH vào

echo "=================================================="
echo "Perplexica - LLM Fix Deployment"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the Perplexica directory?${NC}"
    echo "Please cd to the Perplexica directory first"
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

# Backup config.toml
echo -e "${YELLOW}1. Backing up config.toml...${NC}"
if [ -f "config.toml" ]; then
    cp config.toml config.toml.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}⚠ No config.toml found (will be created from sample)${NC}"
fi
echo ""

# Pull latest changes
echo -e "${YELLOW}2. Pulling latest changes from GitHub...${NC}"
git fetch origin
git status
echo ""
read -p "Pull from develop-deployment branch? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin develop-deployment
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo -e "${YELLOW}Skipped git pull${NC}"
fi
echo ""

# Install dependencies
echo -e "${YELLOW}3. Installing/updating dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies updated${NC}"
echo ""

# Build application
echo -e "${YELLOW}4. Building application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed. Please check errors above.${NC}"
    exit 1
fi
echo ""

# Check PM2 status
echo -e "${YELLOW}5. Checking PM2 status...${NC}"
pm2 list
echo ""

# Restart application
echo -e "${YELLOW}6. Restarting application...${NC}"
read -p "Restart PM2 process? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 restart perplexica
    echo -e "${GREEN}✓ Application restarted${NC}"
    echo ""
    
    # Wait a bit for the app to start
    echo "Waiting for application to start..."
    sleep 5
    
    # Check PM2 status again
    pm2 list
    echo ""
    
    # Show logs
    echo -e "${YELLOW}Recent logs:${NC}"
    pm2 logs perplexica --lines 20 --nostream
else
    echo -e "${YELLOW}Skipped PM2 restart${NC}"
    echo "You can restart manually with: pm2 restart perplexica"
fi
echo ""

# Test the deployment
echo "=================================================="
echo "Deployment Verification"
echo "=================================================="
echo ""

# Get the server URL
read -p "Enter your server URL (e.g., https://perplexica.trangvang.ai): " SERVER_URL

if [ -z "$SERVER_URL" ]; then
    echo -e "${YELLOW}No URL provided, skipping tests${NC}"
else
    echo ""
    echo -e "${YELLOW}Testing debug endpoint...${NC}"
    curl -s "$SERVER_URL/api/debug-config" | jq '.' || curl -s "$SERVER_URL/api/debug-config"
    echo ""
    
    echo -e "${YELLOW}Testing models endpoint...${NC}"
    curl -s "$SERVER_URL/api/models" | jq '.chatModelProviders | keys' || curl -s "$SERVER_URL/api/models"
    echo ""
fi

echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Check the application is running: pm2 status"
echo "2. Monitor logs: pm2 logs perplexica"
echo "3. Test the chat endpoint in your browser"
echo "4. Check the debug endpoint: $SERVER_URL/api/debug-config"
echo ""
echo "If you encounter issues:"
echo "- Check TROUBLESHOOTING_LLM.md"
echo "- Run: ./check-production.sh $SERVER_URL"
echo "- Run: node test-llm-connection.js $SERVER_URL"
echo ""
echo -e "${GREEN}Deployment script finished!${NC}"


