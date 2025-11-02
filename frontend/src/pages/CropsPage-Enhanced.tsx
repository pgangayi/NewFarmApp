import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarm } from '../hooks/useFarm';
import { useCrops, useCropsStats } from '../hooks/useCrops';
import { Button } from '../components/ui/button';
import { 
  Leaf, 
  Sprout,
  Droplets,
  Bug,
  TestTube,
  Calendar,
  AlertTriangle,
  BarChart3,
  Settings,
  Target,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { CropRotationPlanner } from '../components/CropRotationPlanner';
import { IrrigationOptimizer } from '../components/IrrigationOptimizer';
import { PestDiseaseManager } from '../components/PestDiseaseManager';
import { SoilHealthMonitor } from '../components/SoilHealthMonitor';

export function CropsPageEnhanced() {
  const { isAuthenticated } = useAuth();
  const { currentFarm } = useFarm();
  const [activeTab, setActiveTab] = useState<'overview' | 'rotation' | 'irrigation' | 'pests' | 'soil'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const { crops, isLoading, error } = useCrops();
  const stats = useCropsStats();

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access crop management.</p>
        </div>
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Farm Selected</h2>
          <p className="text-gray-600 mb-4">Please select or create a farm to access crop management features.</p>
          <Button onClick={() => window.location.href = '/farms'}>
            Go to Farms
          </Button>
        </div>
      </div>
    );
  }

  const farmCrops = crops.filter((c) => c.farm_id === currentFarm.id);
  const filteredCrops = farmCrops.filter((crop) =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crop.crop_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Crop Management</h1>
                <p className="text-sm text-gray-600">
                  {currentFarm.name} • {currentFarm.location || 'Location not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {(['overview', 'rotation', 'irrigation', 'pests', 'soil'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && <Target className="h-4 w-4" />}
                {tab === 'rotation' && <Sprout className="h-4 w-4" />}
                {tab === 'irrigation' && <Droplets className="h-4 w-4" />}
                {tab === 'pests' && <Bug className="h-4 w-4" />}
                {tab === 'soil' && <TestTube className="h-4 w-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Sprout className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Crops</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Sprout className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Planned</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.planned}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Harvested</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.harvested}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.failed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Crops List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Crops</h3>
                    <p className="text-sm text-gray-600">{farmCrops.length} crops</p>
                  </div>
                </div>

                {farmCrops.length > 0 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search crops..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600"></div>
                </div>
              )}

              {error && (
                <div className="p-6 bg-red-50">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-red-800 font-medium">Error loading crops</p>
                      <p className="text-red-700 text-sm">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && filteredCrops.length > 0 && (
                <div className="divide-y">
                  {filteredCrops.map((crop) => (
                    <div key={crop.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{crop.name}</h4>
                            <p className="text-sm text-gray-600">{crop.crop_type}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          crop.status === 'active' ? 'bg-green-100 text-green-800' :
                          crop.status === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                          crop.status === 'harvested' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {crop.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && filteredCrops.length === 0 && !error && (
                <div className="p-12 text-center">
                  <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900">No crops found</h4>
                  <p className="text-gray-600">{searchQuery ? 'Try adjusting your search.' : 'Start by adding your first crop.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rotation' && <CropRotationPlanner farmId={currentFarm.id} />}
        {activeTab === 'irrigation' && <IrrigationOptimizer farmId={currentFarm.id} />}
        {activeTab === 'pests' && <PestDiseaseManager farmId={currentFarm.id} />}
        {activeTab === 'soil' && <SoilHealthMonitor farmId={currentFarm.id} />}
      </div>
    </div>
  );
}

export default CropsPageEnhanced;
