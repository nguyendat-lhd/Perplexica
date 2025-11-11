/**
 * Skills System for Code Mode
 * 
 * Allows agents to save and reuse code functions as "skills".
 * Based on Anthropic's Code Execution with MCP approach.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Skill {
  name: string;
  description: string;
  code: string;
  parameters?: {
    name: string;
    type: string;
    description: string;
  }[];
  example?: string;
}

/**
 * Save a skill to the skills directory
 */
export async function saveSkill(
  skill: Skill,
  workspaceDir: string = '.mcp-workspace',
): Promise<string> {
  const skillsDir = path.join(workspaceDir, 'skills');
  await fs.mkdir(skillsDir, { recursive: true });
  
  const skillFile = path.join(skillsDir, `${skill.name}.ts`);
  const skillContent = generateSkillFile(skill);
  
  await fs.writeFile(skillFile, skillContent, 'utf-8');
  
  // Also create SKILL.md for documentation
  const skillDoc = path.join(skillsDir, `${skill.name}.md`);
  const docContent = generateSkillDoc(skill);
  await fs.writeFile(skillDoc, docContent, 'utf-8');
  
  return skillFile;
}

/**
 * Load a skill by name
 */
export async function loadSkill(
  skillName: string,
  workspaceDir: string = '.mcp-workspace',
): Promise<Skill | null> {
  const skillFile = path.join(workspaceDir, 'skills', `${skillName}.ts`);
  
  try {
    const content = await fs.readFile(skillFile, 'utf-8');
    return parseSkillFromCode(content);
  } catch {
    return null;
  }
}

/**
 * List all available skills
 */
export async function listSkills(
  workspaceDir: string = '.mcp-workspace',
): Promise<string[]> {
  const skillsDir = path.join(workspaceDir, 'skills');
  
  try {
    const files = await fs.readdir(skillsDir);
    return files
      .filter(f => f.endsWith('.ts'))
      .map(f => f.replace('.ts', ''));
  } catch {
    return [];
  }
}

function generateSkillFile(skill: Skill): string {
  const params = skill.parameters || [];
  const paramList = params.map(p => `${p.name}: ${p.type}`).join(', ');
  const paramDocs = params.map(p => ` * @param ${p.name} - ${p.description}`).join('\n');
  
  return `/**
 * ${skill.description}
${paramDocs}
 */

export async function ${skill.name}(${paramList}): Promise<any> {
${skill.code}
}
`;
}

function generateSkillDoc(skill: Skill): string {
  return `# ${skill.name}

${skill.description}

## Parameters

${skill.parameters?.map(p => `- **${p.name}** (${p.type}): ${p.description}`).join('\n') || 'None'}

## Example

\`\`\`typescript
${skill.example || `await ${skill.name}();`}
\`\`\`

## Code

\`\`\`typescript
${skill.code}
\`\`\`
`;
}

function parseSkillFromCode(content: string): Skill {
  const nameMatch = content.match(/export async function (\w+)/);
  const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
  const codeMatch = content.match(/\{([\s\S]+)\}\s*$/);
  
  return {
    name: nameMatch?.[1] || 'unknown',
    description: descMatch?.[1] || 'No description',
    code: codeMatch?.[1] || '',
  };
}

/**
 * Built-in skills for common Perplexica operations
 */
export const builtInSkills: Skill[] = [
  {
    name: 'searchAndSave',
    description: 'Search for a query and save results to a file',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query' },
      { name: 'focusMode', type: 'string', description: 'Focus mode (webSearch, academicSearch, etc.)' },
      { name: 'outputFile', type: 'string', description: 'Output file path' },
    ],
    code: `  const api = new PerplexicaAPI();
  const result = await api.search({
    query,
    focusMode,
  });
  
  await fs.writeFile(outputFile, JSON.stringify(result, null, 2), 'utf-8');
  return result;`,
    example: `await searchAndSave('AI trends', 'webSearch', './workspace/ai-trends.json');`,
  },
  {
    name: 'comprehensiveResearch',
    description: 'Perform comprehensive research on a topic: search, images, and videos',
    parameters: [
      { name: 'topic', type: 'string', description: 'Research topic' },
    ],
    code: `  const api = new PerplexicaAPI();
  
  const [searchResult, images, videos] = await Promise.all([
    api.search({ query: topic, focusMode: 'webSearch' }),
    api.searchImages({ query: topic }),
    api.searchVideos({ query: topic }),
  ]);
  
  const research = {
    topic,
    summary: searchResult.message,
    sources: searchResult.sources,
    images: images.images.slice(0, 5),
    videos: videos.videos.slice(0, 5),
  };
  
  await fs.writeFile(\`./workspace/research-\${topic.replace(/\\s+/g, '-')}.json\`, 
    JSON.stringify(research, null, 2), 'utf-8');
  
  return research;`,
    example: `await comprehensiveResearch('machine learning');`,
  },
];

