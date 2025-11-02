import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { 
  MapPin, 
  Cloud, 
  Calendar, 
  TrendingUp, 
  Bell, 
  BarChart3,
  Settings,
  Plus,
  Sprout,
  Activity,
  Target,
  Leaf,
  Droplets,
  Bug,
  TestTube
} from 'lucide-react';

interface FarmOperation {
  id: string;
  title: string;
  scheduled_date: string;
  type: string;
  status: string;
  description?: string;
}

interface EnhancedFarmDashboardProps {
  farmId?: string;
}

export function EnhancedFarmDashboard({ farmId: propFarmId }: EnhancedFarmDashboardProps) {
  const { getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'crops' | 'weather' | 'calendar' | 'analytics'>('overview');
  const [showWeatherNotifications, setShowWeatherNotifications] = useState(true);

  // Use provided farmId or fallback for demo
  const farmId = propFarmId || 'demo-farm';

  // Fetch farm overview data (simplified)
  const { data: farmData, isLoading } = useQuery({
    queryKey: ['farm-overview', farmId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/farms?id=${farmId}`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const farms = await response.json();
          return farms[0] || { 
            name: 'My Farm', 
            location: 'Demo Location', 
            area_hectares: 100 
          };
        }
      } catch (error) {
        console.log('Using demo data due to API error:', error);
      }
      // Fallback demo data
      return { 
        name: 'My Farm', 
        location: 'Demo Location', 
        area_hectares: 100,
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'UTC'
      };
    },
    enabled: !!getAuthHeaders(),
  });

  // Fetch crops data (simplified)
  const { data: crops = [] } = useQuery({
    queryKey: ['crops', farmId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/crops-main?farm_id=${farmId}`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Using demo crop data due to API error:', error);
      }
      // Demo crop data
      return [
        {
          id: '1',
          name: 'Corn',
          crop_type: 'Maize',
          planting_date: '2024-03-15',
          status: 'active',
          health_status: 'healthy',
          field_id: 'field-1',
          field_name: 'North Field'
        },
        {
          id: '2',
          name: 'Soybeans',
          crop_type: 'Legume',
          planting_date: '2024-04-01',
          status: 'active',
          health_status: 'needs attention',
          field_id: 'field-2',
          field_name: 'South Field'
        }
      ];
    },
    enabled: !!getAuthHeaders(),
  });

  // Fetch farm operations (simplified)
  const { data: operations = [] } = useQuery({
    queryKey: ['farm-operations', farmId],
    queryFn: async () => {
      try {
        const response = await fetch('/api/crops/operations', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'list',
            farm_id: farmId
          })
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Using demo operations data due to API error:', error);
      }
      // Demo operations data
      return [
        {
          id: '1',
          title: 'Irrigation',
          scheduled_date: '2024-10-15',
          type: 'irrigation',
          status: 'scheduled'
        },
        {
          id: '2',
          title: 'Pest Control',
          scheduled_date: '2024-10-20',
          type: 'pest_control',
          status: 'pending'
        }
      ];
    },
    enabled: !!getAuthHeaders(),
  });

  // Calculate crop statistics
  const cropStats = {
    total: crops.length,
    active: crops.filter(c => c.status === 'active').length,
    healthy: crops.filter(c => c.health_status === 'healthy').length,
    needsAttention: crops.filter(c => c.health_status !== 'healthy').length,
    harvested: crops.filter(c => c.status === 'harvested').length
  };

  const handleLocationUpdated = () => {
    // Refetch relevant data after location update
  };

  const handleOperationClick = (operationId: string) => {
    console.log('Operation clicked:', operationId);
  };

  const handleAddCrop = () => {
    // Navigate to crops page or open modal
    window.location.href = '/crops';
  };

  const isWeatherEnabled = farmData?.latitude && farmData?.longitude;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{farmData?.name || 'My Farm'}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {farmData?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {farmData.location}
                  </div>
                )}
                {farmData?.area_hectares && (
                  <div>
                    {farmData.area_hectares} hectares
                  </div>
                )}
                {isWeatherEnabled && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Cloud className="h-4 w-4" />
                    Weather Active
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCrop}>
                <Plus className="h-4 w-4 mr-2" />
                Add Crop
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </div>

        {/* Weather Setup Notice */}
        {!isWeatherEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <h3 className="font-medium text-amber-800">Weather Integration Setup</h3>
            </div>
            <p className="text-amber-700 mt-1">
              Set your farm location to enable weather data, alerts, and agricultural recommendations.
            </p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                  activeTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="h-4 w-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('crops')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                  activeTab === 'crops'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Sprout className="h-4 w-4" />
                Crops ({cropStats.total})
              </button>
              {isWeatherEnabled && (
                <>
                  <button
                    onClick={() => setActiveTab('weather')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                      activeTab === 'weather'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Cloud className="h-4 w-4" />
                    Weather
                  </button>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                      activeTab === 'calendar'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                      activeTab === 'analytics'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Analytics
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Sprout className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Crops</p>
                        <p className="text-2xl font-bold text-gray-900">{cropStats.total}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Crops</p>
                        <p className="text-2xl font-bold text-gray-900">{cropStats.active}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Target className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Healthy Crops</p>
                        <p className="text-2xl font-bold text-gray-900">{cropStats.healthy}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Bell className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Need Attention</p>
                        <p className="text-2xl font-bold text-gray-900">{cropStats.needsAttention}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Crops */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Recent Crops</h3>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('crops')}>
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {crops.length > 0 ? crops.slice(0, 5).map((crop) => (
                      <div key={crop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <Leaf className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium">{crop.name}</p>
                            <p className="text-sm text-gray-600">{crop.crop_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs px-2 py-1 rounded ${
                            crop.health_status === 'healthy' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {crop.health_status}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">No crops yet</p>
                    )}
                  </div>
                </div>

                {/* Recent Operations */}
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Recent Operations</h3>
                  </div>
                  <div className="space-y-3">
                    {operations.length > 0 ? operations.slice(0, 3).map((op) => (
                      <div key={op.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <Activity className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <p className="font-medium">{op.title}</p>
                            <p className="text-sm text-gray-600">{new Date(op.scheduled_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs px-2 py-1 rounded ${
                            op.status === 'scheduled' 
                              ? 'bg-blue-100 text-blue-800' 
                              : op.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {op.status}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">No recent operations</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crops' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Crop Management</h2>
                  <Button onClick={handleAddCrop}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Crop
                  </Button>
                </div>
                
                {/* Crop Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <Sprout className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{cropStats.total}</p>
                    <p className="text-sm text-gray-600">Total Crops</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{cropStats.active}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <Target className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{cropStats.healthy}</p>
                    <p className="text-sm text-gray-600">Healthy</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <Bell className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{cropStats.needsAttention}</p>
                    <p className="text-sm text-gray-600">Attention Needed</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{cropStats.harvested}</p>
                    <p className="text-sm text-gray-600">Harvested</p>
                  </div>
                </div>

                {/* Crops List */}
                <div className="bg-white rounded-lg border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-medium">All Crops</h3>
                  </div>
                  <div className="p-6">
                    {crops.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {crops.map((crop) => (
                          <div key={crop.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Leaf className="h-5 w-5 text-green-600 mr-2" />
                                <h4 className="font-medium">{crop.name}</h4>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${
                                crop.status === 'active' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : crop.status === 'harvested'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {crop.status}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p><span className="font-medium">Type:</span> {crop.crop_type}</p>
                              <p><span className="font-medium">Planted:</span> {new Date(crop.planting_date).toLocaleDateString()}</p>
                              {crop.field_name && (
                                <p><span className="font-medium">Field:</span> {crop.field_name}</p>
                              )}
                              <p><span className="font-medium">Health:</span> 
                                <span className={`ml-1 ${crop.health_status === 'healthy' ? 'text-green-600' : 'text-amber-600'}`}>
                                  {crop.health_status}
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => console.log('View crop details:', crop.id)}>
                                View Details
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => console.log('View crop activity:', crop.id)}>
                                <Activity className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Crops Yet</h3>
                        <p className="text-gray-600 mb-4">Start by adding your first crop to track its growth and health.</p>
                        <Button onClick={handleAddCrop}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Crop
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'weather' && isWeatherEnabled && (
              <div className="text-center py-12">
                <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Weather Integration</h3>
                <p className="text-gray-600">Weather features will be available once location is set.</p>
              </div>
            )}

            {activeTab === 'calendar' && isWeatherEnabled && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Weather Calendar</h3>
                <p className="text-gray-600">Calendar integration will be available once location is set.</p>
              </div>
            )}

            {activeTab === 'analytics' && isWeatherEnabled && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-600">Analytics will be available once location is set.</p>
              </div>
            )}

            {!isWeatherEnabled && activeTab !== 'overview' && activeTab !== 'crops' && (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Weather Integration Required</h3>
                <p className="text-gray-600 mb-4">
                  Set your farm location to access weather data and features.
                </p>
                <Button onClick={() => setActiveTab('overview')}>
                  Setup Location
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={handleAddCrop}>
              <Plus className="h-6 w-6 mb-2" />
              Add Crop
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Droplets className="h-6 w-6 mb-2" />
              Schedule Irrigation
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Bug className="h-6 w-6 mb-2" />
              Pest Report
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TestTube className="h-6 w-6 mb-2" />
              Soil Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedFarmDashboard;