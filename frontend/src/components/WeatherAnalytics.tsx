import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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

  const { data: weatherData, isLoading, error } = useQuery({
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading weather analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Weather Data Unavailable</h2>
          <p className="text-gray-600 mb-4">
            We're having trouble loading weather analytics. Please check your connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Cloud className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Weather Analytics</h1>
                  <p className="text-sm text-gray-600 mt-1">Comprehensive weather insights and trends</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Weather Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Weather Trends</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {weatherTrends.map((trend) => (
                <div key={trend.metric} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {trend.metric === 'Temperature' && <Thermometer className="h-5 w-5 text-red-500" />}
                      {trend.metric === 'Rainfall' && <Droplets className="h-5 w-5 text-blue-500" />}
                      {trend.metric === 'Humidity' && <Cloud className="h-5 w-5 text-gray-500" />}
                      <h4 className="font-semibold text-gray-900">{trend.metric}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {trend.trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">
                      {trend.current}
                      {trend.metric === 'Rainfall' && 'mm'}
                      {trend.metric === 'Humidity' && '%'}
                      {(trend.metric === 'Temperature') && '°C'}
                    </div>
                    
                    <div className={`text-sm font-medium ${
                      trend.change > 0 ? 'text-green-600' : 
                      trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change} vs previous week
                    </div>
                    
                    <p className="text-xs text-gray-500">{trend.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crop-Weather Impact Analysis */}
          {cropImpacts && cropImpacts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Crop-Weather Impact</h3>
              </div>

              <div className="space-y-6">
                {cropImpacts.map((impact) => (
                  <div key={impact.cropType} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-xl text-gray-900">{impact.cropType}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Suitability:</span>
                        <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                          impact.suitability >= 80 ? 'bg-green-500' :
                          impact.suitability >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {impact.suitability}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-3 text-gray-900 flex items-center gap-2">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            Optimal Conditions
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Temperature:</span>
                              <span className="font-medium text-gray-900">{impact.optimalConditions.temperature}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rainfall:</span>
                              <span className="font-medium text-gray-900">{impact.optimalConditions.rainfall}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Humidity:</span>
                              <span className="font-medium text-gray-900">{impact.optimalConditions.humidity}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-3 text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Current Risks
                          </h5>
                          <ul className="text-sm text-red-600 space-y-1">
                            {impact.risks.map((risk, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium mb-3 text-blue-900 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Recommendations
                      </h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {impact.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Weather Patterns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Seasonal Patterns</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-100">
                <h4 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  Temperature Patterns
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Week:</span>
                    <span className="font-semibold text-gray-900">
                      {weatherData?.weather?.[0] ? 
                        `${weatherData.weather[0].temperature_min}° - ${weatherData.weather[0].temperature_max}°C` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Historical Average:</span>
                    <span className="font-semibold text-gray-900">22° - 28°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deviation:</span>
                    <span className="font-semibold text-green-600">+2°C</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-100">
                <h4 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  Rainfall Patterns
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Week:</span>
                    <span className="font-semibold text-gray-900">
                      {weatherData?.weather?.[0] ? 
                        `${weatherData.weather[0].precipitation_sum}mm` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Historical Average:</span>
                    <span className="font-semibold text-gray-900">25mm/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deviation:</span>
                    <span className="font-semibold text-red-600">-8mm</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather Forecast Insight
              </h5>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Extreme Weather Preparedness</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Heat Wave Risk
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className="font-semibold text-yellow-600">Moderate</span>
                    </div>
                    <div className="text-gray-600">
                      Temperatures may exceed 35°C in the next week.
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    Drought Risk
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className="font-semibold text-green-600">Low</span>
                    </div>
                    <div className="text-gray-600">
                      Recent rainfall provides adequate moisture.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Recommended Actions
                </h5>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Increase irrigation frequency during hot periods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Apply mulch to reduce soil moisture evaporation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Monitor crops daily for heat stress symptoms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Ensure adequate ventilation in greenhouse structures</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherAnalytics;