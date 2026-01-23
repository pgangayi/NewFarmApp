// Google AI Service for Farm Management System
// Integrates Gemini 2.0 Flash for intelligent farm insights

class GoogleAIService {
  constructor(env) {
    this.apiKey = env.GOOGLE_AI_API_KEY;
    this.model = env.GOOGLE_AI_MODEL || 'gemini-2.0-flash-exp';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateFarmInsights(prompt, context = {}) {
    try {
      const systemPrompt = `You are an expert agricultural AI assistant for a farm management system. 
      Provide practical, data-driven advice for farmers. Consider factors like:
      - Crop rotation recommendations
      - Pest and disease management
      - Weather patterns and climate
      - Soil health and fertility
      - Livestock management
      - Resource optimization
      - Sustainable farming practices
      
      Response should be concise, actionable, and specific to the context provided.`;

      const fullPrompt = `${systemPrompt}\n\nContext: ${JSON.stringify(context)}\n\nUser Query: ${prompt}`;

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          success: true,
          response: data.candidates[0].content.parts[0].text,
          model: this.model,
          usage: data.usageMetadata || {}
        };
      } else {
        throw new Error('Invalid response format from Google AI');
      }
    } catch (error) {
      console.error('Google AI Service Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackResponse: 'AI service temporarily unavailable. Please try again later.'
      };
    }
  }

  async analyzeCropData(cropData, weatherData = null) {
    const prompt = `Analyze this crop data and provide recommendations:
    Crop: ${cropData.type}
    Growth Stage: ${cropData.growthStage}
    Planting Date: ${cropData.plantingDate}
    Health Status: ${cropData.healthStatus}
    ${weatherData ? `Weather Conditions: ${JSON.stringify(weatherData)}` : ''}
    
    Focus on:
    1. Current health assessment
    2. Potential risks (pests, diseases, weather)
    3. Actionable recommendations for next 7 days
    4. Long-term management suggestions`;

    return this.generateFarmInsights(prompt, { cropData, weatherData });
  }

  async getLivestockRecommendations(livestockData) {
    const prompt = `Provide livestock management recommendations:
    Animal Type: ${livestockData.type}
    Count: ${livestockData.count}
    Health Status: ${livestockData.healthStatus}
    Feed Schedule: ${livestockData.feedSchedule}
    Last Checkup: ${livestockData.lastCheckup}
    
    Include advice on:
    1. Health monitoring
    2. Feeding optimization
    3. Disease prevention
    4. Breeding recommendations (if applicable)`;

    return this.generateFarmInsights(prompt, { livestockData });
  }

  async generateTaskSchedule(tasks, priorities = {}) {
    const prompt = `Optimize this farm task schedule:
    Tasks: ${JSON.stringify(tasks)}
    Priorities: ${JSON.stringify(priorities)}

    Consider:
    1. Weather dependencies
    2. Resource availability
    3. Critical timelines
    4. Task dependencies
    5. Labor efficiency

    Provide a prioritized schedule with specific timing and resource allocation.`;

    return this.generateFarmInsights(prompt, { tasks, priorities });
  }

  async predictYield(cropData, historicalData = [], weatherForecast = []) {
    const prompt = `Predict crop yield based on the following data:
    Current Crop: ${JSON.stringify(cropData)}
    Historical Yields: ${JSON.stringify(historicalData)}
    Weather Forecast: ${JSON.stringify(weatherForecast)}

    Provide:
    1. Expected yield range (tons/hectare)
    2. Confidence level in prediction
    3. Key factors influencing yield
    4. Recommendations to optimize yield
    5. Risk factors that could reduce yield`;

    return this.generateFarmInsights(prompt, { cropData, historicalData, weatherForecast });
  }

  async assessRisks(farmData, marketData = {}, weatherData = {}) {
    const prompt = `Conduct comprehensive risk assessment for the farm:
    Farm Data: ${JSON.stringify(farmData)}
    Market Conditions: ${JSON.stringify(marketData)}
    Weather Patterns: ${JSON.stringify(weatherData)}

    Assess risks in:
    1. Weather-related risks (drought, flood, frost, etc.)
    2. Market price volatility
    3. Pest and disease outbreaks
    4. Equipment failure
    5. Labor availability
    6. Financial risks

    For each risk category, provide:
    - Risk level (Low/Medium/High)
    - Potential impact
    - Mitigation strategies
    - Recommended insurance or hedging options`;

    return this.generateFarmInsights(prompt, { farmData, marketData, weatherData });
  }

  async generatePredictiveAnalytics(data, timeFrame = 'season') {
    const prompt = `Generate predictive analytics for ${timeFrame} timeframe:
    Data: ${JSON.stringify(data)}

    Provide insights on:
    1. Trend analysis and forecasting
    2. Performance predictions
    3. Optimization opportunities
    4. Early warning indicators
    5. Scenario planning (best/worst case)
    6. Resource allocation recommendations

    Focus on actionable intelligence that can improve farm profitability and sustainability.`;

    return this.generateFarmInsights(prompt, { data, timeFrame });
  }
}

export { GoogleAIService };
