// Test script to check if searchHandlers are loaded correctly
const fetch = require('node-fetch');

async function testSearchHandlers() {
  console.log('🔍 Testing Search Handlers Loading');
  console.log('==================================\n');

  try {
    // Test with a valid focus mode first
    console.log('1️⃣ Testing with webSearch (should work):');
    const webSearchResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'test',
          messageId: 'test1',
          chatId: 'test1'
        },
        optimizationMode: 'balanced',
        focusMode: 'webSearch',
        history: []
      })
    });

    if (webSearchResponse.ok) {
      console.log('   ✅ webSearch works');
    } else {
      const error = await webSearchResponse.json();
      console.log(`   ❌ webSearch failed: ${error.message}`);
    }

    // Test with aiAgentReview
    console.log('\n2️⃣ Testing with aiAgentReview:');
    const aiAgentResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'test',
          messageId: 'test2',
          chatId: 'test2'
        },
        optimizationMode: 'balanced',
        focusMode: 'aiAgentReview',
        history: []
      })
    });

    if (aiAgentResponse.ok) {
      console.log('   ✅ aiAgentReview works');
    } else {
      const error = await aiAgentResponse.json();
      console.log(`   ❌ aiAgentReview failed: ${error.message}`);
      
      if (error.availableModes) {
        console.log('   📋 Available modes:');
        error.availableModes.forEach((mode, index) => {
          console.log(`      ${index + 1}. ${mode}`);
        });
      }
    }

    // Test with a non-existent focus mode
    console.log('\n3️⃣ Testing with invalid focus mode:');
    const invalidResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'test',
          messageId: 'test3',
          chatId: 'test3'
        },
        optimizationMode: 'balanced',
        focusMode: 'invalidMode',
        history: []
      })
    });

    if (invalidResponse.ok) {
      console.log('   ❌ Invalid mode should not work');
    } else {
      const error = await invalidResponse.json();
      console.log(`   ✅ Invalid mode correctly rejected: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSearchHandlers().catch(console.error);
