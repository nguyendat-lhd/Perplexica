const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          messageId: 'test-123',
          chatId: 'test-chat-123',
          content: 'Đánh giá Wondercraft.ai'
        },
        optimizationMode: 'balanced',
        focusMode: 'aiAgentReview',
        history: []
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('Error:', error);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            console.log('Received:', data);
          } catch (e) {
            console.log('Raw line:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPI();
