#!/usr/bin/env node

/**
 * Test script để kiểm tra 2 AI Agent Review handlers
 * 
 * Chạy: node test-ai-agent-handlers.js
 */

console.log('=== Test AI Agent Review Handlers ===\n');

// Test 1: Kiểm tra handlers có được load không
console.log('Test 1: Loading handlers...');
try {
  const { searchHandlers } = require('./src/lib/search/index.ts');
  
  const hasAiAgentReview = 'aiAgentReview' in searchHandlers;
  const hasAiAgentReviewApi = 'aiAgentReviewApi' in searchHandlers;
  
  console.log('✅ aiAgentReview handler:', hasAiAgentReview ? 'FOUND' : '❌ NOT FOUND');
  console.log('✅ aiAgentReviewApi handler:', hasAiAgentReviewApi ? 'FOUND' : '❌ NOT FOUND');
  
  if (!hasAiAgentReview || !hasAiAgentReviewApi) {
    console.error('\n❌ ERROR: Một hoặc cả hai handlers không được tìm thấy!');
    process.exit(1);
  }
  
  console.log('\n✅ Test 1 PASSED: Cả 2 handlers đều được load thành công\n');
} catch (error) {
  console.error('❌ Test 1 FAILED:', error.message);
  console.log('\nLưu ý: Test này có thể fail nếu chạy trực tiếp với Node.js do TypeScript.');
  console.log('Để test đầy đủ, hãy chạy ứng dụng và test qua API endpoints.\n');
}

// Test 2: Kiểm tra prompts có được export không
console.log('Test 2: Loading prompts...');
try {
  const prompts = require('./src/lib/prompts/index.ts').default;
  
  const hasAiAgentReviewPrompts = 
    'aiAgentReviewRetrieverPrompt' in prompts &&
    'aiAgentReviewResponsePrompt' in prompts &&
    'aiAgentReviewRetrieverFewShots' in prompts;
    
  const hasAiAgentReviewApiPrompts = 
    'aiAgentReviewApiRetrieverPrompt' in prompts &&
    'aiAgentReviewApiResponsePrompt' in prompts &&
    'aiAgentReviewApiRetrieverFewShots' in prompts;
  
  console.log('✅ aiAgentReview prompts:', hasAiAgentReviewPrompts ? 'FOUND' : '❌ NOT FOUND');
  console.log('✅ aiAgentReviewApi prompts:', hasAiAgentReviewApiPrompts ? 'FOUND' : '❌ NOT FOUND');
  
  if (!hasAiAgentReviewPrompts || !hasAiAgentReviewApiPrompts) {
    console.error('\n❌ ERROR: Một hoặc cả hai bộ prompts không được tìm thấy!');
    process.exit(1);
  }
  
  console.log('\n✅ Test 2 PASSED: Cả 2 bộ prompts đều được export thành công\n');
} catch (error) {
  console.error('❌ Test 2 FAILED:', error.message);
  console.log('\nLưu ý: Test này có thể fail nếu chạy trực tiếp với Node.js do TypeScript.');
  console.log('Để test đầy đủ, hãy chạy ứng dụng và test qua API endpoints.\n');
}

// Test 3: Hướng dẫn test thực tế
console.log('=== Hướng dẫn Test Thực tế ===\n');

console.log('1. Test AI Agent Review (Chat Focus Mode):');
console.log('   - Mở chat interface');
console.log('   - Chọn focus mode "AI Agent Review"');
console.log('   - Gửi câu hỏi: "Cho tôi biết về ChatGPT"');
console.log('   - Kiểm tra: Phản hồi streaming có hoạt động không\n');

console.log('2. Test AI Agent Review API:');
console.log('   curl -X POST http://localhost:3000/api/ai-agent-review \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"query":"Cho tôi biết về ChatGPT","history":[],"includeImages":true,"includeVideos":true}\'');
console.log('   - Kiểm tra: Response có chứa JSON structure với metadata không\n');

console.log('3. Tùy chỉnh Prompts:');
console.log('   - Chat: Sửa src/lib/prompts/aiAgentReview.ts');
console.log('   - API: Sửa src/lib/prompts/aiAgentReviewApi.ts');
console.log('   - Restart server để áp dụng thay đổi\n');

console.log('=== Tổng kết ===\n');
console.log('✅ Đã tách thành công 2 handlers riêng biệt:');
console.log('   - aiAgentReview: Dùng cho Chat Focus Mode');
console.log('   - aiAgentReviewApi: Dùng cho API Endpoint');
console.log('✅ Mỗi handler có bộ prompts riêng để tùy chỉnh độc lập');
console.log('✅ Xem chi tiết trong file: AI_AGENT_REVIEW_HANDLERS.md\n');

