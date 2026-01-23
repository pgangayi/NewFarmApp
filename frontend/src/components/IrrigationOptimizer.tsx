import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIrrigation } from '../api';
import { useFarm } from '../hooks';
import { Button } from './ui/button';
import {
  Droplets,
  Calendar,
  TrendingUp,
  Clock,
  // MapPin,
  Settings,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';

const TAB_BASE_CLASS = 'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1';
const TAB_ACTIVE_CLASS = 'border-blue-500 text-blue-600';
const TAB_INACTIVE_CLASS =
  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';

interface IrrigationOptimizerProps {
  farmId: string;
}

const IRRIGATION_TYPES = {
  drip: { name: 'Drip Irrigation', efficiency: 0.95, water_per_liter: 1.0 },
  sprinkler: { name: 'Sprinkler System', efficiency: 0.8, water_per_liter: 1.25 },
  flood: { name: 'Flood Irrigation', efficiency: 0.6, water_per_liter: 2.0 },
  manual: { name: 'Manual Watering', efficiency: 0.7, water_per_liter: 1.5 },
};

const CROP_WATER_REQUIREMENTS = {
  corn: { peak_daily: 6, growth_stages: { seedling: 3, vegetative: 7, reproductive: 8 } },
  wheat: { peak_daily: 5, growth_stages: { seedling: 3, vegetative: 6, reproductive: 5 } },
  soybeans: { peak_daily: 7, growth_stages: { seedling: 4, vegetative: 8, reproductive: 7 } },
  tomato: { peak_daily: 8, growth_stages: { seedling: 4, vegetative: 9, reproductive: 10 } },
  potato: { peak_daily: 6, growth_stages: { seedling: 3, vegetative: 7, reproductive: 6 } },
  lettuce: { peak_daily: 4, growth_stages: { seedling: 3, vegetative: 5, reproductive: 4 } },
  cabbage: { peak_daily: 5, growth_stages: { seedling: 3, vegetative: 6, reproductive: 5 } },
};

export function IrrigationOptimizer({ farmId }: IrrigationOptimizerProps) {
  const { data: currentFarm } = useFarm(farmId);
  const [activeTab, setActiveTab] = useState<'schedules' | 'analytics' | 'optimization'>(
    'schedules'
  );
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Use the main irrigation hook for mutation functions
  const { updateSchedule, optimizeSchedule, isOptimizing } = useIrrigation();

  // Fetch schedules for the farm
  const {
    data: schedules = [],
    isLoading: schedulesLoading,
    error: schedulesError,
  } = useQuery({
    queryKey: ['irrigation-schedules', 'farm', farmId],
    queryFn: async () => {
      const response = await fetch('/api/crops/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', farm_id: farmId }),
      });
      if (!response.ok) throw new Error('Failed to fetch irrigation schedules');
      return await response.json();
    },
    enabled: !!farmId,
  });

  // Fetch analytics for the farm
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ['irrigation-analytics', farmId],
    queryFn: async () => {
      const response = await fetch('/api/crops/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analytics', farm_id: farmId }),
      });
      if (!response.ok) throw new Error('Failed to fetch irrigation analytics');
      return await response.json();
    },
    enabled: !!farmId,
  });

  // Fetch fields for context
  const { data: fields } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/fields?farm_id=${farmId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return await response.json();
    },
    enabled: !!farmId,
  });

  const handleToggleSchedule = (scheduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateSchedule({
      id: scheduleId,
      status: newStatus,
    });
  };

  const handleOptimizeSchedule = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    optimizeSchedule({ schedule_id: scheduleId });
  };

  const getWateringRecommendation = (schedule: any) => {
    const cropReqs =
      CROP_WATER_REQUIREMENTS[schedule.crop_type as keyof typeof CROP_WATER_REQUIREMENTS];
    if (!cropReqs) return { shouldWater: false, reason: 'Unknown crop type' };

    const nextWatering = new Date(schedule.next_watering_date);
    const now = new Date();
    const daysUntilNext = Math.ceil(
      (nextWatering.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Simplified logic - could be enhanced with weather data
    if (daysUntilNext <= 0) {
      return {
        shouldWater: true,
        reason: `Irrigation due ${Math.abs(daysUntilNext)} day(s) ago`,
        priority: 'high',
      };
    } else if (daysUntilNext <= 1) {
      return {
        shouldWater: true,
        reason: 'Irrigation due today',
        priority: 'medium',
      };
    }

    return {
      shouldWater: false,
      reason: `Next irrigation in ${daysUntilNext} day(s)`,
      priority: 'low',
    };
  };

  const calculateWaterEfficiency = (schedule: any) => {
    const irrigationType =
      IRRIGATION_TYPES[schedule.irrigation_type as keyof typeof IRRIGATION_TYPES];
    if (!irrigationType) return 0;

    // Calculate efficiency based on type and crop requirements
    const baseEfficiency = irrigationType.efficiency;
    const cropReq =
      CROP_WATER_REQUIREMENTS[schedule.crop_type as keyof typeof CROP_WATER_REQUIREMENTS];

    if (!cropReq) return baseEfficiency;

    // Adjust based on how well scheduled watering matches crop needs
    const scheduleAlignment = Math.min(1, schedule.frequency_days / cropReq.peak_daily);
    return Math.round(baseEfficiency * (0.8 + scheduleAlignment * 0.2) * 100);
  };

  if (schedulesLoading || analyticsLoading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading irrigation optimizer...
        </div>
      </div>
    );
  }

  if (schedulesError || analyticsError) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading irrigation data: {(schedulesError || analyticsError)?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Irrigation Optimization</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Optimize water usage with weather-aware irrigation scheduling and analytics.
          {currentFarm && ` • ${currentFarm.name}`}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`${TAB_BASE_CLASS} ${
                activeTab === 'schedules' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
              }`}
            >
              <Calendar className="h-4 w-4" />
              Schedules
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`${TAB_BASE_CLASS} ${
                activeTab === 'analytics' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`${TAB_BASE_CLASS} ${
                activeTab === 'optimization' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
              }`}
            >
              <Zap className="h-4 w-4" />
              Optimization
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              {/* Irrigation Schedule Cards */}
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Irrigation Schedules
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create irrigation schedules to optimize water usage and crop health.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>Create Schedule</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {schedules.map((schedule: any) => {
                    const recommendation = getWateringRecommendation(schedule);
                    const efficiency = calculateWaterEfficiency(schedule);
                    const irrigationType =
                      IRRIGATION_TYPES[schedule.irrigation_type as keyof typeof IRRIGATION_TYPES];

                    return (
                      <div key={schedule.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{schedule.field_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{schedule.crop_type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                schedule.status === 'active'
                                  ? 'bg-green-500'
                                  : schedule.status === 'paused'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className="text-sm text-gray-600">{schedule.status}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Next Watering:</span>
                            <p className="font-medium">
                              {new Date(schedule.next_watering_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Frequency:</span>
                            <p className="font-medium">Every {schedule.frequency_days} days</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <p className="font-medium">{schedule.duration_minutes} min</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Water Amount:</span>
                            <p className="font-medium">{schedule.water_amount_liters}L</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{irrigationType?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">
                              {efficiency}% Efficiency
                            </span>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div
                          className={`p-3 rounded text-sm mb-3 ${
                            recommendation.shouldWater
                              ? recommendation.priority === 'high'
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-yellow-50 border border-yellow-200'
                              : 'bg-green-50 border border-green-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {recommendation.shouldWater ? (
                              <AlertTriangle
                                className={`h-4 w-4 ${
                                  recommendation.priority === 'high'
                                    ? 'text-red-500'
                                    : 'text-yellow-500'
                                }`}
                              />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span
                              className={`font-medium ${
                                recommendation.shouldWater
                                  ? recommendation.priority === 'high'
                                    ? 'text-red-700'
                                    : 'text-yellow-700'
                                  : 'text-green-700'
                              }`}
                            >
                              {recommendation.reason}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOptimizeSchedule(schedule.id)}
                            disabled={isOptimizing}
                          >
                            {isOptimizing && selectedSchedule === schedule.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Zap className="h-3 w-3 mr-1" />
                            )}
                            Optimize
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleSchedule(schedule.id, schedule.status)}
                          >
                            {schedule.status === 'active' ? (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Resume
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Total Water Usage</span>
                  </div>
                  <p className="text-2xl font-bold">{analytics.total_water_usage}L</p>
                  <p className="text-sm text-gray-600">This month</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Efficiency Score</span>
                  </div>
                  <p className="text-2xl font-bold">{analytics.efficiency_score}%</p>
                  <p className="text-sm text-gray-600">System average</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Cost Savings</span>
                  </div>
                  <p className="text-2xl font-bold">${analytics.cost_savings}</p>
                  <p className="text-sm text-gray-600">This year</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Active Schedules</span>
                  </div>
                  <p className="text-2xl font-bold">{analytics.next_schedules?.length || 0}</p>
                  <p className="text-sm text-gray-600">Running now</p>
                </div>
              </div>

              {/* Water Usage Trends */}
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Water Usage Trends</h4>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Water usage chart would go here</p>
                  <p className="text-sm">Integration with chart library needed</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              {/* Optimization Controls */}
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Smart Optimization</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-2">Weather Integration</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      Automatically adjust irrigation based on weather forecasts and soil moisture.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Weather API integration coming soon!')}
                    >
                      Connect Weather API
                    </Button>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Soil Sensors</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      Integrate with IoT soil moisture sensors for precise watering.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Sensor configuration coming soon!')}
                    >
                      Configure Sensors
                    </Button>
                  </div>
                </div>
              </div>

              {/* Optimization Recommendations */}
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Recommendations</h4>
                {analytics?.recommendations && analytics.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                        <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">{rec}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>All systems optimized!</p>
                    <p className="text-sm">No optimization recommendations at this time</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Irrigation Schedule</h2>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="field-id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Field *
                    </label>
                    <select
                      id="field-id"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a field</option>
                      {fields?.map((field: any) => (
                        <option key={field.id} value={field.id}>
                          {field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="crop-type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Crop Type *
                    </label>
                    <select
                      id="crop-type"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select crop type</option>
                      {Object.keys(CROP_WATER_REQUIREMENTS).map(crop => (
                        <option key={crop} value={crop}>
                          {crop.charAt(0).toUpperCase() + crop.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="irrigation-type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Irrigation Type *
                    </label>
                    <select
                      id="irrigation-type"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select irrigation type</option>
                      {Object.entries(IRRIGATION_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="frequency"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Frequency (days) *
                    </label>
                    <input
                      id="frequency"
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 3"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="duration"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Duration (minutes) *
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="water-amount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Water Amount (liters) *
                    </label>
                    <input
                      id="water-amount"
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Start Date *
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IrrigationOptimizer;
