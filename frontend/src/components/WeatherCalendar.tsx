import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Calendar, MapPin, Cloud, CloudRain, Sun, Wind } from 'lucide-react';

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

export function WeatherCalendar({ farmId, operations = [], onOperationClick }: WeatherCalendarProps) {
  const { getAuthHeaders } = useAuth();

  const { data: weatherData, isLoading } = useQuery({
    queryKey: ['weather-calendar', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/weather/farm?farm_id=${farmId}&days=30`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
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
      case 'planting': return 'bg-green-500';
      case 'fertilizing': return 'bg-blue-500';
      case 'irrigation': return 'bg-cyan-500';
      case 'harvest': return 'bg-orange-500';
      case 'pest_control': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Calendar className="h-6 w-6 animate-spin mr-2" />
          Loading weather calendar...
        </div>
      </div>
    );
  }

  const weatherDays: WeatherDay[] = weatherData?.weather || [];
  const operationsByDate = operations.reduce((acc, op) => {
    const date = op.scheduled_date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(op);
    return acc;
  }, {} as Record<string, typeof operations>);

  // Group weather data by week
  const weeklyData = [];
  for (let i = 0; i < weatherDays.length; i += 7) {
    weeklyData.push(weatherDays.slice(i, i + 7));
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Weather & Operations Calendar</h3>
      </div>

      <div className="space-y-6">
        {weeklyData.map((week, weekIndex) => (
          <div key={weekIndex} className="space-y-3">
            <h4 className="font-medium text-gray-700">
              Week of {new Date(week[0].data_date).toLocaleDateString()}
            </h4>
            
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const date = new Date(week[0].data_date);
                date.setDate(date.getDate() + dayIndex);
                const dateStr = date.toISOString().split('T')[0];
                
                const weatherDay = week[dayIndex];
                const dayOperations = operationsByDate[dateStr] || [];
                
                return (
                  <div
                    key={dayIndex}
                    className={`border rounded p-2 min-h-[120px] ${
                      date.getDay() === 0 || date.getDay() === 6 
                        ? 'bg-gray-50' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <div className="text-xs text-gray-600">
                        {date.toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-medium">
                        {date.getDate()}
                      </div>
                    </div>

                    {weatherDay && (
                      <div className="space-y-1">
                        <div className="flex justify-center">
                          {getWeatherIcon(weatherDay.precipitation_sum)}
                        </div>
                        <div className="text-xs text-center">
                          <div>{weatherDay.temperature_max}°/{weatherDay.temperature_min}°</div>
                          <div className="text-blue-600">{weatherDay.precipitation_sum}mm</div>
                        </div>
                      </div>
                    )}

                    {dayOperations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {dayOperations.map((op) => (
                          <div
                            key={op.id}
                            className={`${getOperationTypeColor(op.type)} text-white text-xs p-1 rounded cursor-pointer`}
                            onClick={() => onOperationClick?.(op.id)}
                          >
                            <div className="truncate">{op.title}</div>
                            <div className="text-xs opacity-80">
                              {op.status}
                            </div>
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

        {weatherDays.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>No weather data available</p>
            <p className="text-sm">Set your farm location to see weather calendar</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium mb-3">Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span>Sunny</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-gray-500" />
            <span>Cloudy</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-blue-500" />
            <span>Rainy</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span>Windy</span>
          </div>
        </div>
        
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Planting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Fertilizing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Harvest</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherCalendar;