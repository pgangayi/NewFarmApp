import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarm } from '../hooks/useFarm';
import { useCrops, useCropsStats } from '../hooks/useCrops';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Leaf,
  Sprout,
  Droplets,
  Bug,
  TestTube,
  Calendar,
  MapPin,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  Target,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { CropRotationPlanner } from '../components/CropRotationPlanner';
import { IrrigationOptimizer } from '../components/IrrigationOptimizer';
import { PestDiseaseManager } from '../components/PestDiseaseManager';
import { SoilHealthMonitor } from '../components/SoilHealthMonitor';

export function CropsPage() {
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const { currentFarm } = useFarm();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rotation' | 'irrigation' | 'pests' | 'soil'
  >('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    farm_id: string;
    field_id: string;
    crop_type: string;
    variety: string;
    planting_date: string;
    expected_harvest_date: string;
    status: 'planned' | 'active' | 'harvested' | 'failed';
  }>({
    name: '',
    farm_id: currentFarm?.id || '',
    field_id: '',
    crop_type: '',
    variety: '',
    planting_date: new Date().toISOString().split('T')[0],
    expected_harvest_date: '',
    status: 'planned',
  });

  const { crops, isLoading, error, createCrop, updateCrop, deleteCrop, isCreating } = useCrops();
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
          <p className="text-gray-600 mb-4">
            Please select or create a farm to access crop management features.
          </p>
          <Button onClick={() => (window.location.href = '/farms')}>Go to Farms</Button>
        </div>
      </div>
    );
  }

  // Filter crops for current farm
  const farmCrops = crops.filter(c => c.farm_id === currentFarm.id);
  const filteredCrops = farmCrops.filter(
    crop =>
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.crop_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    createCrop({
      ...formData,
      farm_id: currentFarm.id,
    });
    setFormData({
      name: '',
      farm_id: currentFarm.id,
      field_id: '',
      crop_type: '',
      variety: '',
      planting_date: new Date().toISOString().split('T')[0],
      expected_harvest_date: '',
      status: 'planned',
    });
    setShowCreateForm(false);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: `url('/Crop Wallpaper.jpg')`,
        backgroundBlendMode: 'soft-light',
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[0.5px]"></div>

      {/* Breadcrumbs */}
      <div className="bg-white/90 backdrop-blur-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
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
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('rotation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'rotation'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Sprout className="h-4 w-4" />
              Rotation Planning
            </button>
            <button
              onClick={() => setActiveTab('irrigation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'irrigation'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Droplets className="h-4 w-4" />
              Irrigation
            </button>
            <button
              onClick={() => setActiveTab('pests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'pests'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bug className="h-4 w-4" />
              Pests & Diseases
            </button>
            <button
              onClick={() => setActiveTab('soil')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'soil'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TestTube className="h-4 w-4" />
              Soil Health
            </button>
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

            {/* Crops List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Crops</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {farmCrops.length} {farmCrops.length === 1 ? 'crop' : 'crops'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center justify-center bg-green-600 text-white hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Crop
                  </Button>
                </div>

                {/* Search Bar */}
                {farmCrops.length > 0 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search crops..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading crops...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-6 bg-red-50 border-t border-red-200">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Error loading crops</p>
                      <p className="text-red-700 text-sm mt-1">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {filteredCrops.length > 0 ? (
                <div className="divide-y">
                  {filteredCrops.map(crop => (
                    <div key={crop.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Sprout className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{crop.name}</h4>
                              <p className="text-sm text-gray-600">{crop.crop_type}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                crop.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : crop.status === 'planned'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : crop.status === 'harvested'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {crop.status}
                            </span>
                          </div>
                          <button className="text-gray-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  {searchQuery ? (
                    <>
                      <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No crops found</h4>
                      <p className="text-gray-600">Try adjusting your search terms.</p>
                    </>
                  ) : (
                    <>
                      <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No crops yet</h4>
                      <p className="text-gray-600 mb-4">Start by adding your first crop.</p>
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="inline-flex items-center bg-green-600 text-white hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Crop
                      </Button>
                    </>
                  )}
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

      {/* Create Crop Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Crop</h2>

              <form onSubmit={handleCreateCrop} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crop Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.crop_type}
                      onChange={e => setFormData(prev => ({ ...prev, crop_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                    <input
                      type="text"
                      value={formData.variety}
                      onChange={e => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planting Date
                    </label>
                    <input
                      type="date"
                      value={formData.planting_date}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, planting_date: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Harvest Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_harvest_date}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, expected_harvest_date: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          status: e.target.value as 'planned' | 'active' | 'harvested' | 'failed',
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="harvested">Harvested</option>
                      <option value="failed">Failed</option>
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
                    disabled={isCreating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create Crop'}
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

export default CropsPage;
