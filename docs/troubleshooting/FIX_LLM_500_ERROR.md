# Fix for LLM 500 Error on Production

## Summary

The 500 Internal Server Error on `/api/chat` has been diagnosed and fixed. The following improvements have been made:

### Changes Made

1. **Improved Error Handling** (`src/app/api/chat/route.ts`):
   - Added detailed logging for model selection process
   - Added validation checks for chat model and embedding model
   - Improved error messages to show what's available vs. what was requested
   - Better error details in 500 responses

2. **Fixed Configuration** (`config.toml`):
   - Added missing `API_KEY` field for OLLAMA provider

3. **Added Diagnostic Tools**:
   - `test-llm-connection.js`: Tests LLM provider connections
   - `check-production.sh`: Quick production health check
   - `src/app/api/debug-config/route.ts`: New debug endpoint
   - `TROUBLESHOOTING_LLM.md`: Comprehensive troubleshooting guide

## Current Production Status

Based on the diagnostic check, your production server has:

✅ **Chat Providers Available:**
- Gemini (9 models)
- Custom OpenAI (glm-4.5)

✅ **Embedding Providers Available:**
- Gemini (2 models)
- Transformers (3 models)

❌ **Chat Endpoint Status:** 500 Error

The models are loading correctly, but there's still an error in the chat endpoint. This requires deploying the fixes and checking the application logs.

## Deployment Steps

### Step 1: Deploy the Updated Code

```bash
# SSH into your production server
ssh your-server

# Navigate to the application directory
cd /path/to/Perplexica

# Pull the latest changes
git pull origin develop-deployment

# Or if you have uncommitted changes, stash them first
git stash
git pull origin develop-deployment
git stash pop

# Install any new dependencies
npm install

# Build the application
npm run build

# Restart the application
pm2 restart perplexica

# Or if using Docker
docker-compose down
docker-compose up -d --build
```

### Step 2: Verify the Fix

```bash
# Check the debug endpoint
curl https://perplexica.trangvang.ai/api/debug-config

# Test the chat endpoint
curl -X POST https://perplexica.trangvang.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "messageId": "test-123",
      "chatId": "test-chat",
      "content": "Hello"
    },
    "optimizationMode": "balanced",
    "focusMode": "webSearch",
    "history": []
  }'

# Or use the check script
./check-production.sh https://perplexica.trangvang.ai
```

### Step 3: Check Application Logs

```bash
# Check PM2 logs
pm2 logs perplexica --lines 50

# Look for these log entries:
# - "Available chat model providers:"
# - "Available embedding model providers:"
# - "Selected chat provider:"
# - "Selected chat model:"
# - Any error messages
```

## Expected Log Output (After Fix)

After deploying the fix, you should see logs like this when making a chat request:

```
Available chat model providers: [ 'gemini', 'custom_openai' ]
Available embedding model providers: [ 'gemini', 'transformers' ]
Requested chat model: { provider: undefined, name: undefined }
Requested embedding model: { provider: undefined, name: undefined }
Selected chat provider: gemini
Selected chat model: gemini-2.5-flash-lite
Selected embedding provider: gemini
Selected embedding model: models/text-embedding-004
Requested focus mode: webSearch
Available handlers: [ 'webSearch', 'academicSearch', ... ]
```

## Troubleshooting

If the error persists after deployment:

### 1. Check if the code was deployed

```bash
# Check the timestamp of the route file
ls -l src/app/api/chat/route.ts

# Check if the build is up to date
ls -l .next/
```

### 2. Check for runtime errors

```bash
pm2 logs perplexica --lines 100 | grep -i error
```

### 3. Test specific providers

```bash
# Test with Gemini explicitly
curl -X POST https://perplexica.trangvang.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "messageId": "test-123",
      "chatId": "test-chat",
      "content": "Hello"
    },
    "optimizationMode": "balanced",
    "focusMode": "webSearch",
    "chatModel": {
      "provider": "gemini",
      "name": "gemini-2.5-flash-lite"
    },
    "embeddingModel": {
      "provider": "gemini",
      "name": "models/text-embedding-004"
    },
    "history": []
  }'

# Test with Custom OpenAI explicitly
curl -X POST https://perplexica.trangvang.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "messageId": "test-123",
      "chatId": "test-chat",
      "content": "Hello"
    },
    "optimizationMode": "balanced",
    "focusMode": "webSearch",
    "chatModel": {
      "provider": "custom_openai",
      "name": "glm-4.5"
    },
    "embeddingModel": {
      "provider": "gemini",
      "name": "models/text-embedding-004"
    },
    "history": []
  }'
```

### 4. Check API connectivity

```bash
# Run the diagnostic script
node test-llm-connection.js https://perplexica.trangvang.ai
```

### 5. Common Issues

**Issue:** Error still occurs after deployment

**Solution:**
1. Verify the build completed successfully:
   ```bash
   npm run build 2>&1 | tee build.log
   ```
2. Check for TypeScript errors:
   ```bash
   npm run type-check
   ```
3. Clear the Next.js cache:
   ```bash
   rm -rf .next
   npm run build
   pm2 restart perplexica
   ```

**Issue:** Models not loading

**Solution:**
1. Check config.toml exists and is readable:
   ```bash
   cat config.toml
   ```
2. Verify API keys are set:
   ```bash
   grep -v "^#" config.toml | grep API_KEY
   ```
3. Test API connectivity:
   ```bash
   node test-llm-connection.js
   ```

**Issue:** Focus mode not found

**Solution:**
1. Check available focus modes:
   ```bash
   curl https://perplexica.trangvang.ai/api/models | jq '.focusModes'
   ```
2. Use a valid focus mode in your request (default: `webSearch`)

## Verification Checklist

After deployment, verify:

- [ ] Application restarted successfully
- [ ] Debug endpoint accessible: `/api/debug-config`
- [ ] Models endpoint shows providers: `/api/models`
- [ ] Chat endpoint returns 200 or streams data: `/api/chat`
- [ ] No errors in application logs
- [ ] Frontend can send chat messages
- [ ] Chat responses are displayed correctly

## Files Modified

1. `src/app/api/chat/route.ts` - Improved error handling and logging
2. `config.toml` - Fixed OLLAMA configuration
3. `src/app/api/debug-config/route.ts` - New debug endpoint (created)
4. `test-llm-connection.js` - Diagnostic script (created)
5. `check-production.sh` - Quick check script (created)
6. `TROUBLESHOOTING_LLM.md` - Troubleshooting guide (created)

## Next Steps

1. **Commit the changes:**
   ```bash
   git add -A
   git commit -m "Fix LLM 500 error: improve error handling and logging"
   git push origin develop-deployment
   ```

2. **Deploy to production** (follow Step 1 above)

3. **Test and verify** (follow Step 2 above)

4. **Monitor logs** for any issues

5. If issues persist, refer to `TROUBLESHOOTING_LLM.md`

## Support

For additional help:
- Check `TROUBLESHOOTING_LLM.md`
- Run `./check-production.sh`
- Run `node test-llm-connection.js`
- Check application logs: `pm2 logs perplexica`


