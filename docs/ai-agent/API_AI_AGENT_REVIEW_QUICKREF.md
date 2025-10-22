# 🚀 AI Agent Review API - Quick Reference

## 📌 TL;DR

**Endpoint:** `POST /api/ai-agent-review`  
**Purpose:** Tạo đánh giá toàn diện về AI agents  
**Response Time:** 30-120s tùy options  
**Timeout:** 300s (5 phút)  

## 🎯 Usage

### Basic Request
```bash
curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ChatGPT",
    "includeImages": false,
    "includeVideos": false
  }'
```

### Full Request
```json
{
  "query": "Claude AI",
  "history": [],
  "chatModel": {
    "provider": "openai",
    "name": "gpt-4"
  },
  "embeddingModel": {
    "provider": "openai", 
    "name": "text-embedding-ada-002"
  },
  "includeImages": true,
  "includeVideos": true,
  "systemInstructions": ""
}
```

## 📊 Response Times

| Configuration | Time | Use Case |
|--------------|------|----------|
| No images/videos | 30-60s | Quick review |
| Images only | 50-90s | Visual focus |
| Videos only | 50-90s | Tutorial focus |
| Full (images + videos) | 90-120s | Complete review |

## 🔧 Configuration

### Route Config
```typescript
// src/app/api/ai-agent-review/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes
```

### Handler Config
```typescript
// src/lib/search/index.ts
aiAgentReviewApi: new MetaSearchAgent({
  activeEngines: ['google', 'bing', 'duckduckgo'],
  queryGeneratorPrompt: prompts.aiAgentReviewApiRetrieverPrompt,
  responsePrompt: prompts.aiAgentReviewApiResponsePrompt,
  rerank: true,
  rerankThreshold: 0.3,
  searchWeb: true,
})
```

## 📝 Key Files

```
src/
├── app/api/ai-agent-review/route.ts       ← Main API endpoint
├── lib/
│   ├── search/
│   │   ├── index.ts                       ← Handler registry
│   │   └── metaSearchAgent.ts             ← Core logic
│   ├── prompts/
│   │   └── aiAgentReviewApi.ts            ← Prompts for API
│   └── chains/
│       ├── imageSearchAgent.ts            ← Image search
│       └── videoSearchAgent.ts            ← Video search
```

## ⚡ Quick Flow

```
Request → Validate → Select Models → Search & Answer
                                           ↓
                                     Rerank Docs
                                           ↓
                                    Generate Review
                                           ↓
                            ┌──────────────┴──────────────┐
                            ▼                             ▼
                    Fetch Images                  Fetch Videos
                      (parallel)                    (parallel)
                            └──────────────┬──────────────┘
                                           ▼
                                  Extract Metadata
                                           ▼
                                   Return Response
```

## 🐛 Common Issues

| Error | Fix |
|-------|-----|
| Timeout 30s | Add `maxDuration = 300` |
| Template error | Remove backticks from prompts |
| Empty response | Check LLM availability |
| Slow performance | Set `includeImages: false` |

## 📈 Performance Tips

1. **Disable media for speed:**
   ```json
   { "includeImages": false, "includeVideos": false }
   ```

2. **Use faster model:**
   ```json
   { "chatModel": { "provider": "openai", "name": "gpt-3.5-turbo" } }
   ```

3. **Cache results** (future):
   ```typescript
   const cached = await redis.get(`ai-review:${query}`);
   ```

## 🔍 Debugging

```bash
# Watch logs
tail -f .next/server.log | grep AI-REVIEW

# Test timeout
curl http://localhost:3000/api/test-timeout?delay=40

# Check handlers
curl http://localhost:3000/api/config
```

## ✅ Testing

```bash
# Quick test (30-60s)
./test-ai-review-api.sh

# Or manual
curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{"query":"ChatGPT","includeImages":false,"includeVideos":false}'
```

## 📚 Full Documentation

See: [API_AI_AGENT_REVIEW_FLOW.md](./API_AI_AGENT_REVIEW_FLOW.md)

