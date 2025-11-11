# Cải tiến Code Mode dựa trên Anthropic's Approach

Tài liệu này mô tả các cải tiến đã được implement cho Perplexica MCP Server dựa trên bài post của Anthropic về [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp).

## Tổng quan các cải tiến

### 1. ✅ Filesystem-based Tool Discovery (Progressive Disclosure)

**Vấn đề:** Load tất cả tool definitions vào context tốn rất nhiều tokens (150,000+ tokens).

**Giải pháp:** Expose tools như TypeScript files trong filesystem structure, cho phép agents discover và load tools on-demand.

**Implementation:**
- Tạo virtual filesystem với structure: `servers/perplexica/{tool}.ts`
- Agents có thể explore filesystem để tìm tools
- Chỉ load tools cần thiết, giảm token usage từ 150,000 xuống ~2,000 tokens

**Sử dụng:**
```typescript
// List available servers
const servers = listServers();
// ['perplexica']

// List tools in a server
const tools = listServerTools('perplexica');
// ['servers/perplexica/search.ts', 'servers/perplexica/searchImages.ts', ...]

// Read tool file
const tool = getToolByPath('servers/perplexica/search.ts');
console.log(tool.description);
console.log(tool.schema);

// Read tool code from virtual filesystem
const toolCode = await fs.readFile('servers/perplexica/search.ts', 'utf-8');
```

### 2. ✅ Search Tools Capability

**Vấn đề:** Khó tìm tools khi có nhiều tools.

**Giải pháp:** Thêm `search_tools` tool với progressive disclosure (name, summary, full).

**Implementation:**
- Tool: `perplexica_search_tools`
- Parameters: `query`, `detailLevel` ('name' | 'summary' | 'full')
- Cho phép agents tìm tools theo keyword

**Sử dụng:**
```typescript
// In Code Mode
const results = searchTools('search', 'summary');
// Returns: [{ name: 'perplexica_search', path: '...', description: '...' }]

// Via MCP Tool
// Call perplexica_search_tools with query="search", detailLevel="summary"
```

### 3. ✅ State Persistence

**Vấn đề:** Intermediate results phải đi qua model context, tốn tokens.

**Giải pháp:** Cho phép agents lưu và đọc state từ filesystem.

**Implementation:**
- Workspace directory: `.mcp-workspace/`
- Sandboxed filesystem access (chỉ trong workspace)
- Security checks để prevent path traversal

**Sử dụng:**
```typescript
// Save intermediate results
const result = await api.search({ query: "AI trends" });
await fs.writeFile('./workspace/results.json', JSON.stringify(result, null, 2));

// Later, read back
const saved = await fs.readFile('./workspace/results.json', 'utf-8');
const loaded = JSON.parse(saved);
```

### 4. ✅ Skills System

**Vấn đề:** Agents phải viết lại code cho các tasks tương tự.

**Giải pháp:** Cho phép agents save và reuse code functions như "skills".

**Implementation:**
- Skills directory: `.mcp-workspace/skills/`
- Mỗi skill là một TypeScript file + documentation
- Built-in skills cho common operations

**Sử dụng:**
```typescript
// Save a skill
const skill = {
  name: 'mySearch',
  description: 'Custom search function',
  code: `const api = new PerplexicaAPI();
    return await api.search({ query, focusMode });`,
  parameters: [
    { name: 'query', type: 'string', description: 'Search query' },
    { name: 'focusMode', type: 'string', description: 'Focus mode' },
  ],
};
await saveSkill(skill);

// Load and use
const mySearch = await loadSkill('mySearch');
const results = await mySearch('AI trends', 'webSearch');

// List all skills
const skills = await listSkills();
```

## So sánh: Trước và Sau

### Trước (Traditional MCP)

```typescript
// Load tất cả tool definitions vào context
// ~150,000 tokens chỉ để load definitions

// Mỗi tool call là một round-trip
TOOL CALL: perplexica_search({ query: "AI trends" })
→ Wait for result
TOOL CALL: perplexica_search_images({ query: "AI trends" })
→ Wait for result
TOOL CALL: perplexica_search_videos({ query: "AI trends" })
→ Wait for result

// Intermediate results đi qua context
// Tốn thêm ~50,000 tokens cho large data
```

### Sau (Enhanced Code Mode)

```typescript
// Chỉ load tools cần thiết
const tools = searchTools('search', 'summary');
// ~2,000 tokens

// Chain operations trong một execution
const api = new PerplexicaAPI();
const [search, images, videos] = await Promise.all([
  api.search({ query: "AI trends" }),
  api.searchImages({ query: "AI trends" }),
  api.searchVideos({ query: "AI trends" }),
]);

// Save results, không cần đi qua context
await fs.writeFile('./workspace/results.json', JSON.stringify({
  search, images, videos
}, null, 2));

// Tiết kiệm: ~98.7% tokens
```

## Lợi ích

### 1. Token Efficiency
- **Progressive disclosure**: Chỉ load tools cần thiết
- **State persistence**: Intermediate results không đi qua context
- **Code execution**: Filter/transform data trong execution environment

### 2. Performance
- **Parallel execution**: Promise.all() cho multiple calls
- **Single execution**: Không cần nhiều round-trips
- **Faster**: Giảm latency đáng kể

### 3. Flexibility
- **Complex logic**: Loops, conditionals, error handling
- **Data processing**: Filter, transform, aggregate trong code
- **Reusability**: Skills system cho common operations

### 4. Security
- **Sandboxed execution**: Code chạy trong VM2 sandbox
- **Filesystem isolation**: Chỉ access workspace directory
- **Path traversal protection**: Security checks

## API Reference

### Filesystem Discovery

```typescript
// List servers
listServers(): string[]

// List tools in server
listServerTools(serverName: string): string[]

// Search tools
searchTools(query: string, detailLevel?: 'name' | 'summary' | 'full'): ToolSearchResult[]

// Get tool by path
getToolByPath(path: string): ToolFile | null
```

### Filesystem Access

```typescript
// Read file
await fs.readFile(filePath: string, encoding?: string): Promise<string>

// Write file
await fs.writeFile(filePath: string, content: string, encoding?: string): Promise<void>

// List directory
await fs.readdir(dirPath: string): Promise<string[]>

// Check existence
await fs.exists(filePath: string): Promise<boolean>
```

### Skills

```typescript
// Save skill
saveSkill(skill: Skill, workspaceDir?: string): Promise<string>

// Load skill
loadSkill(skillName: string, workspaceDir?: string): Promise<Skill | null>

// List skills
listSkills(workspaceDir?: string): Promise<string[]>
```

## Ví dụ sử dụng

### Ví dụ 1: Progressive Tool Discovery

```typescript
// Step 1: List servers
const servers = listServers();
console.log('Servers:', servers); // ['perplexica']

// Step 2: Search for tools
const searchResults = searchTools('image', 'summary');
console.log('Found:', searchResults);
// [{ name: 'perplexica_search_images', path: '...', description: '...' }]

// Step 3: Get full tool definition
const tool = getToolByPath('servers/perplexica/searchImages.ts');
console.log('Full definition:', tool);
```

### Ví dụ 2: State Persistence

```typescript
// Search and save
const result = await api.search({ query: "AI trends", focusMode: "webSearch" });
await fs.writeFile('./workspace/ai-trends.json', JSON.stringify(result, null, 2));

// Later execution picks up where it left off
const saved = await fs.readFile('./workspace/ai-trends.json', 'utf-8');
const loaded = JSON.parse(saved);
console.log('Loaded:', loaded.message);
```

### Ví dụ 3: Complex Workflow

```typescript
// Research workflow với state persistence
const topic = "machine learning";

// Step 1: Search
const searchResult = await api.search({ query: topic, focusMode: "webSearch" });
await fs.writeFile('./workspace/search.json', JSON.stringify(searchResult, null, 2));

// Step 2: Get images
const images = await api.searchImages({ query: topic });
await fs.writeFile('./workspace/images.json', JSON.stringify(images, null, 2));

// Step 3: Get videos
const videos = await api.searchVideos({ query: topic });
await fs.writeFile('./workspace/videos.json', JSON.stringify(videos, null, 2));

// Step 4: Combine results
const research = {
  topic,
  summary: searchResult.message,
  sources: searchResult.sources,
  images: images.images.slice(0, 5),
  videos: videos.videos.slice(0, 5),
};

await fs.writeFile('./workspace/research.json', JSON.stringify(research, null, 2));
return research;
```

### Ví dụ 4: Skills

```typescript
// Create a reusable skill
const skill = {
  name: 'quickSearch',
  description: 'Quick search with automatic saving',
  code: `const api = new PerplexicaAPI();
    const result = await api.search({ query, focusMode: 'webSearch' });
    await fs.writeFile(\`./workspace/\${query.replace(/\\s+/g, '-')}.json\`, 
      JSON.stringify(result, null, 2));
    return result;`,
  parameters: [
    { name: 'query', type: 'string', description: 'Search query' },
  ],
};

await saveSkill(skill);

// Use the skill
const quickSearch = await loadSkill('quickSearch');
const result = await quickSearch('AI trends');
```

## Best Practices

1. **Use progressive disclosure**: Chỉ load tools cần thiết
2. **Save intermediate results**: Dùng filesystem để persist state
3. **Create reusable skills**: Save common operations như skills
4. **Filter data in code**: Process data trong execution environment
5. **Use parallel execution**: Promise.all() cho multiple calls

## Tài liệu tham khảo

- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Cloudflare: Code Mode](https://blog.cloudflare.com/code-mode/)
- [MCP Specification](https://modelcontextprotocol.io/)

