import toml from '@iarna/toml';

// Use dynamic imports for Node.js modules to prevent client-side errors
let fs: any;
let path: any;
if (typeof window === 'undefined') {
  // We're on the server
  fs = require('fs');
  path = require('path');
}

const configFileName = 'config.toml';
const sampleConfigFileName = 'sample.config.toml';

interface Config {
  GENERAL: {
    SIMILARITY_MEASURE: string;
    KEEP_ALIVE: string;
  };
  MODELS: {
    OPENAI: {
      API_KEY: string;
    };
    GROQ: {
      API_KEY: string;
    };
    ANTHROPIC: {
      API_KEY: string;
    };
    GEMINI: {
      API_KEY: string;
    };
    OLLAMA: {
      API_URL: string;
      API_KEY: string;
    };
    DEEPSEEK: {
      API_KEY: string;
    };
    AIMLAPI: {
      API_KEY: string;
    };
    LM_STUDIO: {
      API_URL: string;
    };
    LEMONADE: {
      API_URL: string;
      API_KEY: string;
    };
    CUSTOM_OPENAI: {
      API_URL: string;
      API_KEY: string;
      MODEL_NAME: string;
    };
    BEDROCK: {
      ACCESS_KEY_ID: string;
      SECRET_ACCESS_KEY: string;
      REGION: string;
    };
  };
  API_ENDPOINTS: {
    SEARXNG: string;
  };
}

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

const loadConfig = () => {
  // Server-side only
  if (typeof window === 'undefined') {
    const configPath = path.join(process.cwd(), configFileName);
    const sampleConfigPath = path.join(process.cwd(), sampleConfigFileName);
    
    // If config.toml doesn't exist, create it from sample.config.toml
    if (!fs.existsSync(configPath)) {
      if (fs.existsSync(sampleConfigPath)) {
        // Copy sample.config.toml to config.toml
        const sampleConfig = fs.readFileSync(sampleConfigPath, 'utf-8');
        fs.writeFileSync(configPath, sampleConfig);
      } else {
        // Create a default config.toml if sample doesn't exist
        const defaultConfig = `[GENERAL]
SIMILARITY_MEASURE = "cosine"
KEEP_ALIVE = "5m"

[MODELS.OPENAI]
API_KEY = ""

[MODELS.GROQ]
API_KEY = ""

[MODELS.ANTHROPIC]
API_KEY = ""

[MODELS.GEMINI]
API_KEY = ""

[MODELS.CUSTOM_OPENAI]
API_KEY = ""
API_URL = ""
MODEL_NAME = ""

[MODELS.OLLAMA]
API_URL = ""
API_KEY = ""

[MODELS.DEEPSEEK]
API_KEY = ""

[MODELS.AIMLAPI]
API_KEY = ""

[MODELS.LM_STUDIO]
API_URL = ""

[MODELS.LEMONADE]
API_URL = ""
API_KEY = ""

[MODELS.BEDROCK]
ACCESS_KEY_ID = ""
SECRET_ACCESS_KEY = ""
REGION = ""

[API_ENDPOINTS]
SEARXNG = ""
`;
        fs.writeFileSync(configPath, defaultConfig);
      }
    }
    
    return toml.parse(
      fs.readFileSync(configPath, 'utf-8'),
    ) as any as Config;
  }

  // Client-side fallback - settings will be loaded via API
  return {} as Config;
};

export const getSimilarityMeasure = () =>
  loadConfig().GENERAL.SIMILARITY_MEASURE;

export const getKeepAlive = () => loadConfig().GENERAL.KEEP_ALIVE;

export const getOpenaiApiKey = () => loadConfig().MODELS.OPENAI.API_KEY;

export const getGroqApiKey = () => loadConfig().MODELS.GROQ.API_KEY;

export const getAnthropicApiKey = () => loadConfig().MODELS.ANTHROPIC.API_KEY;

export const getGeminiApiKey = () => loadConfig().MODELS.GEMINI.API_KEY;

export const getSearxngApiEndpoint = () =>
  process.env.SEARXNG_API_URL || loadConfig().API_ENDPOINTS.SEARXNG;

export const getOllamaApiEndpoint = () => loadConfig().MODELS.OLLAMA.API_URL;

export const getOllamaApiKey = () => loadConfig().MODELS.OLLAMA.API_KEY;

export const getDeepseekApiKey = () => loadConfig().MODELS.DEEPSEEK.API_KEY;

export const getAimlApiKey = () => loadConfig().MODELS.AIMLAPI.API_KEY;

export const getCustomOpenaiApiKey = () =>
  loadConfig().MODELS.CUSTOM_OPENAI.API_KEY;

export const getCustomOpenaiApiUrl = () =>
  loadConfig().MODELS.CUSTOM_OPENAI.API_URL;

export const getCustomOpenaiModelName = () =>
  loadConfig().MODELS.CUSTOM_OPENAI.MODEL_NAME;

export const getLMStudioApiEndpoint = () =>
  loadConfig().MODELS.LM_STUDIO.API_URL;

export const getLemonadeApiEndpoint = () =>
  loadConfig().MODELS.LEMONADE.API_URL;

export const getLemonadeApiKey = () => loadConfig().MODELS.LEMONADE.API_KEY;

export const getBedrockAccessKeyId = () => {
  try {
    const value = loadConfig().MODELS.BEDROCK?.ACCESS_KEY_ID || '';
    return typeof value === 'string' ? value.trim() : '';
  } catch {
    return '';
  }
};

export const getBedrockSecretAccessKey = () => {
  try {
    const value = loadConfig().MODELS.BEDROCK?.SECRET_ACCESS_KEY || '';
    return typeof value === 'string' ? value.trim() : '';
  } catch {
    return '';
  }
};

export const getBedrockRegion = () => {
  try {
    const value = loadConfig().MODELS.BEDROCK?.REGION || '';
    return typeof value === 'string' ? value.trim() : '';
  } catch {
    return '';
  }
};

const mergeConfigs = (current: any, update: any): any => {
  if (update === null || update === undefined) {
    return current;
  }

  if (typeof current !== 'object' || current === null) {
    return update;
  }

  const result = { ...current };

  for (const key in update) {
    if (Object.prototype.hasOwnProperty.call(update, key)) {
      const updateValue = update[key];

      if (
        typeof updateValue === 'object' &&
        updateValue !== null &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = mergeConfigs(result[key], updateValue);
      } else if (updateValue !== undefined) {
        result[key] = updateValue;
      }
    }
  }

  return result;
};

export const updateConfig = (config: RecursivePartial<Config>) => {
  // Server-side only
  if (typeof window === 'undefined') {
    const currentConfig = loadConfig();
    const mergedConfig = mergeConfigs(currentConfig, config);
    fs.writeFileSync(
      path.join(path.join(process.cwd(), `${configFileName}`)),
      toml.stringify(mergedConfig),
    );
  }
};
