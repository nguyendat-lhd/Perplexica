/**
 * Enhanced Code Mode Handler with Filesystem Discovery and State Persistence
 * 
 * Executes TypeScript code in a sandboxed environment with:
 * - Filesystem-based tool discovery (progressive disclosure)
 * - State persistence across executions
 * - On-demand tool loading
 * 
 * Based on Anthropic's Code Execution with MCP approach:
 * https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PerplexicaAPI } from './api';
import { 
  getToolsAsFilesystem, 
  getToolByPath, 
  searchTools, 
  listServers, 
  listServerTools 
} from './filesystem-discovery';
import { saveSkill, loadSkill, listSkills, builtInSkills } from './skills';

// Lazy-load vm2 to avoid build-time issues
async function loadVM() {
  const vm2 = await import('vm2');
  return vm2.VM;
}

export interface CodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  logs?: string[];
  filesCreated?: string[];
}

/**
 * Execute TypeScript/JavaScript code in a sandbox with filesystem access
 * 
 * @param code - The code to execute
 * @param apiBaseUrl - Base URL for Perplexica API
 * @param workspaceDir - Workspace directory for state persistence (optional)
 * @returns Execution result
 */
export async function executeCode(
  code: string,
  apiBaseUrl: string = 'http://localhost:3000',
  workspaceDir?: string,
): Promise<CodeExecutionResult> {
  const logs: string[] = [];
  const output: any[] = [];
  const filesCreated: string[] = [];
  
  // Create workspace directory if not provided
  const workspace = workspaceDir || path.join(process.cwd(), '.mcp-workspace');
  try {
    await fs.mkdir(workspace, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  // Create virtual filesystem for MCP tools
  const toolFiles = getToolsAsFilesystem();
  const virtualFs = new Map<string, string>();
  
  // Add tool files to virtual filesystem
  for (const [filePath, file] of Object.entries(toolFiles)) {
    virtualFs.set(filePath, file.code);
  }

  try {
    // Create filesystem helpers with security checks
    const fsHelpers = {
      readFile: async (filePath: string, encoding: string = 'utf-8'): Promise<string> => {
        // Check virtual filesystem first (for tool files)
        if (virtualFs.has(filePath)) {
          return virtualFs.get(filePath)!;
        }
        
        // Check workspace
        const fullPath = path.isAbsolute(filePath) 
          ? filePath 
          : path.join(workspace, filePath);
        
        // Security: ensure path is within workspace
        const resolvedPath = path.resolve(fullPath);
        const resolvedWorkspace = path.resolve(workspace);
        if (!resolvedPath.startsWith(resolvedWorkspace)) {
          throw new Error(`Access denied: Path outside workspace`);
        }
        
        return await fs.readFile(resolvedPath, encoding as BufferEncoding);
      },
      
      writeFile: async (filePath: string, content: string, encoding: string = 'utf-8'): Promise<void> => {
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workspace, filePath);
        
        // Security: ensure path is within workspace
        const resolvedPath = path.resolve(fullPath);
        const resolvedWorkspace = path.resolve(workspace);
        if (!resolvedPath.startsWith(resolvedWorkspace)) {
          throw new Error(`Access denied: Path outside workspace`);
        }
        
        // Create directory if needed
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, content, encoding as BufferEncoding);
        filesCreated.push(resolvedPath);
      },
      
      readdir: async (dirPath: string): Promise<string[]> => {
        // Check virtual filesystem (for servers directory)
        if (dirPath === 'servers' || dirPath.startsWith('servers/')) {
          const prefix = dirPath === 'servers' ? 'servers/' : dirPath + '/';
          const files = Array.from(virtualFs.keys())
            .filter(f => f.startsWith(prefix))
            .map(f => {
              const relative = f.replace(prefix, '');
              return relative.split('/')[0];
            });
          return [...new Set(files)];
        }
        
        const fullPath = path.isAbsolute(dirPath)
          ? dirPath
          : path.join(workspace, dirPath);
        
        const resolvedPath = path.resolve(fullPath);
        const resolvedWorkspace = path.resolve(workspace);
        if (!resolvedPath.startsWith(resolvedWorkspace)) {
          throw new Error(`Access denied: Path outside workspace`);
        }
        
        return await fs.readdir(resolvedPath);
      },
      
      exists: async (filePath: string): Promise<boolean> => {
        if (virtualFs.has(filePath)) return true;
        
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workspace, filePath);
        
        const resolvedPath = path.resolve(fullPath);
        const resolvedWorkspace = path.resolve(workspace);
        if (!resolvedPath.startsWith(resolvedWorkspace)) {
          return false;
        }
        
        try {
          await fs.access(resolvedPath);
          return true;
        } catch {
          return false;
        }
      },
    };

    // Create a sandboxed VM with enhanced capabilities
    const VM = await loadVM();
    const vm = new VM({
      timeout: 30000, // 30 second timeout
      sandbox: {
        // Perplexica API
        PerplexicaAPI,
        api: new PerplexicaAPI(apiBaseUrl),
        
        // Filesystem access (sandboxed to workspace)
        fs: fsHelpers,
        
        // Tool discovery helpers (progressive disclosure)
        searchTools: (query: string, detailLevel: 'name' | 'summary' | 'full' = 'summary') => {
          return searchTools(query, detailLevel);
        },
        listServers: () => listServers(),
        listServerTools: (serverName: string) => listServerTools(serverName),
        getToolByPath: (filePath: string) => {
          const tool = getToolByPath(filePath);
          return tool ? { code: tool.code, description: tool.description, schema: tool.schema } : null;
        },
        
        // Skills system
        saveSkill: async (skill: any) => {
          return await saveSkill(skill, workspace);
        },
        loadSkill: async (skillName: string) => {
          return await loadSkill(skillName, workspace);
        },
        listSkills: async () => {
          return await listSkills(workspace);
        },
        
        // Console for logging
        console: {
          log: (...args: any[]) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args: any[]) => {
            logs.push('ERROR: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          warn: (...args: any[]) => {
            logs.push('WARN: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
        },
        
        // Basic utilities
        setTimeout: (fn: Function, delay: number) => {
          return setTimeout(fn, Math.min(delay, 5000));
        },
        Promise,
        JSON,
        Array,
        Object,
        String,
        Number,
        Date,
        Math,
        
        // Prevent access to dangerous globals
        process: undefined,
        require: undefined,
        global: undefined,
        Buffer: undefined,
        __dirname: undefined,
        __filename: undefined,
        import: undefined,
        eval: undefined,
        Function: undefined,
      },
    });

    // Wrap code to capture output and handle async
    const wrappedCode = `
      (async () => {
        // Helper to import tool files (simulated import)
        const importTool = (filePath) => {
          const tool = getToolByPath(filePath);
          if (!tool) throw new Error(\`Tool not found: \${filePath}\`);
          
          // Return a function that calls the MCP tool via API
          // In real execution, this would be replaced with actual API calls
          return async function(input) {
            // Map tool name to API method
            const toolName = tool.name;
            if (toolName === 'perplexica_search') {
              return await api.search(input);
            } else if (toolName === 'perplexica_search_images') {
              return await api.searchImages(input);
            } else if (toolName === 'perplexica_search_videos') {
              return await api.searchVideos(input);
            } else if (toolName === 'perplexica_chat') {
              return await api.chat(input);
            } else if (toolName === 'perplexica_get_models') {
              return await api.getModels();
            } else if (toolName === 'perplexica_get_config') {
              return await api.getConfig();
            }
            throw new Error(\`Unknown tool: \${toolName}\`);
          };
        };
        
        ${code}
      })()
        .then(result => {
          if (result !== undefined) {
            output.push(result);
          }
        })
        .catch(error => {
          throw error;
        });
    `;

    // Execute code
    await vm.run(wrappedCode);

    return {
      success: true,
      output: output.length > 0 ? output : undefined,
      logs: logs.length > 0 ? logs : undefined,
      filesCreated: filesCreated.length > 0 ? filesCreated : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
      logs: logs.length > 0 ? logs : undefined,
      filesCreated: filesCreated.length > 0 ? filesCreated : undefined,
    };
  }
}

/**
 * Generate enhanced Code Mode template with filesystem discovery
 */
export function generateCodeModeTemplate(): string {
  return `// Perplexica Code Mode Template
// Enhanced with filesystem-based tool discovery and state persistence

// Option 1: Use PerplexicaAPI directly (simplest)
const api = new PerplexicaAPI();

const result = await api.search({
  query: "Your query here",
  focusMode: "webSearch",
  optimizationMode: "balanced"
});

console.log(result.message);
console.log('Sources:', result.sources);

// Option 2: Discover tools on-demand (progressive disclosure)
// List available servers
const servers = listServers();
console.log('Available servers:', servers);

// Search for tools by keyword
const searchResults = searchTools('search', 'summary');
console.log('Found tools:', searchResults);

// Get detailed tool information
const tool = getToolByPath('servers/perplexica/search.ts');
if (tool) {
  console.log('Tool description:', tool.description);
  console.log('Tool schema:', tool.schema);
}

// Option 3: Explore filesystem structure
// List all tools in perplexica server
const tools = listServerTools('perplexica');
console.log('Perplexica tools:', tools);

// Read tool files from virtual filesystem
const toolCode = await fs.readFile('servers/perplexica/search.ts', 'utf-8');
console.log('Tool code:', toolCode);

// Option 4: State persistence (save intermediate results)
await fs.writeFile('./workspace/results.json', JSON.stringify(result, null, 2));

// Later, read back saved state
const saved = await fs.readFile('./workspace/results.json', 'utf-8');
const loaded = JSON.parse(saved);

// Option 5: Chain multiple operations efficiently
const searchResult = await api.search({ query: "AI trends", focusMode: "webSearch" });
const images = await api.searchImages({ query: "AI trends" });
const videos = await api.searchVideos({ query: "AI trends" });

// Save combined results
const combined = {
  search: searchResult.message,
  images: images.images.slice(0, 5),
  videos: videos.videos.slice(0, 5)
};
await fs.writeFile('./workspace/combined-results.json', JSON.stringify(combined, null, 2));

return combined;
`;
}

