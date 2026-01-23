// AI API Endpoints for Farm Management System
// Handles all AI-powered features

import { GoogleAIService } from './google-ai.js';

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Initialize AI service
  const aiService = new GoogleAIService(env);

  // Route handling
  if (path === '/api/ai/insights' && method === 'POST') {
    return await handleInsights(request, aiService);
  } else if (path === '/api/ai/crop-analysis' && method === 'POST') {
    return await handleCropAnalysis(request, aiService);
  } else if (path === '/api/ai/livestock-advice' && method === 'POST') {
    return await handleLivestockAdvice(request, aiService);
  } else if (path === '/api/ai/task-scheduling' && method === 'POST') {
    return await handleTaskScheduling(request, aiService);
  } else if (path === '/api/ai/yield-prediction' && method === 'POST') {
    return await handleYieldPrediction(request, aiService);
  } else if (path === '/api/ai/risk-assessment' && method === 'POST') {
    return await handleRiskAssessment(request, aiService);
  } else if (path === '/api/ai/predictive-analytics' && method === 'POST') {
    return await handlePredictiveAnalytics(request, aiService);
  } else {
    return new Response(JSON.stringify({ error: 'AI endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleInsights(request, aiService) {
  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.generateFarmInsights(prompt, context);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Insights endpoint error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate insights',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCropAnalysis(request, aiService) {
  try {
    const { cropData, weatherData } = await request.json();

    if (!cropData) {
      return new Response(JSON.stringify({ error: 'Crop data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.analyzeCropData(cropData, weatherData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Crop analysis endpoint error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze crop data',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleLivestockAdvice(request, aiService) {
  try {
    const { livestockData } = await request.json();

    if (!livestockData) {
      return new Response(JSON.stringify({ error: 'Livestock data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.getLivestockRecommendations(livestockData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Livestock advice endpoint error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate livestock advice',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleTaskScheduling(request, aiService) {
  try {
    const { tasks, priorities } = await request.json();

    if (!tasks || !Array.isArray(tasks)) {
      return new Response(JSON.stringify({ error: 'Tasks array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.generateTaskSchedule(tasks, priorities);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Task scheduling endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate task schedule',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleYieldPrediction(request, aiService) {
  try {
    const { cropData, historicalData, weatherForecast } = await request.json();

    if (!cropData) {
      return new Response(JSON.stringify({ error: 'Crop data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.predictYield(cropData, historicalData, weatherForecast);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Yield prediction endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate yield prediction',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleRiskAssessment(request, aiService) {
  try {
    const { farmData, marketData, weatherData } = await request.json();

    if (!farmData) {
      return new Response(JSON.stringify({ error: 'Farm data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.assessRisks(farmData, marketData, weatherData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Risk assessment endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate risk assessment',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePredictiveAnalytics(request, aiService) {
  try {
    const { data, timeFrame } = await request.json();

    if (!data) {
      return new Response(JSON.stringify({ error: 'Data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await aiService.generatePredictiveAnalytics(data, timeFrame);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Predictive analytics endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate predictive analytics',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequest(context) {
  return handleRequest(context.request, context.env);
}
