#!/bin/bash

echo "🧪 Testing AI Agent Review API..."
echo ""

# Test 1: Simple query without images/videos (nhanh nhất)
echo "📝 Test 1: Simple query (no images/videos)"
echo "Expected: ~30-60s response time"
echo ""

curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ChatGPT",
    "includeImages": false,
    "includeVideos": false
  }' \
  -w "\n\n⏱️  Time: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (not JSON or too large to parse)"

echo ""
echo "✅ Test 1 completed!"
echo ""
echo "---"
echo ""

# Test 2: With images and videos (đầy đủ)
echo "📝 Test 2: Full query (with images & videos)"
echo "Expected: ~90-120s response time"
echo "⚠️  This will take longer..."
echo ""

curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Claude AI",
    "includeImages": true,
    "includeVideos": true
  }' \
  -w "\n\n⏱️  Time: %{time_total}s\n" \
  -s | jq '. | {message_length: (.message | length), sources_count: (.sources | length), images_count: (.images | length), videos_count: (.videos | length)}' 2>/dev/null || echo "Response received"

echo ""
echo "✅ Test 2 completed!"
echo ""
echo "---"
echo ""
echo "🎉 All tests completed!"

