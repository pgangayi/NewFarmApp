import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Plus, TrendingUp, Users, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

interface Farm {
  id: number;
  name: string;
  location: string;
  area_hectares?: number;
  farm_type?: string;
  certification_status?: string;
  environmental_compliance?: string;
  total_acres?: number;
  operational_start_date?: string;
  management_structure?: string;
  seasonal_staff?: number;
  annual_budget?: number;
  animal_count?: number;
  field_count?: number;
  pending_tasks?: number;
  total_revenue?: number;
  total_expenses?: number;
  latest_productivity_score?: number;
  created_at: string;
  updated_at?: string;
}

interface FarmFormData {
  name: string;
  location: string;
  area_hectares?: number;
  farm_type?: string;
  certification_status?: string;
  environmental_compliance?: string;
  total_acres?: number;
  operational_start_date?: string;
  management_structure?: string;
  seasonal_staff?: number;
  annual_budget?: number;
}

export function FarmsPage() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'analytics'>('grid');

  const { data: farms, isLoading, error } = useQuery({
    queryKey: ['farms', 'enhanced'],
    queryFn: async () => {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/farms?analytics=true', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch farms: ${response.statusText}`);
      }

      return response.json() as Promise<Farm[]>;
    },
    enabled: isAuthenticated()
  });

  const createFarmMutation = useMutation({
    mutationFn: async (farmData: FarmFormData) => {
      const response = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(farmData)
      });

      if (!response.ok) {
        throw new Error('Failed to create farm');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      setShowCreateForm(false);
      // Redirect to dashboard after successful farm creation
      navigate('/dashboard');
    }
  });

  const updateFarmMutation = useMutation({
    mutationFn: async ({ id, ...farmData }: FarmFormData & { id: number }) => {
      const response = await fetch('/api/farms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id, ...farmData })
      });

      if (!response.ok) {
        throw new Error('Failed to update farm');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      setEditingFarm(null);
    }
  });

  const deleteFarmMutation = useMutation({
    mutationFn: async (farmId: number) => {
      const response = await fetch(`/api/farms?id=${farmId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete farm');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
    }
  });

  const handleCreateFarm = (farmData: FarmFormData) => {
    createFarmMutation.mutate(farmData);
  };

  const handleUpdateFarm = (farmData: FarmFormData) => {
    if (editingFarm) {
      updateFarmMutation.mutate({ id: editingFarm.id, ...farmData });
    }
  };

  const handleDeleteFarm = (farmId: number) => {
    if (confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
      deleteFarmMutation.mutate(farmId);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view farms.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>Loading farms...</p>
    </div>
  </div>;

  if (error) return <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading farms</h2>
      <p className="text-gray-600">{error.message}</p>
    </div>
  </div>;

  const totalAnimals = farms?.reduce((sum, farm) => sum + (farm.animal_count || 0), 0) || 0;
  const totalFields = farms?.reduce((sum, farm) => sum + (farm.field_count || 0), 0) || 0;
  const totalRevenue = farms?.reduce((sum, farm) => sum + (farm.total_revenue || 0), 0) || 0;
  const totalExpenses = farms?.reduce((sum, farm) => sum + (farm.total_expenses || 0), 0) || 0;
  const avgProductivity = farms && farms.length > 0
    ? farms.reduce((sum, farm) => sum + (farm.latest_productivity_score || 0), 0) / farms.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your farm operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                  viewMode === 'analytics'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Analytics
              </button>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Farm
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {farms && farms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farms.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active farm operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnimals}</div>
                <p className="text-xs text-muted-foreground">
                  Across all farms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(totalRevenue - totalExpenses).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue - Expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgProductivity.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Productivity score
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'grid' ? (
          /* Grid View */
          farms && farms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map((farm) => (
                <Card key={farm.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{farm.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {farm.location}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFarm(farm)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Farm Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {farm.farm_type && (
                        <div>
                          <span className="font-medium">Type:</span> {farm.farm_type}
                        </div>
                      )}
                      {farm.area_hectares && (
                        <div>
                          <span className="font-medium">Area:</span> {farm.area_hectares} ha
                        </div>
                      )}
                      {farm.certification_status && (
                        <div>
                          <span className="font-medium">Cert:</span> {farm.certification_status}
                        </div>
                      )}
                      {farm.seasonal_staff && (
                        <div>
                          <span className="font-medium">Staff:</span> {farm.seasonal_staff}
                        </div>
                      )}
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Animals</span>
                        <Badge variant="secondary">{farm.animal_count || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fields</span>
                        <Badge variant="secondary">{farm.field_count || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Tasks</span>
                        <Badge variant={farm.pending_tasks && farm.pending_tasks > 0 ? "destructive" : "secondary"}>
                          {farm.pending_tasks || 0}
                        </Badge>
                      </div>
                      {farm.latest_productivity_score && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Productivity</span>
                          <Badge variant={farm.latest_productivity_score > 70 ? "default" : "secondary"}>
                            {farm.latest_productivity_score.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Financial Overview */}
                    {(farm.total_revenue || 0) > 0 && (
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Revenue:</span>
                            <div className="font-medium text-green-600">
                              ${(farm.total_revenue || 0).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Expenses:</span>
                            <div className="font-medium text-red-600">
                              ${(farm.total_expenses || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate('/dashboard')}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingFarm(farm)}
                      >
                        Manage Farm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (confirm(`Delete farm "${farm.name}"?`)) {
                            handleDeleteFarm(farm.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>

                    {/* Created Date */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Created: {new Date(farm.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow p-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No farms yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first farm.</p>
                <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  Create Farm
                </Button>
              </div>
            </div>
          )
        ) : (
          /* Analytics View */
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Farm Performance Analytics</CardTitle>
                <CardDescription>
                  Comprehensive analysis of your farm operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics dashboard coming soon...</p>
                  <p className="text-sm">This will include detailed performance metrics, trend analysis, and optimization recommendations.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Farm Modal */}
        {(showCreateForm || editingFarm) && (
          <FarmFormModal
            farm={editingFarm}
            onSubmit={editingFarm ? handleUpdateFarm : handleCreateFarm}
            onClose={() => {
              setShowCreateForm(false);
              setEditingFarm(null);
            }}
            isLoading={createFarmMutation.isPending || updateFarmMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// Farm Form Modal Component
interface FarmFormModalProps {
  farm?: Farm | null;
  onSubmit: (data: FarmFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

function FarmFormModal({ farm, onSubmit, onClose, isLoading }: FarmFormModalProps) {
  const [formData, setFormData] = useState<FarmFormData>({
    name: farm?.name || '',
    location: farm?.location || '',
    area_hectares: farm?.area_hectares,
    farm_type: farm?.farm_type || '',
    certification_status: farm?.certification_status || '',
    environmental_compliance: farm?.environmental_compliance || '',
    total_acres: farm?.total_acres,
    operational_start_date: farm?.operational_start_date || '',
    management_structure: farm?.management_structure || '',
    seasonal_staff: farm?.seasonal_staff,
    annual_budget: farm?.annual_budget
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {farm ? 'Edit Farm' : 'Create New Farm'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (Hectares)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.area_hectares || ''}
                  onChange={(e) => setFormData({ ...formData, area_hectares: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Type
                </label>
                <select
                  value={formData.farm_type || ''}
                  onChange={(e) => setFormData({ ...formData, farm_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="livestock">Livestock</option>
                  <option value="crop">Crop</option>
                  <option value="mixed">Mixed Farming</option>
                  <option value="organic">Organic</option>
                  <option value="dairy">Dairy</option>
                  <option value="poultry">Poultry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Status
                </label>
                <select
                  value={formData.certification_status || ''}
                  onChange={(e) => setFormData({ ...formData, certification_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="certified_organic">Certified Organic</option>
                  <option value="in_transition">In Transition</option>
                  <option value="conventional">Conventional</option>
                  <option value="gap_certified">GAP Certified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seasonal Staff
                </label>
                <input
                  type="number"
                  value={formData.seasonal_staff || ''}
                  onChange={(e) => setFormData({ ...formData, seasonal_staff: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operational Start Date
                </label>
                <input
                  type="date"
                  value={formData.operational_start_date || ''}
                  onChange={(e) => setFormData({ ...formData, operational_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Budget ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.annual_budget || ''}
                  onChange={(e) => setFormData({ ...formData, annual_budget: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Management Structure
              </label>
              <textarea
                value={formData.management_structure || ''}
                onChange={(e) => setFormData({ ...formData, management_structure: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your farm management structure..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environmental Compliance
              </label>
              <textarea
                value={formData.environmental_compliance || ''}
                onChange={(e) => setFormData({ ...formData, environmental_compliance: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Environmental compliance notes..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Saving...' : (farm ? 'Update Farm' : 'Create Farm')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FarmsPage;