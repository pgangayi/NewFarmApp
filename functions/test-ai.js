// Simple AI test function
export async function onRequest(context) {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock AI response for testing
    const mockResponse = `Based on your question about "${prompt}", here are some general farming recommendations:
    
1. Soil preparation is crucial for successful farming
2. Choose crops suitable for your climate zone
3. Implement proper irrigation systems
4. Monitor for pests and diseases regularly
5. Maintain proper crop rotation schedules

This is a test response. The actual Google AI integration will provide more specific advice once configured.`;

    return new Response(JSON.stringify({
      success: true,
      response: mockResponse,
      model: 'test-mock'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
