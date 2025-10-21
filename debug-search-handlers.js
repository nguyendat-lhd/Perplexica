// Debug script to check searchHandlers loading
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Search Handlers Loading');
console.log('====================================\n');

try {
  // Check if files exist
  const searchIndexPath = './src/lib/search/index.ts';
  const promptsIndexPath = './src/lib/prompts/index.ts';
  
  console.log('📁 Checking files:');
  console.log(`   search/index.ts: ${fs.existsSync(searchIndexPath) ? '✅' : '❌'}`);
  console.log(`   prompts/index.ts: ${fs.existsSync(promptsIndexPath) ? '✅' : '❌'}`);
  
  // Read search/index.ts
  const searchIndexContent = fs.readFileSync(searchIndexPath, 'utf8');
  console.log('\n📋 Search handlers defined:');
  const handlerMatches = searchIndexContent.match(/^\s*(\w+):\s*new MetaSearchAgent/gm);
  if (handlerMatches) {
    handlerMatches.forEach((match, index) => {
      const handlerName = match.match(/(\w+):/)[1];
      console.log(`   ${index + 1}. ${handlerName}`);
    });
  }
  
  // Check if aiAgentReview is defined
  const hasAiAgentReview = searchIndexContent.includes('aiAgentReview:');
  console.log(`\n🤖 aiAgentReview defined: ${hasAiAgentReview ? '✅' : '❌'}`);
  
  // Read prompts/index.ts
  const promptsIndexContent = fs.readFileSync(promptsIndexPath, 'utf8');
  console.log('\n📝 Prompts exported:');
  const promptMatches = promptsIndexContent.match(/^\s*(\w+),/gm);
  if (promptMatches) {
    promptMatches.forEach((match, index) => {
      const promptName = match.match(/(\w+),/)[1];
      console.log(`   ${index + 1}. ${promptName}`);
    });
  }
  
  // Check if aiAgentReview prompts are exported
  const hasAiAgentReviewPrompts = promptsIndexContent.includes('aiAgentReview');
  console.log(`\n🧠 aiAgentReview prompts exported: ${hasAiAgentReviewPrompts ? '✅' : '❌'}`);
  
  console.log('\n🎯 Summary:');
  console.log('===========');
  console.log(`✅ Search handlers file exists: ${fs.existsSync(searchIndexPath)}`);
  console.log(`✅ Prompts file exists: ${fs.existsSync(promptsIndexPath)}`);
  console.log(`✅ aiAgentReview handler defined: ${hasAiAgentReview}`);
  console.log(`✅ aiAgentReview prompts exported: ${hasAiAgentReviewPrompts}`);
  
  if (hasAiAgentReview && hasAiAgentReviewPrompts) {
    console.log('\n🚀 All components are properly defined!');
    console.log('   The issue might be with TypeScript compilation or server restart.');
  } else {
    console.log('\n❌ Missing components detected!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
