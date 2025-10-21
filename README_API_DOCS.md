# 📚 API Documentation - AI Agent Review

Tổng hợp tài liệu cho AI Agent Review API và các thay đổi liên quan.

## 📖 Table of Contents

### 🎯 Main Documentation

1. **[API Flow Documentation](./docs/API_AI_AGENT_REVIEW_FLOW.md)** ⭐
   - Architecture overview
   - Request flow chi tiết
   - Components breakdown
   - Data transformation pipeline
   - Error handling
   - Performance optimization
   - **Đọc này trước để hiểu toàn bộ flow!**

2. **[Quick Reference Guide](./docs/API_AI_AGENT_REVIEW_QUICKREF.md)**
   - TL;DR usage
   - Common patterns
   - Quick debugging
   - Performance tips

### 🔧 Technical Docs

3. **[Handler Architecture](./AI_AGENT_REVIEW_HANDLERS.md)**
   - Sự khác biệt giữa `aiAgentReview` và `aiAgentReviewApi`
   - Khi nào dùng handler nào
   - Tùy chỉnh prompts

4. **[Changelog - Handler Separation](./CHANGELOG_AI_AGENT_HANDLERS.md)**
   - Lý do tách handlers
   - Files đã thay đổi
   - Migration notes

### 🐛 Bug Fixes & Optimizations

5. **[Fix Summary](./FIX_SUMMARY.md)**
   - Tổng hợp tất cả fixes
   - Before/After comparison
   - Test instructions

6. **[Timeout Fix (30s issue)](./FIX_TIMEOUT_30S.md)**
   - Nguyên nhân timeout 30s
   - Next.js `maxDuration` config
   - Testing procedures

7. **[Timeout Optimization](./FIX_TIMEOUT_API.md)**
   - Parallel processing (Promise.all)
   - Timeout per task (Promise.race)
   - Prompt simplification

8. **[LangChain Template Bug](./BUG_FIX_LANGCHAIN_TEMPLATE.md)**
   - `Missing value for input variable` error
   - Backticks issue in prompts
   - Solution & best practices

### 🧪 Testing

9. **[Test Instructions](./TEST_TIMEOUT_INSTRUCTIONS.md)**
   - Cách test timeout configuration
   - Debug checklist
   - Troubleshooting guide

10. **[Test Script](./test-ai-review-api.sh)**
    - Automated testing
    - Usage: `./test-ai-review-api.sh`

## 🚀 Quick Start

### 1. Hiểu Flow

```bash
# Đọc document chính
cat docs/API_AI_AGENT_REVIEW_FLOW.md

# Hoặc Quick Reference
cat docs/API_AI_AGENT_REVIEW_QUICKREF.md
```

### 2. Test API

```bash
# Test nhanh
curl -X POST http://localhost:3000/api/ai-agent-review \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ChatGPT",
    "includeImages": false,
    "includeVideos": false
  }'

# Test đầy đủ
./test-ai-review-api.sh
```

### 3. Customize

```bash
# Chat mode prompts (Markdown output)
vim src/lib/prompts/aiAgentReview.ts

# API mode prompts (JSON output)
vim src/lib/prompts/aiAgentReviewApi.ts
```

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Client Request                     │
│         POST /api/ai-agent-review                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Next.js API Route    │
        │  (maxDuration: 300s)   │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  Search Handler        │
        │  (aiAgentReviewApi)    │
        └────────┬───────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌─────────┐
   │  Query  │      │  Search │
   │Generator│      │  & Rank │
   └────┬────┘      └────┬────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   LLM Generation       │
        │   (Response Prompt)    │
        └────────┬───────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌─────────┐
   │ Images  │      │ Videos  │
   │(parallel)      │(parallel)│
   └────┬────┘      └────┬────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   Metadata Extract     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   Final Response       │
        └────────────────────────┘
```

## 🔑 Key Concepts

### 1. Dual Handlers

| Handler | Purpose | Output |
|---------|---------|--------|
| `aiAgentReview` | Chat UI | Markdown streaming |
| `aiAgentReviewApi` | API endpoint | Structured text/JSON |

### 2. Performance

- **Without media:** 30-60s
- **With images/videos:** 90-120s
- **Parallel processing:** Images + Videos run simultaneously
- **Timeouts:** 60s per media task, 300s total

### 3. Error Handling

- **Critical errors:** Return 400/500
- **Non-critical errors:** Graceful degradation (empty arrays)
- **Timeout protection:** Promise.race with timeout

## 🛠️ Development

### File Structure

```
src/
├── app/api/ai-agent-review/
│   └── route.ts                    ← API endpoint
├── lib/
│   ├── search/
│   │   ├── index.ts                ← Handler registry
│   │   └── metaSearchAgent.ts      ← Core search logic
│   ├── prompts/
│   │   ├── aiAgentReview.ts        ← Chat prompts
│   │   └── aiAgentReviewApi.ts     ← API prompts
│   └── chains/
│       ├── imageSearchAgent.ts     ← Image search
│       └── videoSearchAgent.ts     ← Video search
```

### Common Tasks

#### Add new field to response

```typescript
// 1. Update prompt (src/lib/prompts/aiAgentReviewApi.ts)
const prompt = `
Trả về JSON với:
- ...existing fields...
- new_field: Description
`;

// 2. Update metadata extraction (src/app/api/ai-agent-review/route.ts)
function extractAgentMetadata(...) {
  return {
    ...existing,
    new_field: extractNewField(...),
  };
}
```

#### Change timeout

```typescript
// src/app/api/ai-agent-review/route.ts
export const maxDuration = 600; // 10 minutes

// For images/videos
setTimeout(() => reject(...), 120000) // 2 minutes
```

#### Switch to different LLM

```json
{
  "chatModel": {
    "provider": "anthropic",
    "name": "claude-3-opus"
  }
}
```

## 📈 Monitoring

### Logs to watch

```bash
# Application logs
tail -f .next/server.log | grep "AI-REVIEW\|Error"

# PM2 logs
pm2 logs perplexica --lines 100

# Specific errors
tail -f .next/server.log | grep "Missing value\|timeout\|INVALID_PROMPT"
```

### Metrics to track

- Request duration
- Success rate
- Error types
- Media fetch success rate
- LLM response time

## 🆘 Troubleshooting

### Issue: Timeout at 30s

**Solution:** 
```typescript
// Add to route.ts
export const maxDuration = 300;
```

See: [FIX_TIMEOUT_30S.md](./FIX_TIMEOUT_30S.md)

### Issue: Template variable error

**Solution:** Remove backticks from prompts

See: [BUG_FIX_LANGCHAIN_TEMPLATE.md](./BUG_FIX_LANGCHAIN_TEMPLATE.md)

### Issue: Slow performance

**Solution:** Disable images/videos or use faster model

See: [FIX_TIMEOUT_API.md](./FIX_TIMEOUT_API.md)

## 🔄 Updates & Changelog

**Latest:** 2025-10-21

- ✅ Tách handlers thành `aiAgentReview` và `aiAgentReviewApi`
- ✅ Fix timeout 30s → 300s
- ✅ Parallel images/videos fetching
- ✅ Fix LangChain template error
- ✅ Optimize prompts cho performance
- ✅ Add comprehensive documentation

## 📞 Support

- **Issues:** Check [TEST_TIMEOUT_INSTRUCTIONS.md](./TEST_TIMEOUT_INSTRUCTIONS.md)
- **Architecture:** See [API_AI_AGENT_REVIEW_FLOW.md](./docs/API_AI_AGENT_REVIEW_FLOW.md)
- **Quick help:** See [API_AI_AGENT_REVIEW_QUICKREF.md](./docs/API_AI_AGENT_REVIEW_QUICKREF.md)

---

**Version:** 1.0  
**Last Updated:** 2025-10-21  
**Maintainer:** AI Team

