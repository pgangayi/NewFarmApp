// Test AI endpoint
const testAI = async () => {
  try {
    // Try different endpoints
    const endpoints = [
      'http://localhost:8788/test-ai',
      'http://localhost:8788/api/ai',
      'http://localhost:8788/api/ai/',
      'http://localhost:8788/api/ai/insights'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n=== Testing ${endpoint} ===`);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'What are the best practices for tomato farming?'
          })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        if (text) {
          try {
            const data = JSON.parse(text);
            console.log('✅ Success! Parsed data:', JSON.stringify(data, null, 2));
            break;
          } catch (e) {
            console.log('Failed to parse as JSON:', e.message);
          }
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
};

testAI();
