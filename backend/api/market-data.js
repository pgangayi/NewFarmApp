// Market Data Integration API
// Provides commodity pricing and market data from external sources

import { createSuccessResponse, createErrorResponse } from './_auth.js';

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Route handling
  if (path === '/api/market/commodities' && method === 'GET') {
    return await getCommodityPrices(request, env);
  } else if (path === '/api/market/trends' && method === 'GET') {
    return await getMarketTrends(request, env);
  } else if (path === '/api/market/forecast' && method === 'GET') {
    return await getPriceForecast(request, env);
  } else {
    return createErrorResponse('Market data endpoint not found', 404);
  }
}

async function getCommodityPrices(request, env) {
  try {
    const url = new URL(request.url);
    const commodity = url.searchParams.get('commodity') || 'corn';
    const region = url.searchParams.get('region') || 'US';

    // In a real implementation, this would call external APIs like:
    // - USDA AMS API
    // - CME Group API
    // - Bloomberg Agriculture API
    // - Local agricultural boards

    // Mock data for demonstration
    const mockPrices = {
      corn: {
        current: 4.25,
        unit: 'bushel',
        currency: 'USD',
        change: 0.05,
        changePercent: 1.2,
        lastUpdated: new Date().toISOString(),
        sources: ['USDA AMS', 'CME Group']
      },
      wheat: {
        current: 5.80,
        unit: 'bushel',
        currency: 'USD',
        change: -0.12,
        changePercent: -2.0,
        lastUpdated: new Date().toISOString(),
        sources: ['USDA AMS', 'Kansas City Board']
      },
      soybeans: {
        current: 11.50,
        unit: 'bushel',
        currency: 'USD',
        change: 0.30,
        changePercent: 2.7,
        lastUpdated: new Date().toISOString(),
        sources: ['USDA AMS', 'CME Group']
      }
    };

    const priceData = mockPrices[commodity.toLowerCase()];
    if (!priceData) {
      return createErrorResponse(`Commodity '${commodity}' not found`, 404);
    }

    return createSuccessResponse({
      commodity,
      region,
      ...priceData
    });
  } catch (error) {
    console.error('Commodity prices error:', error);
    return createErrorResponse('Failed to fetch commodity prices', 500);
  }
}

async function getMarketTrends(request, env) {
  try {
    const url = new URL(request.url);
    const commodity = url.searchParams.get('commodity') || 'corn';
    const period = url.searchParams.get('period') || '30d';

    // Mock trend data
    const trends = {
      corn: {
        period,
        data: [
          { date: '2024-01-01', price: 4.10, volume: 125000 },
          { date: '2024-01-08', price: 4.15, volume: 118000 },
          { date: '2024-01-15', price: 4.20, volume: 132000 },
          { date: '2024-01-22', price: 4.25, volume: 141000 }
        ],
        averagePrice: 4.18,
        priceRange: { min: 4.10, max: 4.25 },
        trend: 'upward',
        volatility: 'moderate'
      }
    };

    const trendData = trends[commodity.toLowerCase()];
    if (!trendData) {
      return createErrorResponse(`Trend data for '${commodity}' not available`, 404);
    }

    return createSuccessResponse({
      commodity,
      ...trendData
    });
  } catch (error) {
    console.error('Market trends error:', error);
    return createErrorResponse('Failed to fetch market trends', 500);
  }
}

async function getPriceForecast(request, env) {
  try {
    const url = new URL(request.url);
    const commodity = url.searchParams.get('commodity') || 'corn';
    const days = parseInt(url.searchParams.get('days')) || 30;

    // Mock forecast data
    const forecasts = {
      corn: {
        commodity,
        forecastDays: days,
        predictions: [
          { date: '2024-02-01', predictedPrice: 4.30, confidence: 0.85, factors: ['Weather patterns', 'Supply levels'] },
          { date: '2024-02-08', predictedPrice: 4.35, confidence: 0.80, factors: ['Export demand', 'Currency rates'] },
          { date: '2024-02-15', predictedPrice: 4.40, confidence: 0.75, factors: ['Planting intentions', 'Inventory reports'] }
        ],
        overallTrend: 'bullish',
        keyDrivers: ['Strong export demand', 'Lower production estimates', 'Weather concerns'],
        riskFactors: ['Sudden weather changes', 'Policy announcements', 'Global economic conditions']
      }
    };

    const forecastData = forecasts[commodity.toLowerCase()];
    if (!forecastData) {
      return createErrorResponse(`Forecast for '${commodity}' not available`, 404);
    }

    return createSuccessResponse(forecastData);
  } catch (error) {
    console.error('Price forecast error:', error);
    return createErrorResponse('Failed to fetch price forecast', 500);
  }
}

export async function onRequest(context) {
  return handleRequest(context.request, context.env);
}