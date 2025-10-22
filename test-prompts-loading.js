// Test script to check prompts loading
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Prompts Loading');
console.log('==========================\n');

try {
  // Check if aiAgentReview prompts exist
  const promptsPath = './src/lib/prompts/aiAgentReview.ts';
  const promptsIndexPath = './src/lib/prompts/index.ts';
  
  console.log('📁 Checking files:');
  console.log(`   aiAgentReview.ts: ${fs.existsSync(promptsPath) ? '✅' : '❌'}`);
  console.log(`   prompts/index.ts: ${fs.existsSync(promptsIndexPath) ? '✅' : '❌'}`);
  
  // Read aiAgentReview.ts
  const aiAgentReviewContent = fs.readFileSync(promptsPath, 'utf8');
  console.log('\n📝 aiAgentReview prompts:');
  console.log(`   aiAgentReviewRetrieverPrompt: ${aiAgentReviewContent.includes('aiAgentReviewRetrieverPrompt') ? '✅' : '❌'}`);
  console.log(`   aiAgentReviewResponsePrompt: ${aiAgentReviewContent.includes('aiAgentReviewResponsePrompt') ? '✅' : '❌'}`);
  console.log(`   aiAgentReviewRetrieverFewShots: ${aiAgentReviewContent.includes('aiAgentReviewRetrieverFewShots') ? '✅' : '❌'}`);
  
  // Read prompts/index.ts
  const promptsIndexContent = fs.readFileSync(promptsIndexPath, 'utf8');
  console.log('\n📋 Exports in prompts/index.ts:');
  console.log(`   aiAgentReviewResponsePrompt: ${promptsIndexContent.includes('aiAgentReviewResponsePrompt') ? '✅' : '❌'}`);
  console.log(`   aiAgentReviewRetrieverPrompt: ${promptsIndexContent.includes('aiAgentReviewRetrieverPrompt') ? '✅' : '❌'}`);
  console.log(`   aiAgentReviewRetrieverFewShots: ${promptsIndexContent.includes('aiAgentReviewRetrieverFewShots') ? '✅' : '❌'}`);
  
  // Check if all prompts are exported
  const allPromptsExported = promptsIndexContent.includes('aiAgentReviewResponsePrompt') && 
                            promptsIndexContent.includes('aiAgentReviewRetrieverPrompt') && 
                            promptsIndexContent.includes('aiAgentReviewRetrieverFewShots');
  
  console.log(`\n🎯 All aiAgentReview prompts exported: ${allPromptsExported ? '✅' : '❌'}`);
  
  if (allPromptsExported) {
    console.log('\n🚀 Prompts are properly defined and exported!');
    console.log('   The issue is likely with TypeScript compilation or searchHandlers loading.');
  } else {
    console.log('\n❌ Missing prompt exports detected!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}


