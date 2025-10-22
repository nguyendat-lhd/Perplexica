#!/bin/bash

# Quick Production Check Script
# Usage: ./check-production.sh [production-url]
# Example: ./check-production.sh https://perplexica.trangvang.ai

PROD_URL="${1:-https://perplexica.trangvang.ai}"

echo "=================================================="
echo "Production Health Check for: $PROD_URL"
echo "=================================================="
echo ""

# Check debug endpoint
echo "1. Checking Debug Configuration Endpoint..."
echo "   URL: $PROD_URL/api/debug-config"
echo ""
curl -s "$PROD_URL/api/debug-config" | jq '.' 2>/dev/null || curl -s "$PROD_URL/api/debug-config"
echo ""
echo ""

# Check if models endpoint exists
echo "2. Checking Models Endpoint..."
echo "   URL: $PROD_URL/api/models"
echo ""
curl -s "$PROD_URL/api/models" | jq '.' 2>/dev/null || curl -s "$PROD_URL/api/models"
echo ""
echo ""

# Try a simple chat request
echo "3. Testing Chat Endpoint..."
echo "   URL: $PROD_URL/api/chat"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$PROD_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "messageId": "test-'$(date +%s)'",
      "chatId": "test-chat-'$(date +%s)'",
      "content": "Hello, testing connection"
    },
    "optimizationMode": "balanced",
    "focusMode": "webSearch",
    "history": []
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "   HTTP Status: $HTTP_CODE"
echo "   Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo ""

# Summary
echo "=================================================="
echo "Summary"
echo "=================================================="
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Chat endpoint is working correctly"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ Chat endpoint returned 500 error"
  echo ""
  echo "Possible issues:"
  echo "  - No chat model providers configured"
  echo "  - No embedding model providers configured"
  echo "  - LLM API connection failed"
  echo "  - Invalid configuration"
  echo ""
  echo "Next steps:"
  echo "  1. Check the debug endpoint output above"
  echo "  2. Verify config.toml on the server"
  echo "  3. Check application logs: pm2 logs perplexica"
  echo "  4. Run: node test-llm-connection.js $PROD_URL"
elif [ -z "$HTTP_CODE" ]; then
  echo "❌ Could not connect to the server"
  echo ""
  echo "Possible issues:"
  echo "  - Server is down"
  echo "  - Network connectivity issue"
  echo "  - Wrong URL"
else
  echo "⚠️  Unexpected HTTP status code: $HTTP_CODE"
fi
echo "=================================================="


