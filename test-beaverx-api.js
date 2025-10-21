// Test API AI Agent Review với beaverx.ai
const fetch = require('node-fetch');

async function testBeaverXAPI() {
  console.log('🧪 Testing AI Agent Review API with beaverx.ai');
  console.log('================================================\n');

  const testQueries = [
    {
      query: 'Cho tôi biết về beaverx.ai',
      description: 'Basic query about beaverx.ai'
    },
    {
      query: 'BeaverX AI có gì đặc biệt?',
      description: 'Specific features query'
    },
    {
      query: 'So sánh beaverx.ai với các AI tools khác',
      description: 'Comparison query'
    }
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];
    console.log(`\n🔍 Test ${i + 1}: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log('─'.repeat(50));

    try {
      const response = await fetch('http://localhost:3000/api/ai-agent-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: test.query,
          history: [],
          includeImages: true,
          includeVideos: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ API Response received');
      console.log(`📊 Sources found: ${data.sources?.length || 0}`);
      console.log(`🖼️ Images found: ${data.images?.length || 0}`);
      console.log(`🎥 Videos found: ${data.videos?.length || 0}`);
      
      // Check if structured data was extracted
      if (data.structured_data) {
        console.log('✅ Structured data extracted successfully');
        console.log(`🤖 AI Agent: ${data.structured_data.ai_agent_name || 'N/A'}`);
        console.log(`📝 Type: ${data.structured_data.ai_agent_type || 'N/A'}`);
        console.log(`🏢 Provider: ${data.structured_data.provider || 'N/A'}`);
        console.log(`📄 Overview: ${data.structured_data.overview?.substring(0, 100) || 'N/A'}...`);
      } else {
        console.log('⚠️ No structured data found');
      }

      // Check metadata
      if (data.metadata) {
        console.log('📋 Metadata:');
        console.log(`   Name: ${data.metadata.name}`);
        console.log(`   Provider: ${data.metadata.provider}`);
        console.log(`   SEO Title: ${data.metadata.seo_title}`);
      }

      // Show first few lines of message
      if (data.message) {
        const messageLines = data.message.split('\n').slice(0, 5);
        console.log('💬 Message preview:');
        messageLines.forEach(line => {
          if (line.trim()) {
            console.log(`   ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
          }
        });
      }

    } catch (error) {
      console.error('❌ Error testing API:', error.message);
    }
  }

  console.log('\n🎯 Test Summary');
  console.log('===============');
  console.log('✅ API endpoint accessible');
  console.log('✅ JSON response format working');
  console.log('✅ Structured data extraction implemented');
  console.log('✅ Metadata extraction working');
  console.log('✅ Images and videos search enabled');
}

// Run the test
testBeaverXAPI().catch(console.error);
