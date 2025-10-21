# ✅ Bug Fix - LangChain Template Variable Error

## 🐛 Bug đã phát hiện

```
Error: Missing value for input variable `
  "ai_agent_name": "Tên chính xác của AI agent",
  "ai_agent_type": "Loại AI agent (chatbot/image_generator/code_assistant/etc)",
  ...
`

Troubleshooting URL: https://js.langchain.com/docs/troubleshooting/errors/INVALID_PROMPT_INPUT/
```

## 🔍 Nguyên nhân

Trong file `src/lib/prompts/aiAgentReviewApi.ts`, prompt đã sử dụng **backticks** để show JSON example:

```typescript
// ❌ SAI - LangChain parse backticks thành template variables
\`\`\`json
{
  "ai_agent_name": "...",
  "ai_agent_type": "...",
  ...
}
\`\`\`
```

LangChain nghĩ các fields trong JSON block là **template variables** cần được inject (như `{query}`, `{context}`, `{date}`), nên báo lỗi khi không tìm thấy giá trị cho chúng.

## ✅ Giải pháp

Thay thế JSON code block bằng **plain text description**:

**Trước (❌):**
```typescript
\`\`\`json
{
  "ai_agent_name": "Tên chính xác của AI agent",
  "ai_agent_type": "Loại AI agent (chatbot/image_generator/code_assistant/etc)",
  ...
}
\`\`\`
```

**Sau (✅):**
```typescript
Trả về JSON với cấu trúc:
- ai_agent_name: Tên chính xác của AI agent
- ai_agent_type: Loại AI agent (chatbot/image_generator/code_assistant/etc)
- provider: Tên công ty phát triển
...

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC.
```

## 📝 Files đã sửa

### 1. `src/lib/prompts/aiAgentReviewApi.ts`
- Xóa JSON code block với backticks
- Thay bằng bullet list mô tả các fields
- Thêm instruction rõ ràng: "CHỈ TRẢ VỀ JSON"

### 2. `src/lib/search/index.ts`
- Xóa `aiAgentReviewApi` khỏi console.log debug
- Chỉ giữ user-facing focus modes

## 🧪 Test

### Before Fix (❌):
```bash
POST /api/ai-agent-review
→ Error: Missing value for input variable...
```

### After Fix (✅):
```bash
POST /api/ai-agent-review
{
  "query": "ChatGPT",
  "includeImages": false,
  "includeVideos": false
}

→ Response 200 OK
{
  "message": "...",
  "sources": [...],
  "images": [],
  "videos": [],
  "metadata": {...}
}
```

## 💡 Bài học

### Khi viết LangChain prompts:

1. **KHÔNG dùng backticks trong template string**
   ```typescript
   // ❌ SAI
   const prompt = `Return JSON:
   \`\`\`json
   {"field": "value"}
   \`\`\`
   `;
   ```

2. **Dùng plain text hoặc escape**
   ```typescript
   // ✅ ĐÚNG - Option 1: Plain text
   const prompt = `Return JSON with fields:
   - field: value
   - another: value
   `;
   
   // ✅ ĐÚNG - Option 2: Escape backticks
   const prompt = `Return JSON:
   \\`\\`\\`json
   {"field": "value"}
   \\`\\`\\`
   `;
   ```

3. **LangChain template variables**
   - Chỉ dùng `{variable}` cho actual variables
   - Ví dụ: `{query}`, `{context}`, `{date}`, `{chat_history}`
   - Mọi thứ khác trong `{...}` sẽ bị parse nhầm

## 🎯 Kết quả

✅ API `/api/ai-agent-review` hoạt động bình thường  
✅ Không còn lỗi INVALID_PROMPT_INPUT  
✅ LangChain parse prompt đúng cách  
✅ Focus modes list clean (không show internal handler)  

## 📊 Summary

| Issue | Status |
|-------|--------|
| LangChain template error | ✅ FIXED |
| API timeout 30s | ✅ FIXED (maxDuration=300) |
| Prompt format | ✅ FIXED (no backticks) |
| Focus modes debug | ✅ CLEANED |

---

**Ngày fix**: 21/10/2025  
**Root cause**: Backticks trong prompt string → LangChain parse nhầm  
**Solution**: Xóa backticks, dùng plain text description  
**Status**: ✅ HOÀN THÀNH  

