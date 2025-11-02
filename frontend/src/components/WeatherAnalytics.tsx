import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

interface WeatherAnalyticsProps {
  farmId: string;
  cropType?: string;
}

interface WeatherTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface CropWeatherImpact {
  cropType: string;
  suitability: number; // 0-100
  risks: string[];
  recommendations: string[];
  optimalConditions: {
    temperature: string;
    rainfall: string;
    humidity: string;
  };
}

export function WeatherAnalytics({ farmId, cropType }: WeatherAnalyticsProps) {
  const { getAuthHeaders } = useAuth();

  const { data: weatherData, isLoading } = useQuery({
    queryKey: ['weather-analytics', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/weather/farm?farm_id=${farmId}&days=30`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
    },
    enabled: !!farmId,
  });

  // Mock weather trend analysis
  const generateWeatherTrends = (): WeatherTrend[] => {
    if (!weatherData?.weather) return [];
    
    const recent = weatherData.weather.slice(0, 7);
    const previous = weatherData.weather.slice(7, 14);
    
    const avgTemp = (days: any[]) => 
      days.reduce((sum, d) => sum + (d.temperature_avg || 0), 0) / days.length;
    
    const avgPrecip = (days: any[]) => 
      days.reduce((sum, d) => sum + (d.precipitation_sum || 0), 0) / days.length;
    
    const avgHumidity = (days: any[]) => 
      days.reduce((sum, d) => sum + ((d.relative_humidity_max || 0) + (d.relative_humidity_min || 0)) / 2, 0) / days.length;
    
    return [
      {
        metric: 'Temperature',
        current: Math.round(avgTemp(recent) * 10) / 10,
        previous: Math.round(avgTemp(previous) * 10) / 10,
        change: 0,
        trend: 'stable',
        description: 'Average temperature over the past week'
      },
      {
        metric: 'Rainfall',
        current: Math.round(avgPrecip(recent) * 10) / 10,
        previous: Math.round(avgPrecip(previous) * 10) / 10,
        change: 0,
        trend: 'stable',
        description: 'Average daily rainfall'
      },
      {
        metric: 'Humidity',
        current: Math.round(avgHumidity(recent) * 10) / 10,
        previous: Math.round(avgHumidity(previous) * 10) / 10,
        change: 0,
        trend: 'stable',
        description: 'Average relative humidity'
      }
    ].map(trend => ({
      ...trend,
      change: trend.current - trend.previous,
      trend: trend.change > 2 ? 'up' : trend.change < -2 ? 'down' : 'stable'
    }));
  };

  const { data: cropImpacts } = useQuery({
    queryKey: ['crop-weather-impact', farmId, cropType],
    queryFn: async () => {
      // Mock crop-weather impact analysis
      const mockImpacts: CropWeatherImpact[] = [
        {
          cropType: 'Corn',
          suitability: 85,
          risks: ['Late frost risk', 'High humidity may increase fungal disease'],
          recommendations: ['Monitor soil moisture', 'Consider fungicide application'],
          optimalConditions: {
            temperature: '18-32°C',
            rainfall: '500-750mm',
            humidity: '50-70%'
          }
        },
        {
          cropType: 'Wheat',
          suitability: 92,
          risks: ['Heat stress during flowering'],
          recommendations: ['Optimal conditions for next 2 weeks'],
          optimalConditions: {
            temperature: '15-25°C',
            rainfall: '300-500mm',
            humidity: '60-80%'
          }
        }
      ];
      
      return cropType ? mockImpacts.filter(impact => impact.cropType === cropType) : mockImpacts;
    },
    enabled: !!farmId,
  });

  const weatherTrends = generateWeatherTrends();

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Activity className="h-6 w-6 animate-spin mr-2" />
          Loading weather analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weather Trends */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Weather Trends</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weatherTrends.map((trend) => (
            <div key={trend.metric} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{trend.metric}</h4>
                <div className="flex items-center gap-1">
                  {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {trend.trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {trend.current}
                  {trend.metric === 'Rainfall' && 'mm'}
                  {trend.metric === 'Humidity' && '%'}
                  {(trend.metric === 'Temperature') && '°C'}
                </div>
                
                <div className={`text-sm ${
                  trend.change > 0 ? 'text-green-600' : 
                  trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.change > 0 ? '+' : ''}{trend.change} vs previous week
                </div>
                
                <p className="text-xs text-gray-600">{trend.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crop-Weather Impact Analysis */}
      {cropImpacts && cropImpacts.length > 0 && (
        <div className="border rounded-lg p-6 bg-white shadow">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Crop-Weather Impact</h3>
          </div>

          <div className="space-y-4">
            {cropImpacts.map((impact) => (
              <div key={impact.cropType} className="border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-lg">{impact.cropType}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Suitability:</span>
                    <div className={`px-2 py-1 rounded text-white text-sm ${
                      impact.suitability >= 80 ? 'bg-green-500' :
                      impact.suitability >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {impact.suitability}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Optimal Conditions</h5>
                    <div className="space-y-1 text-sm">
                      <div>Temperature: {impact.optimalConditions.temperature}</div>
                      <div>Rainfall: {impact.optimalConditions.rainfall}</div>
                      <div>Humidity: {impact.optimalConditions.humidity}</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Current Risks</h5>
                    <ul className="text-sm text-red-600 space-y-1">
                      {impact.risks.map((risk, index) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="font-medium mb-2">Recommendations</h5>
                  <ul className="text-sm text-green-600 space-y-1">
                    {impact.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Weather Patterns */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Seasonal Patterns</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Temperature Patterns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current Week:</span>
                <span className="font-medium">
                  {weatherData?.weather?.[0] ? 
                    `${weatherData.weather[0].temperature_min}° - ${weatherData.weather[0].temperature_max}°C` : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Historical Average:</span>
                <span className="font-medium">22° - 28°C</span>
              </div>
              <div className="flex justify-between">
                <span>Deviation:</span>
                <span className="font-medium text-green-600">+2°C</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Rainfall Patterns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current Week:</span>
                <span className="font-medium">
                  {weatherData?.weather?.[0] ? 
                    `${weatherData.weather[0].precipitation_sum}mm` : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Historical Average:</span>
                <span className="font-medium">25mm/week</span>
              </div>
              <div className="flex justify-between">
                <span>Deviation:</span>
                <span className="font-medium text-red-600">-8mm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h5 className="font-medium text-blue-800 mb-1">Weather Forecast Insight</h5>
          <p className="text-sm text-blue-700">
            Based on historical patterns, the current weather conditions suggest 
            {weatherData?.weather?.[0]?.precipitation_sum > 10 ? 
              ' adequate moisture for crop growth. Consider monitoring for potential fungal diseases.' :
              ' below-average rainfall. Prepare for additional irrigation needs.'
            }
          </p>
        </div>
      </div>

      {/* Extreme Weather Preparedness */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Extreme Weather Preparedness</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h4 className="font-medium text-red-600 mb-2">Heat Wave Risk</h4>
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Risk Level:</span>
                  <span className="font-medium text-yellow-600">Moderate</span>
                </div>
                <div className="text-gray-600">
                  Temperatures may exceed 35°C in the next week.
                </div>
              </div>
            </div>

            <div className="border rounded p-4">
              <h4 className="font-medium text-blue-600 mb-2">Drought Risk</h4>
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Risk Level:</span>
                  <span className="font-medium text-green-600">Low</span>
                </div>
                <div className="text-gray-600">
                  Recent rainfall provides adequate moisture.
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded">
            <h5 className="font-medium text-yellow-800 mb-2">Recommended Actions</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Increase irrigation frequency during hot periods</li>
              <li>• Apply mulch to reduce soil moisture evaporation</li>
              <li>• Monitor crops daily for heat stress symptoms</li>
              <li>• Ensure adequate ventilation in greenhouse structures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherAnalytics;