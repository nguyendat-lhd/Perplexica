// Test script to check runtime loading of searchHandlers
const fetch = require('node-fetch');

async function testRuntimeLoading() {
  console.log('🔍 Testing Runtime Loading of Search Handlers');
  console.log('=============================================\n');

  try {
    // Test with a simple request to see what's available
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'test',
          messageId: 'test123',
          chatId: 'test456'
        },
        optimizationMode: 'balanced',
        focusMode: 'aiAgentReview',
        history: []
      })
    });

    const data = await response.json();
    
    if (data.availableModes) {
      console.log('📋 Available focus modes in runtime:');
      data.availableModes.forEach((mode, index) => {
        console.log(`   ${index + 1}. ${mode}`);
      });
      
      const hasAiAgentReview = data.availableModes.includes('aiAgentReview');
      console.log(`\n🤖 aiAgentReview available: ${hasAiAgentReview ? '✅' : '❌'}`);
      
      if (!hasAiAgentReview) {
        console.log('\n🔍 Debugging:');
        console.log('   - aiAgentReview is defined in code but not loaded in runtime');
        console.log('   - This suggests a TypeScript compilation or import issue');
        console.log('   - The server might be failing to load the searchHandlers properly');
      }
    } else {
      console.log('❌ No available modes returned');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRuntimeLoading().catch(console.error);
