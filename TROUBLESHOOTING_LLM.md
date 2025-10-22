# LLM Connection Troubleshooting Guide

## Problem: 500 Internal Server Error on /api/chat

This guide helps diagnose and fix LLM connection issues that cause the chat API to return 500 errors.

## Diagnostic Steps

### 1. Check Configuration File

Verify that your `config.toml` file is properly configured with at least one LLM provider.

**Required for Custom OpenAI:**
```toml
[MODELS.CUSTOM_OPENAI]
API_KEY = "your-api-key-here"
API_URL = "https://api.z.ai/api/coding/paas/v4"
MODEL_NAME = "glm-4.5"
```

**OR Required for Gemini:**
```toml
[MODELS.GEMINI]
API_KEY = "your-gemini-api-key"
```

**Required for Embeddings:**
At least one embedding provider must be configured. Check these providers:
- Gemini (if GEMINI.API_KEY is set)
- OpenAI (if OPENAI.API_KEY is set)
- Ollama (if OLLAMA.API_URL is accessible)
- Transformers (local, should always work)

### 2. Run Diagnostic Script

```bash
node test-llm-connection.js
```

To test against your production server:
```bash
node test-llm-connection.js https://perplexica.trangvang.ai
```

### 3. Check Debug Endpoint

Visit the debug endpoint to see what providers are available:
```
https://perplexica.trangvang.ai/api/debug-config
```

This will return:
- Current configuration status
- Available chat model providers
- Available embedding model providers
- List of models for each provider

### 4. Review Application Logs

Check your application logs for detailed error messages:

```bash
# For PM2
pm2 logs perplexica

# For Docker
docker logs perplexica-app

# For systemd
journalctl -u perplexica -f
```

Look for these log entries:
- "Available chat model providers:"
- "Available embedding model providers:"
- "Selected chat provider:"
- "Error loading [Provider] models:"

## Common Issues and Solutions

### Issue 1: No Chat Model Providers Available

**Symptoms:**
- 500 error on /api/chat
- Log shows: "Available chat model providers: []"

**Solution:**
1. Configure at least one chat model provider in `config.toml`
2. Ensure API keys are valid
3. For Custom OpenAI, verify API_URL, API_KEY, and MODEL_NAME are all set
4. Restart the application

### Issue 2: No Embedding Model Providers Available

**Symptoms:**
- 500 error on /api/chat
- Log shows: "Available embedding model providers: []"

**Solution:**
1. Configure at least one embedding provider
2. If using Gemini, ensure the API key is valid
3. If using OpenAI, ensure the API key is set
4. Transformers (local) should work as a fallback
5. Restart the application

### Issue 3: Custom OpenAI Connection Failed

**Symptoms:**
- Custom OpenAI is configured but not appearing in available providers
- Log shows error connecting to custom API

**Solution:**
1. Test the API endpoint manually:
   ```bash
   curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "model": "glm-4.5",
       "messages": [{"role": "user", "content": "Hello"}],
       "max_tokens": 10
     }'
   ```
2. Verify the API key is correct
3. Check if the API endpoint requires specific headers or parameters
4. Check network connectivity from your server

### Issue 4: Gemini API Connection Failed

**Symptoms:**
- Gemini is configured but not appearing in available providers
- Log shows error loading Gemini models

**Solution:**
1. Verify your Gemini API key is valid
2. Test the API key:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```
3. Check if you have remaining quota
4. Ensure your API key has the necessary permissions

### Issue 5: Config File Not Found or Invalid

**Symptoms:**
- Application crashes on startup
- Error: "ENOENT: no such file or directory, open 'config.toml'"

**Solution:**
1. Ensure `config.toml` exists in the project root
2. Copy from sample if needed:
   ```bash
   cp sample.config.toml config.toml
   ```
3. Edit `config.toml` with your API keys
4. Restart the application

## Verification Steps

After fixing the issue:

1. **Restart the application:**
   ```bash
   # PM2
   pm2 restart perplexica
   
   # Docker
   docker restart perplexica-app
   
   # Development
   npm run dev
   ```

2. **Check the debug endpoint:**
   ```bash
   curl https://perplexica.trangvang.ai/api/debug-config
   ```
   
   Should return:
   ```json
   {
     "config": {
       "customOpenaiConfigured": true,
       "geminiApiKey": "SET"
     },
     "availableProviders": {
       "chat": ["custom_openai", "gemini"],
       "embedding": ["gemini", "transformers"]
     }
   }
   ```

3. **Test the chat endpoint:**
   ```bash
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
   ```

## Production Deployment Checklist

When deploying to production, ensure:

- [ ] `config.toml` is properly configured with valid API keys
- [ ] At least one chat model provider is available
- [ ] At least one embedding model provider is available
- [ ] Network connectivity to external APIs (if using cloud providers)
- [ ] Environment variables are set correctly
- [ ] Application has restarted after configuration changes
- [ ] SearXNG endpoint is accessible (SEARXNG API_ENDPOINT in config.toml)

## Getting Help

If you're still experiencing issues:

1. Run the diagnostic script and save the output:
   ```bash
   node test-llm-connection.js https://perplexica.trangvang.ai > diagnostic.log 2>&1
   ```

2. Check application logs and save relevant portions:
   ```bash
   pm2 logs perplexica --lines 100 > app.log
   ```

3. Check the debug endpoint:
   ```bash
   curl https://perplexica.trangvang.ai/api/debug-config > debug-info.json
   ```

4. Provide these files when asking for help:
   - diagnostic.log
   - app.log
   - debug-info.json
   - Your config.toml (with API keys redacted)

## Additional Resources

- [API Documentation](./docs/API/SEARCH.md)
- [Configuration Guide](./docs/CONFIG_LLM_SETUP.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

