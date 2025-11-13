#!/bin/bash
# Test script để verify MCP server configuration

echo "=== Testing MCP Server Configuration ==="
echo ""

# Check if files exist
echo "1. Checking files..."
TSX_PATH="/Users/nguyendat/Working/mcp/Perplexica/node_modules/.bin/tsx"
ENTRY_PATH="/Users/nguyendat/Working/mcp/Perplexica/src/mcp/server-entry.ts"

if [ -f "$TSX_PATH" ]; then
    echo "✓ tsx found: $TSX_PATH"
else
    echo "✗ tsx NOT found: $TSX_PATH"
fi

if [ -f "$ENTRY_PATH" ]; then
    echo "✓ server-entry.ts found: $ENTRY_PATH"
else
    echo "✗ server-entry.ts NOT found: $ENTRY_PATH"
fi

echo ""
echo "2. Testing server startup..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
    "$TSX_PATH" "$ENTRY_PATH" 2>&1 | head -3

echo ""
echo "3. Checking Perplexica API..."
if curl -s http://localhost:3000/api/config > /dev/null 2>&1; then
    echo "✓ Perplexica API is running"
else
    echo "✗ Perplexica API is NOT running (start with: docker compose up -d or npm run dev)"
fi

echo ""
echo "=== Test Complete ==="










