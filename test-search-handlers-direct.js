// Test script to check searchHandlers loading directly
const fs = require('fs');

console.log('🔍 Testing Search Handlers Direct Loading');
console.log('=========================================\n');

try {
  // Read search/index.ts
  const searchIndexPath = './src/lib/search/index.ts';
  const searchIndexContent = fs.readFileSync(searchIndexPath, 'utf8');
  
  console.log('📋 Search handlers defined in code:');
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
  
  // Check if prompts are imported
  const hasPromptsImport = searchIndexContent.includes('import prompts from');
  console.log(`📝 Prompts imported: ${hasPromptsImport ? '✅' : '❌'}`);
  
  // Check if aiAgentReview prompts are used
  const hasAiAgentReviewPrompts = searchIndexContent.includes('prompts.aiAgentReview');
  console.log(`🧠 aiAgentReview prompts used: ${hasAiAgentReviewPrompts ? '✅' : '❌'}`);
  
  // Check the exact aiAgentReview definition
  const aiAgentReviewMatch = searchIndexContent.match(/aiAgentReview:\s*new MetaSearchAgent\(\{[\s\S]*?\}\)\s*,/);
  if (aiAgentReviewMatch) {
    console.log('\n📄 aiAgentReview definition:');
    console.log(aiAgentReviewMatch[0].substring(0, 200) + '...');
  }
  
  console.log('\n🎯 Summary:');
  console.log('===========');
  console.log(`✅ aiAgentReview defined: ${hasAiAgentReview}`);
  console.log(`✅ Prompts imported: ${hasPromptsImport}`);
  console.log(`✅ aiAgentReview prompts used: ${hasAiAgentReviewPrompts}`);
  
  if (hasAiAgentReview && hasPromptsImport && hasAiAgentReviewPrompts) {
    console.log('\n🚀 All components are properly defined in code!');
    console.log('   The issue is definitely with TypeScript compilation or runtime loading.');
    console.log('   Next.js might be failing to compile the searchHandlers due to TypeScript errors.');
  } else {
    console.log('\n❌ Missing components in code!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
