const fetch = require('node-fetch');

async function testBeaverXReview() {
  console.log('🧪 Testing AI Agent Review API for BeaverX...\n');

  const requestBody = {
    query: 'Đánh giá chi tiết về BeaverX https://www.beaverx.ai/ - một nền tảng fintech quản lý danh mục đầu tư với AI assistant',
    history: [],
    includeImages: true,
    includeVideos: true,
  };

  console.log('📝 Request Body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n🔄 Sending request to API...\n');

  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/ai-agent-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`⏱️  Response Time: ${duration.toFixed(2)}s`);
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:');
      console.error(errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ Response received!\n');
    console.log('=' .repeat(80));
    console.log('📋 METADATA');
    console.log('='.repeat(80));
    if (data.metadata) {
      console.log(`Agent Name: ${data.metadata.name}`);
      console.log(`Provider: ${data.metadata.provider}`);
      console.log(`Country: ${data.metadata.provider_country || 'N/A'}`);
      console.log(`Website: ${data.metadata.website_url || 'N/A'}`);
      console.log(`Excerpt: ${data.metadata.excerpt || 'N/A'}`);
      console.log(`SEO Title: ${data.metadata.seo_title || 'N/A'}`);
      console.log(`SEO Description: ${data.metadata.seo_description || 'N/A'}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📄 MESSAGE');
    console.log('='.repeat(80));
    console.log(data.message);

    console.log('\n' + '='.repeat(80));
    console.log('🔗 SOURCES (' + (data.sources?.length || 0) + ')');
    console.log('='.repeat(80));
    if (data.sources && data.sources.length > 0) {
      data.sources.slice(0, 5).forEach((source, idx) => {
        console.log(`\n${idx + 1}. ${source.metadata?.title || 'No title'}`);
        console.log(`   URL: ${source.metadata?.url || 'No URL'}`);
        if (source.pageContent) {
          const preview = source.pageContent.substring(0, 150).replace(/\n/g, ' ');
          console.log(`   Preview: ${preview}...`);
        }
      });
      if (data.sources.length > 5) {
        console.log(`\n... and ${data.sources.length - 5} more sources`);
      }
    } else {
      console.log('No sources found');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🖼️  IMAGES (' + (data.images?.length || 0) + ')');
    console.log('='.repeat(80));
    if (data.images && data.images.length > 0) {
      data.images.slice(0, 3).forEach((image, idx) => {
        console.log(`\n${idx + 1}. ${image.title || 'No title'}`);
        console.log(`   URL: ${image.url || image.img_src || 'No URL'}`);
      });
      if (data.images.length > 3) {
        console.log(`\n... and ${data.images.length - 3} more images`);
      }
    } else {
      console.log('No images found');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎥 VIDEOS (' + (data.videos?.length || 0) + ')');
    console.log('='.repeat(80));
    if (data.videos && data.videos.length > 0) {
      data.videos.slice(0, 3).forEach((video, idx) => {
        console.log(`\n${idx + 1}. ${video.title || 'No title'}`);
        console.log(`   URL: ${video.url || 'No URL'}`);
      });
      if (data.videos.length > 3) {
        console.log(`\n... and ${data.videos.length - 3} more videos`);
      }
    } else {
      console.log('No videos found');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📦 STRUCTURED DATA');
    console.log('='.repeat(80));
    if (data.structured_data) {
      console.log(JSON.stringify(data.structured_data, null, 2));
    } else {
      console.log('No structured data available');
    }

    console.log('\n' + '='.repeat(80));
    console.log('💾 Full Response (JSON)');
    console.log('='.repeat(80));
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testBeaverXReview().then(() => {
  console.log('\n✅ Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

