// Debug script to check available focus modes
const fetch = require('node-fetch');

async function debugFocusModes() {
  console.log('🔍 Debugging Focus Modes');
  console.log('========================\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'test',
          messageId: 'debug123',
          chatId: 'debug456'
        },
        optimizationMode: 'balanced',
        focusMode: 'aiAgentReview', // This should trigger the error
        history: []
      })
    });

    const data = await response.json();
    
    if (data.availableModes) {
      console.log('📋 Available focus modes:');
      data.availableModes.forEach((mode, index) => {
        console.log(`   ${index + 1}. ${mode}`);
      });
      console.log(`\n🎯 Requested mode: ${data.requestedMode}`);
      console.log(`❌ Error: ${data.message}`);
    } else {
      console.log('✅ Response received (no error):');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugFocusModes().catch(console.error);


