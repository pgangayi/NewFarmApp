import { apiClient } from '../../lib/cloudflare';
import { ENDPOINTS as apiEndpoints } from '../../api/config';
import { WeatherData, WeatherImpact } from '../../api/types';

/**
 * DOMAIN SERVICE: Weather
 * -----------------------
 * Handles weather-related data fetching and analysis.
 */

export class WeatherService {
  /**
   * Get weather forecast/history for a specific farm
   */
  static async getFarmWeather(farmId: string, days: number = 7): Promise<WeatherData[]> {
    return apiClient.get<WeatherData[]>(
      `${apiEndpoints.weather.farm}?farm_id=${farmId}&days=${days}`
    );
  }

  /**
   * Get weather impact analysis for crops and livestock
   */
  static async getWeatherImpactAnalysis(
    farmId: string,
    cropType?: string
  ): Promise<WeatherImpact[]> {
    return apiClient.post<WeatherImpact[]>(apiEndpoints.weather.impact, {
      farm_id: farmId,
      crop_type: cropType,
    });
  }

  /**
   * Get weather-based recommendations
   */
  static async getWeatherRecommendations(): Promise<any[]> {
    return apiClient.get<any[]>(apiEndpoints.weather.recommendations);
  }

  /**
   * Acknowledge a weather alert
   */
  static async acknowledgeAlert(alertId: string): Promise<any> {
    return apiClient.post('/api/weather', {
      action: 'acknowledge_alert',
      alert_id: alertId,
    });
  }
}
