// AI Service for Frontend
// Handles communication with AI endpoints

import { API_CONFIG, STORAGE_KEYS } from '../api/config';

export interface AIInsightRequest {
  prompt: string;
  context?: Record<string, any>;
}

export interface CropAnalysisRequest {
  cropData: {
    type: string;
    growthStage: string;
    plantingDate: string;
    healthStatus: string;
  };
  weatherData?: Record<string, any>;
}

export interface LivestockAdviceRequest {
  livestockData: {
    type: string;
    count: number;
    healthStatus: string;
    feedSchedule: string;
    lastCheckup: string;
  };
}

export interface TaskSchedulingRequest {
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    estimatedDuration: number;
    dependencies?: string[];
  }>;
  priorities?: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  fallbackResponse?: string;
  model?: string;
  usage?: Record<string, any>;
}

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.baseUrl}/ai`;
  }

  async generateInsights(request: AIInsightRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Insights Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallbackResponse: 'AI service temporarily unavailable. Please try again later.',
      };
    }
  }

  async analyzeCropData(request: CropAnalysisRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/crop-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Crop Analysis Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallbackResponse: 'Crop analysis service temporarily unavailable.',
      };
    }
  }

  async getLivestockAdvice(request: LivestockAdviceRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/livestock-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Livestock Advice Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallbackResponse: 'Livestock advice service temporarily unavailable.',
      };
    }
  }

  async generateTaskSchedule(request: TaskSchedulingRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/task-scheduling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Task Scheduling Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallbackResponse: 'Task scheduling service temporarily unavailable.',
      };
    }
  }

  private getAuthToken(): string {
    // Get token from localStorage or context
    return localStorage.getItem(STORAGE_KEYS.authToken) || '';
  }

  // Helper method for common farm insights
  async getGeneralFarmAdvice(farmData: {
    crops?: any[];
    livestock?: any[];
    currentSeason: string;
    location: string;
  }): Promise<AIResponse> {
    const prompt = `Provide comprehensive farm management advice for:
    - Location: ${farmData.location}
    - Season: ${farmData.currentSeason}
    - Crops: ${farmData.crops?.length || 0} types
    - Livestock: ${farmData.livestock?.length || 0} types
    
    Focus on seasonal best practices, risk management, and optimization opportunities.`;

    return this.generateInsights({
      prompt,
      context: farmData,
    });
  }
}

export const aiService = new AIService();
export default aiService;
