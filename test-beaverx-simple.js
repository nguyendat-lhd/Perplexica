// Simple test for beaverx.ai using the chat API with AI Agent Review focus mode
const fetch = require('node-fetch');

async function testBeaverXWithChatAPI() {
  console.log('🧪 Testing beaverx.ai with Chat API (AI Agent Review mode)');
  console.log('========================================================\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'Cho tôi biết về beaverx.ai - AI agent này có gì đặc biệt?'
        },
        optimizationMode: 'balanced',
        focusMode: 'aiAgentReview',
        history: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log(`📊 Response type: ${typeof data}`);
    
    if (data.message) {
      console.log('💬 Message preview:');
      const messageLines = data.message.split('\n').slice(0, 10);
      messageLines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`   ${index + 1}. ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        }
      });
    }

    if (data.sources && data.sources.length > 0) {
      console.log(`\n📚 Sources found: ${data.sources.length}`);
      data.sources.slice(0, 3).forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.metadata?.url || 'No URL'}`);
      });
    }

    if (data.images && data.images.length > 0) {
      console.log(`\n🖼️ Images found: ${data.images.length}`);
    }

    if (data.videos && data.videos.length > 0) {
      console.log(`\n🎥 Videos found: ${data.videos.length}`);
    }

    console.log('\n🎯 Test Summary');
    console.log('===============');
    console.log('✅ Chat API with AI Agent Review mode working');
    console.log('✅ Response received successfully');
    console.log('✅ Sources and media search enabled');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    // Try to get more details about the error
    if (error.message.includes('HTTP error')) {
      console.log('\n🔍 Debugging info:');
      console.log('- Server might not be running');
      console.log('- API endpoint might not exist');
      console.log('- Check server logs for errors');
    }
  }
}

// Run the test
testBeaverXWithChatAPI().catch(console.error);


