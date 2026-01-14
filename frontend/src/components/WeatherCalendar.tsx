import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/AuthContext';
import { WeatherService } from '../services/domains/WeatherService';
import { Calendar, MapPin, Cloud, CloudRain, Sun, Wind, Loader2, AlertCircle } from 'lucide-react';

interface WeatherDay {
  data_date: string;
  temperature_max: number | null;
  temperature_min: number | null;
  precipitation_sum: number;
  weather_description: string;
  wind_speed_max: number | null;
}

interface WeatherCalendarProps {
  farmId: string;
  operations?: Array<{
    id: string;
    title: string;
    scheduled_date: string;
    type: string;
    status: string;
  }>;
  onOperationClick?: (operationId: string) => void;
}

export function WeatherCalendar({
  farmId,
  operations = [],
  onOperationClick,
}: WeatherCalendarProps) {
  const { getAuthHeaders } = useAuth();

  const {
    data: weatherData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['weather-calendar', farmId],
    queryFn: async () => {
      return WeatherService.getFarmWeather(farmId, 30);
    },
    enabled: !!farmId,
  });

  const getWeatherIcon = (precipitation: number) => {
    if (precipitation > 5) return <CloudRain className="h-4 w-4 text-blue-500" />;
    if (precipitation > 0) return <Cloud className="h-4 w-4 text-gray-500" />;
    return <Sun className="h-4 w-4 text-yellow-500" />;
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'planting':
        return 'bg-green-500';
      case 'fertilizing':
        return 'bg-blue-500';
      case 'irrigation':
        return 'bg-cyan-500';
      case 'harvest':
        return 'bg-orange-500';
      case 'pest_control':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading weather calendar...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Weather Calendar Unavailable</h2>
          <p className="text-gray-600 mb-4">
            We&apos;re having trouble loading the weather calendar. Please check your connection and
            try again.
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

  const weatherDays: WeatherDay[] = Array.isArray(weatherData)
    ? weatherData.map(d => ({
        data_date: d.date,
        temperature_max: d.temp_max,
        temperature_min: d.temp_min,
        precipitation_sum: d.precipitation,
        weather_description: d.condition,
        wind_speed_max: d.wind_speed,
      }))
    : [];
  const operationsByDate = operations.reduce(
    (acc, op) => {
      const date = op.scheduled_date.split('T')[0] || 'unknown';
      if (!acc[date]) acc[date] = [];
      acc[date].push(op);
      return acc;
    },
    {} as Record<string, typeof operations>
  );

  // Group weather data by week
  const weeklyData = [];
  for (let i = 0; i < weatherDays.length; i += 7) {
    weeklyData.push(weatherDays.slice(i, i + 7));
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
                  <Calendar className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Weather Calendar</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Weather patterns and farm operations timeline
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {weatherDays.length > 0 ? (
            <div className="space-y-8">
              {weeklyData.map((week, weekIndex) => (
                <div key={weekIndex} className="space-y-4">
                  {week[0] && (
                    <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      Week of {new Date(week[0].data_date).toLocaleDateString()}
                    </h4>
                  )}

                  <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      if (!week[0]) return null;
                      const date = new Date(week[0].data_date);
                      date.setDate(date.getDate() + dayIndex);
                      const dateStr = date.toISOString().split('T')[0]!;

                      const weatherDay = week[dayIndex];
                      const dayOperations = operationsByDate[dateStr] || [];

                      return (
                        <div
                          key={dayIndex}
                          className={`rounded-xl p-4 min-h-[140px] border transition-all hover:shadow-md ${
                            date.getDay() === 0 || date.getDay() === 6
                              ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                              : 'bg-gradient-to-br from-white to-blue-50 border-gray-200'
                          }`}
                        >
                          <div className="text-center mb-3">
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {date.toLocaleDateString('en', { weekday: 'short' })}
                            </div>
                            <div className="text-lg font-bold text-gray-900">{date.getDate()}</div>
                          </div>

                          {weatherDay && (
                            <div className="space-y-2">
                              <div className="flex justify-center">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  {getWeatherIcon(weatherDay.precipitation_sum)}
                                </div>
                              </div>
                              <div className="text-xs text-center space-y-1">
                                <div className="font-semibold text-gray-900">
                                  {weatherDay.temperature_max}°/{weatherDay.temperature_min}°
                                </div>
                                <div className="text-blue-600 font-medium">
                                  {weatherDay.precipitation_sum}mm
                                </div>
                              </div>
                            </div>
                          )}

                          {dayOperations.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {dayOperations.map((op: any) => (
                                <div
                                  key={op.id}
                                  className={`${getOperationTypeColor(op.type)} text-white text-xs p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity`}
                                  onClick={() => onOperationClick?.(op.id)}
                                >
                                  <div className="truncate font-medium">{op.title}</div>
                                  <div className="text-xs opacity-90">{op.status}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  Legend
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Sunny</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                    <Cloud className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Cloudy</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <CloudRain className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Rainy</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <Wind className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Windy</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">Planting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-700">Fertilizing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                    <span className="text-sm text-gray-700">Irrigation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm text-gray-700">Harvest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700">Pest Control</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Weather Data Available
              </h3>
              <p className="text-gray-600 mb-4">
                Set your farm location to see weather calendar and planning insights
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Configure Farm Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeatherCalendar;
