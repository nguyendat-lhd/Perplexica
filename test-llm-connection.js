#!/usr/bin/env node

/**
 * LLM Connection Test Script
 * 
 * This script helps diagnose LLM connection issues by:
 * 1. Reading and validating config.toml
 * 2. Testing available providers
 * 3. Making a test API call to the chat endpoint
 */

const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');
const axios = require('axios');

const CONFIG_FILE = path.join(__dirname, 'config.toml');

async function loadConfig() {
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return toml.parse(configContent);
  } catch (error) {
    console.error('❌ Error loading config.toml:', error.message);
    process.exit(1);
  }
}

async function testCustomOpenAI(config) {
  const { API_KEY, API_URL, MODEL_NAME } = config.MODELS.CUSTOM_OPENAI || {};
  
  if (!API_KEY || !API_URL || !MODEL_NAME) {
    console.log('⚠️  Custom OpenAI is not fully configured');
    console.log('   Required: API_KEY, API_URL, MODEL_NAME');
    console.log('   Current:');
    console.log('     - API_KEY:', API_KEY ? '✓ SET' : '✗ NOT SET');
    console.log('     - API_URL:', API_URL ? '✓ SET' : '✗ NOT SET');
    console.log('     - MODEL_NAME:', MODEL_NAME ? '✓ SET' : '✗ NOT SET');
    return false;
  }
  
  console.log('✓ Custom OpenAI configuration found:');
  console.log('   - API_URL:', API_URL);
  console.log('   - MODEL_NAME:', MODEL_NAME);
  console.log('   - API_KEY:', API_KEY.substring(0, 10) + '...');
  
  // Test connection to the API
  console.log('\n📡 Testing connection to Custom OpenAI API...');
  try {
    const response = await axios.post(
      `${API_URL}/chat/completions`,
      {
        model: MODEL_NAME,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 10000,
      }
    );
    
    console.log('✓ Successfully connected to Custom OpenAI API');
    console.log('   Response status:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Custom OpenAI API');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testGemini(config) {
  const { API_KEY } = config.MODELS.GEMINI || {};
  
  if (!API_KEY) {
    console.log('⚠️  Gemini API key is not configured');
    return false;
  }
  
  console.log('✓ Gemini API key found');
  console.log('   - API_KEY:', API_KEY.substring(0, 10) + '...');
  
  // Test connection to Gemini API
  console.log('\n📡 Testing connection to Gemini API...');
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        contents: [{ parts: [{ text: 'Hello' }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✓ Successfully connected to Gemini API');
    console.log('   Response status:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Gemini API');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testDebugEndpoint(baseUrl) {
  console.log('\n📡 Testing debug endpoint...');
  try {
    const response = await axios.get(`${baseUrl}/api/debug-config`, {
      timeout: 10000,
    });
    
    console.log('✓ Debug endpoint response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to call debug endpoint');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function main() {
  console.log('🔍 LLM Connection Diagnostic Tool\n');
  console.log('=' .repeat(60));
  
  // Load and validate config
  console.log('\n📖 Reading config.toml...');
  const config = await loadConfig();
  console.log('✓ Config loaded successfully\n');
  
  // Test Custom OpenAI
  console.log('=' .repeat(60));
  console.log('Testing Custom OpenAI Configuration');
  console.log('=' .repeat(60));
  await testCustomOpenAI(config);
  
  // Test Gemini
  console.log('\n' + '='.repeat(60));
  console.log('Testing Gemini Configuration');
  console.log('=' .repeat(60));
  await testGemini(config);
  
  // Test debug endpoint if URL provided
  if (process.argv[2]) {
    const baseUrl = process.argv[2];
    console.log('\n' + '='.repeat(60));
    console.log(`Testing Application at ${baseUrl}`);
    console.log('=' .repeat(60));
    await testDebugEndpoint(baseUrl);
  } else {
    console.log('\n💡 To test your production endpoint, run:');
    console.log('   node test-llm-connection.js https://perplexica.trangvang.ai');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Diagnostic Complete');
  console.log('=' .repeat(60));
}

main().catch(console.error);

