/**
 * Filesystem-based Tool Discovery
 * 
 * Exposes MCP tools as TypeScript files in a filesystem structure.
 * This allows agents to discover and load tools on-demand, reducing token usage.
 * 
 * Based on Anthropic's Code Execution with MCP approach:
 * https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import { allTools } from '../tools/index';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolFile {
  name: string;
  path: string;
  description: string;
  code: string;
  schema: any;
}

export interface ToolSearchResult {
  name: string;
  path: string;
  description: string;
  detailLevel: 'name' | 'summary' | 'full';
}

/**
 * Generate TypeScript code for a tool
 */
function generateToolCode(tool: Tool): string {
  const functionName = tool.name.replace('perplexica_', '').replace(/_/g, '');
  const paramName = functionName.charAt(0).toLowerCase() + functionName.slice(1);
  
  // Generate TypeScript interface from schema
  const generateInterface = (schema: any, name: string): string => {
    if (!schema.properties) return '';
    
    const props = Object.entries(schema.properties).map(([key, value]: [string, any]) => {
      const optional = schema.required?.includes(key) ? '' : '?';
      let type = 'any';
      
      if (value.type === 'string') type = 'string';
      else if (value.type === 'number') type = 'number';
      else if (value.type === 'boolean') type = 'boolean';
      else if (value.type === 'array') type = 'any[]';
      else if (value.type === 'object') {
        const nestedName = `${name}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        return `${key}${optional}: ${generateInterface(value, nestedName)}`;
      }
      
      return `${key}${optional}: ${type}`;
    }).join(';\n    ');
    
    return `interface ${name} {\n    ${props}\n  }`;
  };

  const inputInterface = generateInterface(tool.inputSchema, `${functionName.charAt(0).toUpperCase() + functionName.slice(1)}Input`);
  const description = tool.description || `Perplexica ${functionName} tool`;

  return `// ${description}

${inputInterface}

/**
 * ${description}
 */
export async function ${functionName}(input: ${functionName.charAt(0).toUpperCase() + functionName.slice(1)}Input): Promise<any> {
  return callMCPTool('${tool.name}', input);
}
`;
}

/**
 * Get all tools as filesystem structure
 */
export function getToolsAsFilesystem(): Record<string, ToolFile> {
  const files: Record<string, ToolFile> = {};
  
  // Create server directory structure
  files['servers/perplexica/index.ts'] = {
    name: 'index',
    path: 'servers/perplexica/index.ts',
    description: 'Perplexica MCP Server - Main entry point',
    code: `// Perplexica MCP Server
// Import individual tools as needed

export * from './search.js';
export * from './searchImages.js';
export * from './searchVideos.js';
export * from './chat.js';
export * from './getModels.js';
export * from './getConfig.js';
`,
    schema: {},
  };

  // Generate individual tool files
  for (const tool of allTools) {
    const functionName = tool.name.replace('perplexica_', '').replace(/_/g, '');
    const fileName = `${functionName}.ts`;
    const filePath = `servers/perplexica/${fileName}`;
    
    files[filePath] = {
      name: functionName,
      path: filePath,
      description: tool.description || `Perplexica ${functionName} tool`,
      code: generateToolCode(tool),
      schema: tool.inputSchema,
    };
  }

  // Create client helper
  files['servers/client.ts'] = {
    name: 'client',
    path: 'servers/client.ts',
    description: 'MCP Client helper for calling tools',
    code: `/**
 * MCP Client Helper
 * 
 * This function calls MCP tools. In Code Mode execution,
 * it's replaced with actual API calls.
 */

export async function callMCPTool(toolName: string, input: any): Promise<any> {
  // This is replaced at runtime with actual API calls
  throw new Error(\`Tool \${toolName} not available in this context\`);
}
`,
    schema: {},
  };

  return files;
}

/**
 * Search tools by query
 */
export function searchTools(
  query: string,
  detailLevel: 'name' | 'summary' | 'full' = 'summary',
): ToolSearchResult[] {
  const lowerQuery = query.toLowerCase();
  const results: ToolSearchResult[] = [];
  
  for (const tool of allTools) {
    const matchesName = tool.name.toLowerCase().includes(lowerQuery);
    const matchesDescription = tool.description?.toLowerCase().includes(lowerQuery) || false;
    
    if (matchesName || matchesDescription) {
      const functionName = tool.name.replace('perplexica_', '').replace(/_/g, '');
      const filePath = `servers/perplexica/${functionName}.ts`;
      
      let description = '';
      if (detailLevel === 'name') {
        description = tool.name;
      } else if (detailLevel === 'summary') {
        description = tool.description?.split('\n')[0] || tool.name; // First line only
      } else {
        description = tool.description || tool.name;
      }
      
      results.push({
        name: tool.name,
        path: filePath,
        description,
        detailLevel,
      });
    }
  }
  
  return results;
}

/**
 * Get tool by path
 */
export function getToolByPath(path: string): ToolFile | null {
  const files = getToolsAsFilesystem();
  return files[path] || null;
}

/**
 * List all available servers
 */
export function listServers(): string[] {
  return ['perplexica'];
}

/**
 * List tools in a server
 */
export function listServerTools(serverName: string): string[] {
  if (serverName !== 'perplexica') return [];
  
  return allTools.map(tool => {
    const functionName = tool.name.replace('perplexica_', '').replace(/_/g, '');
    return `servers/perplexica/${functionName}.ts`;
  });
}

