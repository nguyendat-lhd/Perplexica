// Test script to check basic loading
const fetch = require('node-fetch');

async function testBasicLoading() {
  console.log('🔍 Testing Basic Loading');
  console.log('========================\n');

  const focusModes = ['webSearch', 'academicSearch', 'writingAssistant', 'wolframAlphaSearch', 'youtubeSearch', 'redditSearch', 'aiAgentReview'];

  for (const mode of focusModes) {
    try {
      console.log(`Testing ${mode}...`);
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            role: 'user',
            content: 'test',
            messageId: `test_${mode}`,
            chatId: `test_${mode}`
          },
          optimizationMode: 'balanced',
          focusMode: mode,
          history: []
        })
      });

      if (response.ok) {
        console.log(`   ✅ ${mode} works`);
      } else {
        const error = await response.json();
        console.log(`   ❌ ${mode} failed: ${error.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ${mode} error: ${error.message}`);
    }
  }

  console.log('\n🎯 Summary:');
  console.log('===========');
  console.log('This test shows which focus modes are actually working in runtime.');
  console.log('If aiAgentReview fails, it means there\'s a compilation or import issue.');
}

testBasicLoading().catch(console.error);
