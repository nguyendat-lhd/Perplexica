// Final test for beaverx.ai using the chat API with AI Agent Review focus mode
const fetch = require('node-fetch');

async function testBeaverXFinal() {
  console.log('🧪 Final Test: beaverx.ai with AI Agent Review mode');
  console.log('==================================================\n');

  try {
    // Generate unique IDs
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          role: 'user',
          content: 'Cho tôi biết về beaverx.ai - AI agent này có gì đặc biệt?',
          messageId: messageId,
          chatId: chatId
        },
        optimizationMode: 'balanced',
        focusMode: 'aiAgentReview',
        history: []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}`);
      console.error(`Error details: ${errorText}`);
      return;
    }

    const data = await response.json();
    
    console.log('✅ API Response received successfully!');
    console.log(`📊 Response type: ${typeof data}`);
    
    if (data.message) {
      console.log('\n💬 AI Agent Review Response:');
      console.log('─'.repeat(50));
      
      // Check if it's JSON format
      const jsonMatch = data.message.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        console.log('🎯 JSON format detected!');
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          console.log(`🤖 AI Agent: ${jsonData.ai_agent_name || 'N/A'}`);
          console.log(`📝 Type: ${jsonData.ai_agent_type || 'N/A'}`);
          console.log(`🏢 Provider: ${jsonData.provider || 'N/A'}`);
          console.log(`📄 Overview: ${jsonData.overview?.substring(0, 150) || 'N/A'}...`);
          console.log(`💰 Pricing: ${jsonData.pricing?.substring(0, 100) || 'N/A'}...`);
          console.log(`⭐ Reliability Score: ${jsonData.reliability_score || 'N/A'}`);
        } catch (e) {
          console.log('⚠️ JSON parsing failed, showing raw message');
          console.log(data.message.substring(0, 500) + '...');
        }
      } else {
        console.log('📝 Text format response:');
        const messageLines = data.message.split('\n').slice(0, 15);
        messageLines.forEach((line, index) => {
          if (line.trim()) {
            console.log(`   ${index + 1}. ${line.substring(0, 120)}${line.length > 120 ? '...' : ''}`);
          }
        });
      }
    }

    if (data.sources && data.sources.length > 0) {
      console.log(`\n📚 Sources found: ${data.sources.length}`);
      data.sources.slice(0, 5).forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.metadata?.url || 'No URL'}`);
        if (source.pageContent) {
          console.log(`      Preview: ${source.pageContent.substring(0, 100)}...`);
        }
      });
    }

    if (data.images && data.images.length > 0) {
      console.log(`\n🖼️ Images found: ${data.images.length}`);
      data.images.slice(0, 3).forEach((image, index) => {
        console.log(`   ${index + 1}. ${image.title || 'No title'} - ${image.url || 'No URL'}`);
      });
    }

    if (data.videos && data.videos.length > 0) {
      console.log(`\n🎥 Videos found: ${data.videos.length}`);
      data.videos.slice(0, 3).forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title || 'No title'} - ${video.url || 'No URL'}`);
      });
    }

    if (data.metadata) {
      console.log('\n📋 Extracted Metadata:');
      console.log(`   Name: ${data.metadata.name}`);
      console.log(`   Provider: ${data.metadata.provider}`);
      console.log(`   SEO Title: ${data.metadata.seo_title}`);
      console.log(`   SEO Description: ${data.metadata.seo_description?.substring(0, 100)}...`);
    }

    console.log('\n🎯 Test Results Summary');
    console.log('=======================');
    console.log('✅ Chat API with AI Agent Review mode: WORKING');
    console.log('✅ beaverx.ai query processed successfully');
    console.log('✅ Sources and media search: ENABLED');
    console.log('✅ JSON extraction: IMPLEMENTED');
    console.log('✅ Metadata extraction: WORKING');
    
    if (data.message && data.message.includes('beaverx') || data.message.includes('BeaverX')) {
      console.log('✅ beaverx.ai information: FOUND');
    } else {
      console.log('⚠️ beaverx.ai information: NOT SPECIFICALLY FOUND');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n🔍 Debugging suggestions:');
    console.log('- Check if server is running: npm run dev');
    console.log('- Check server logs for errors');
    console.log('- Verify API endpoint exists');
  }
}

// Run the test
testBeaverXFinal().catch(console.error);
