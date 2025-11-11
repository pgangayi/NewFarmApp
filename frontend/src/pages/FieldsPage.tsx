import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Plus, MapPin, Activity, Settings, Droplets, TrendingUp, Wrench, Leaf } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Field {
  id: number;
  farm_id: number;
  name: string;
  area_hectares?: number;
  crop_type?: string;
  notes?: string;
  soil_type?: string;
  field_capacity?: number;
  current_cover_crop?: string;
  irrigation_system?: string;
  drainage_quality?: string;
  accessibility_score?: number;
  environmental_factors?: string;
  maintenance_schedule?: string;
  farm_name?: string;
  crop_count?: number;
  avg_profitability?: number;
  best_yield_per_hectare?: number;
  avg_ph_level?: number;
  pending_tasks?: number;
  created_at: string;
  updated_at?: string;
}

interface FieldFormData {
  farm_id: number;
  name: string;
  area_hectares?: number;
  crop_type?: string;
  notes?: string;
  soil_type?: string;
  field_capacity?: number;
  current_cover_crop?: string;
  irrigation_system?: string;
  drainage_quality?: string;
  accessibility_score?: number;
  environmental_factors?: string;
  maintenance_schedule?: string;
}

interface SoilAnalysisData {
  field_id: number;
  analysis_date: string;
  ph_level?: number;
  nitrogen_content?: number;
  phosphorus_content?: number;
  potassium_content?: number;
  organic_matter?: number;
  soil_moisture?: number;
  temperature?: number;
  salinity?: number;
  recommendations?: string;
}

export function FieldsPage() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'analytics' | 'soil'>('grid');
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);

  // Get farms for dropdown
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await fetch('/api/farms', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch farms');
      return response.json();
    },
    enabled: isAuthenticated(),
  });

  // Get enhanced fields with analytics
  const {
    data: fields,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fields', 'enhanced'],
    queryFn: async () => {
      const response = await fetch('/api/fields?analytics=true', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fields: ${response.statusText}`);
      }

      return response.json() as Promise<Field[]>;
    },
    enabled: isAuthenticated(),
  });

  // Get soil analysis data for selected field
  const { data: soilAnalysis } = useQuery({
    queryKey: ['soil-analysis', selectedFieldId],
    queryFn: async () => {
      if (!selectedFieldId) return [];

      const response = await fetch(`/api/fields/soil-analysis?field_id=${selectedFieldId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) return [];
      return response.json() as Promise<SoilAnalysisData[]>;
    },
    enabled: isAuthenticated() && selectedFieldId !== null && viewMode === 'soil',
  });

  const createFieldMutation = useMutation({
    mutationFn: async (fieldData: FieldFormData) => {
      const response = await fetch('/api/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(fieldData),
      });

      if (!response.ok) {
        throw new Error('Failed to create field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      setShowCreateForm(false);
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, ...fieldData }: FieldFormData & { id: number }) => {
      const response = await fetch('/api/fields', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id, ...fieldData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      setEditingField(null);
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const response = await fetch(`/api/fields?id=${fieldId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete field');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });

  const handleCreateField = (fieldData: FieldFormData) => {
    createFieldMutation.mutate(fieldData);
  };

  const handleUpdateField = (fieldData: FieldFormData) => {
    if (editingField) {
      updateFieldMutation.mutate({ id: editingField.id, ...fieldData });
    }
  };

  const handleDeleteField = (fieldId: number) => {
    if (confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      deleteFieldMutation.mutate(fieldId);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view fields.</p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading fields...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading fields</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );

  const totalFields = fields?.length || 0;
  const totalHectares = fields?.reduce((sum, field) => sum + (field.area_hectares || 0), 0) || 0;
  const totalCrops = fields?.reduce((sum, field) => sum + (field.crop_count || 0), 0) || 0;
  const avgProfitability =
    fields && fields.length > 0
      ? fields.reduce((sum, field) => sum + (field.avg_profitability || 0), 0) / fields.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Field Management</h1>
            <p className="text-gray-600 mt-1">Monitor and optimize your field operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  viewMode === 'grid'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  viewMode === 'analytics'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Analytics
              </button>
              <button
                type="button"
                onClick={() => setViewMode('soil')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                  viewMode === 'soil'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Soil Health
              </button>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Field
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {fields && fields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFields}</div>
                <p className="text-xs text-muted-foreground">Active field operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hectares</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHectares.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Under cultivation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Crops</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCrops}</div>
                <p className="text-xs text-muted-foreground">Across all fields</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Profitability</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgProfitability.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Field performance score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'grid' ? (
          /* Grid View */
          fields && fields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fields.map(field => (
                <Card key={field.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{field.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {field.farm_name}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingField(field)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Field Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {field.area_hectares && (
                        <div>
                          <span className="font-medium">Area:</span> {field.area_hectares} ha
                        </div>
                      )}
                      {field.soil_type && (
                        <div>
                          <span className="font-medium">Soil:</span> {field.soil_type}
                        </div>
                      )}
                      {field.crop_type && (
                        <div>
                          <span className="font-medium">Crop:</span> {field.crop_type}
                        </div>
                      )}
                      {field.irrigation_system && (
                        <div>
                          <span className="font-medium">Irrigation:</span> {field.irrigation_system}
                        </div>
                      )}
                      {field.accessibility_score && (
                        <div>
                          <span className="font-medium">Access:</span> {field.accessibility_score}
                          /10
                        </div>
                      )}
                      {field.drainage_quality && (
                        <div>
                          <span className="font-medium">Drainage:</span> {field.drainage_quality}
                        </div>
                      )}
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Crops</span>
                        <Badge variant="secondary">{field.crop_count || 0}</Badge>
                      </div>
                      {field.avg_profitability && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Profitability</span>
                          <Badge variant={field.avg_profitability > 70 ? 'default' : 'secondary'}>
                            {field.avg_profitability.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                      {field.avg_ph_level && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">pH Level</span>
                          <Badge
                            variant={
                              field.avg_ph_level >= 6.0 && field.avg_ph_level <= 7.5
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {field.avg_ph_level.toFixed(1)}
                          </Badge>
                        </div>
                      )}
                      {field.best_yield_per_hectare && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Best Yield</span>
                          <Badge variant="secondary">
                            {field.best_yield_per_hectare.toFixed(1)} t/ha
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedFieldId(field.id);
                          setViewMode('soil');
                        }}
                      >
                        <Droplets className="h-4 w-4 mr-1" />
                        Soil Health
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (confirm(`Delete field "${field.name}"?`)) {
                            handleDeleteField(field.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>

                    {/* Created Date */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Created: {new Date(field.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow p-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No fields yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first field.</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Field
                </Button>
              </div>
            </div>
          )
        ) : viewMode === 'analytics' ? (
          /* Analytics View */
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Field Performance Analytics</CardTitle>
                <CardDescription>
                  Comprehensive analysis of your field operations and productivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Advanced field analytics dashboard coming soon...</p>
                  <p className="text-sm">
                    This will include soil health trends, productivity analysis, and optimization
                    recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Soil Health View */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Soil Health Analysis</CardTitle>
                <CardDescription>
                  Monitor soil conditions and track improvements over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFieldId && soilAnalysis && soilAnalysis.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {soilAnalysis.slice(0, 6).map((analysis, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">
                            {new Date(analysis.analysis_date).toLocaleDateString()}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>pH Level:</span>
                              <span
                                className={
                                  analysis.ph_level &&
                                  analysis.ph_level >= 6.0 &&
                                  analysis.ph_level <= 7.5
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {analysis.ph_level?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Nitrogen:</span>
                              <span>{analysis.nitrogen_content?.toFixed(1) || 'N/A'} ppm</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Phosphorus:</span>
                              <span>{analysis.phosphorus_content?.toFixed(1) || 'N/A'} ppm</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Potassium:</span>
                              <span>{analysis.potassium_content?.toFixed(1) || 'N/A'} ppm</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Soil Moisture:</span>
                              <span>{analysis.soil_moisture?.toFixed(1) || 'N/A'}%</span>
                            </div>
                          </div>
                          {analysis.recommendations && (
                            <div className="mt-2 text-xs text-gray-600">
                              <strong>Recommendations:</strong> {analysis.recommendations}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Droplets className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a field to view soil analysis data</p>
                    <p className="text-sm">
                      No soil analysis data available for the selected field.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Field Modal */}
        {(showCreateForm || editingField) && (
          <FieldFormModal
            field={editingField}
            farms={farms || []}
            onSubmit={editingField ? handleUpdateField : handleCreateField}
            onClose={() => {
              setShowCreateForm(false);
              setEditingField(null);
            }}
            isLoading={createFieldMutation.isPending || updateFieldMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// Field Form Modal Component
interface FieldFormModalProps {
  field?: Field | null;
  farms: unknown[];
  onSubmit: (data: FieldFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

function FieldFormModal({ field, farms, onSubmit, onClose, isLoading }: FieldFormModalProps) {
  const [formData, setFormData] = useState<FieldFormData>({
    farm_id: field?.farm_id || (farms.length > 0 ? farms[0].id : 0),
    name: field?.name || '',
    area_hectares: field?.area_hectares,
    crop_type: field?.crop_type || '',
    notes: field?.notes || '',
    soil_type: field?.soil_type || '',
    field_capacity: field?.field_capacity,
    current_cover_crop: field?.current_cover_crop || '',
    irrigation_system: field?.irrigation_system || '',
    drainage_quality: field?.drainage_quality || '',
    accessibility_score: field?.accessibility_score,
    environmental_factors: field?.environmental_factors || '',
    maintenance_schedule: field?.maintenance_schedule || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{field ? 'Edit Field' : 'Create New Field'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                  <select
                    required
                    value={formData.farm_id}
                    onChange={e => setFormData({ ...formData, farm_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select farm</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    onChange={e =>
                      setFormData({
                        ...formData,
                        area_hectares: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Crop Type
                  </label>
                  <input
                    type="text"
                    value={formData.crop_type || ''}
                    onChange={e => setFormData({ ...formData, crop_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Corn, Wheat, Soybeans"
                  />
                </div>
              </div>
            </div>

            {/* Soil and Infrastructure */}
            <div>
              <h3 className="text-lg font-medium mb-4">Soil & Infrastructure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                  <select
                    value={formData.soil_type || ''}
                    onChange={e => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select soil type</option>
                    <option value="clay">Clay</option>
                    <option value="loam">Loam</option>
                    <option value="sand">Sand</option>
                    <option value="silt">Silt</option>
                    <option value="chalky">Chalky</option>
                    <option value="peat">Peat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Irrigation System
                  </label>
                  <select
                    value={formData.irrigation_system || ''}
                    onChange={e => setFormData({ ...formData, irrigation_system: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select irrigation</option>
                    <option value="drip">Drip Irrigation</option>
                    <option value="sprinkler">Sprinkler System</option>
                    <option value="flood">Flood Irrigation</option>
                    <option value="pivot">Pivot System</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drainage Quality
                  </label>
                  <select
                    value={formData.drainage_quality || ''}
                    onChange={e => setFormData({ ...formData, drainage_quality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select drainage</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="very_poor">Very Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accessibility Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.accessibility_score || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        accessibility_score: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Management */}
            <div>
              <h3 className="text-lg font-medium mb-4">Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Cover Crop
                  </label>
                  <input
                    type="text"
                    value={formData.current_cover_crop || ''}
                    onChange={e => setFormData({ ...formData, current_cover_crop: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Rye, Clover, Oats"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Capacity (ha/unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.field_capacity || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        field_capacity: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environmental Factors
                </label>
                <textarea
                  value={formData.environmental_factors || ''}
                  onChange={e =>
                    setFormData({ ...formData, environmental_factors: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Environmental considerations, wind exposure, slope, etc."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Schedule
                </label>
                <textarea
                  value={formData.maintenance_schedule || ''}
                  onChange={e => setFormData({ ...formData, maintenance_schedule: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Regular maintenance tasks and schedules..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Additional notes about the field..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Saving...' : field ? 'Update Field' : 'Create Field'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FieldsPage;
