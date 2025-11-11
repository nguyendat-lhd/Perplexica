#!/usr/bin/env tsx
/**
 * Script để thực thi nghiên cứu về VBee AI sử dụng Code Mode của MCP Perplexica
 * 
 * Usage:
 *   tsx vbee-research-runner.ts
 *   hoặc
 *   npm run research:vbee
 * 
 * Yêu cầu:
 *   - Perplexica server phải đang chạy tại http://localhost:3000 (hoặc set PERPLEXICA_BASE_URL)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Đọc code từ file
const codeFile = join(__dirname, 'vbee-research.ts');
const codeContent = readFileSync(codeFile, 'utf-8');

// Extract code từ file (loại bỏ phần export và comment)
const codeMatch = codeContent.match(/const code = `([\s\S]*?)`;/);
if (!codeMatch) {
  console.error('❌ Không thể đọc code từ file');
  process.exit(1);
}

const code = codeMatch[1];

// Base URL của Perplexica API
const API_BASE_URL = process.env.PERPLEXICA_BASE_URL || 'http://localhost:3000';
// Sử dụng query parameter để tránh vấn đề routing
const EXECUTE_ENDPOINT = `${API_BASE_URL}/api/mcp?action=execute-code`;

async function runResearch() {
  console.log('🚀 Bắt đầu nghiên cứu về VBee AI...');
  console.log(`📡 Kết nối đến: ${API_BASE_URL}\n`);

  try {
    // Gửi request để execute code
    const response = await fetch(EXECUTE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        apiBaseUrl: API_BASE_URL,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Lỗi khi thực thi code:');
      console.error(result.error);
      if (result.logs && result.logs.length > 0) {
        console.error('\n📋 Logs:');
        result.logs.forEach((log: string) => console.error(log));
      }
      process.exit(1);
    }

    // In logs
    if (result.logs && result.logs.length > 0) {
      console.log('📋 Logs từ quá trình thực thi:');
      console.log('─'.repeat(80));
      result.logs.forEach((log: string) => console.log(log));
      console.log('─'.repeat(80));
    }

    // In output nếu có
    if (result.output && result.output.length > 0) {
      console.log('\n📄 Kết quả JSON:');
      try {
        const article = JSON.parse(result.output[0]);
        console.log(JSON.stringify(article, null, 2));
        
        // Lưu kết quả vào file
        const outputFile = join(__dirname, 'vbee-research-result.json');
        writeFileSync(outputFile, JSON.stringify(article, null, 2), 'utf-8');
        console.log(`\n💾 Đã lưu kết quả vào: ${outputFile}`);
      } catch (e) {
        console.log(result.output[0]);
      }
    }

    console.log('\n✅ Hoàn thành!');
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.cause) {
      console.error('Chi tiết:', error.cause);
    }
    process.exit(1);
  }
}

// Chạy async function
runResearch();
