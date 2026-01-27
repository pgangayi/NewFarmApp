/**
 * FIELDS PAGE
 * ===========
 * Centralized Field Management Page
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { apiClient } from '../hooks';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Plus, MapPin, TrendingUp, Droplets } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { apiEndpoints } from '../config/env';
import type { Field, Farm, ApiResponse } from '../api/types';
import { FieldFormDataInternal, SoilAnalysisData } from '../types/ui';
import { FieldMap } from '../components/fields/FieldMap';
import { UnifiedModal, ModalField } from '../components/ui/UnifiedModal';
import { useConfirmation, ConfirmDialogs } from '../components/ui/ConfirmationDialog';
import { LoadingErrorContent } from '../components/ui/LoadingStates';

const ACTIVE_VIEW_CLASS = 'bg-green-600 text-white';
const INACTIVE_VIEW_CLASS = 'bg-white text-gray-700';

// --- Helpers ---

function getFirstFarm(farms: Farm[] | undefined): Farm | null {
  if (!farms || farms.length === 0) return null;
  return farms[0] || null;
}

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in (payload as Record<string, unknown>)
  );
}

function unwrapResponse<T>(payload: ApiResponse<T> | T): T {
  return isApiResponse<T>(payload) ? (payload.data as T) : (payload as T);
}

// --- Page Component ---

export function FieldsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { confirm, ConfirmationDialog } = useConfirmation();

  // State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'analytics' | 'soil' | 'map'>('grid');
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Queries
  const { data: farms, isLoading: farmsLoading } = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Farm[]>>(apiEndpoints.farms.list);
      return unwrapResponse(response.data) || [];
    },
    enabled: isAuthenticated(),
  });

  const {
    data: fields,
    isLoading: fieldsLoading,
    error: fieldsError,
  } = useQuery<Field[]>({
    queryKey: ['fields', selectedFarmId, 'enhanced'],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      const response = await apiClient.get<ApiResponse<Field[]>>(apiEndpoints.fields.list, {
        params: { analytics: true, farm_id: selectedFarmId },
      });
      return unwrapResponse(response) || [];
    },
    enabled: isAuthenticated() && !!selectedFarmId,
  });

  const { data: soilAnalysis } = useQuery<SoilAnalysisData[]>({
    queryKey: ['soil-analysis', selectedFieldId],
    queryFn: async () => {
      if (!selectedFieldId) return [];
      const response = await apiClient.get<ApiResponse<SoilAnalysisData[]>>(
        apiEndpoints.fields.soilAnalysis,
        { params: { field_id: selectedFieldId } }
      );
      return unwrapResponse(response) || [];
    },
    enabled: isAuthenticated() && selectedFieldId !== null && viewMode === 'soil',
  });

  // Effects
  useEffect(() => {
    const firstFarm = getFirstFarm(farms);
    if (firstFarm && !selectedFarmId) {
      setSelectedFarmId(firstFarm.id.toString());
    }
  }, [farms, selectedFarmId]);

  // Mutations
  const createFieldMutation = useMutation({
    mutationFn: (data: FieldFormDataInternal) =>
      apiClient.post<ApiResponse<Field>>(
        apiEndpoints.fields.create,
        data as unknown as Record<string, unknown>
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      setShowCreateForm(false);
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ id, ...data }: FieldFormDataInternal & { id: number }) =>
      apiClient.put<ApiResponse<Field>>(apiEndpoints.fields.update(id.toString()), { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      setEditingField(null);
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: number) =>
      apiClient.delete(apiEndpoints.fields.delete(fieldId.toString())),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fields'] }),
  });

  // Handlers
  const handleCreateField = (data: any) => createFieldMutation.mutate(data);
  const handleUpdateField = (data: any) => {
    if (editingField) {
      updateFieldMutation.mutate({ id: parseInt(editingField.id), ...data });
    }
  };

  const handleDeleteField = async (field: Field) => {
    const confirmed = await confirm(ConfirmDialogs.delete(field.name));
    if (confirmed) {
      deleteFieldMutation.mutate(parseInt(field.id));
    }
  };

  if (!isAuthenticated()) {
    return <div className="flex items-center justify-center min-h-screen">Use login required</div>;
  }

  const isLoading = farmsLoading || fieldsLoading;

  // Prepare Modal Fields
  const fieldFormFields: ModalField[] = [
    {
      name: 'farm_id',
      label: 'Farm',
      type: 'select',
      required: true,
      options: farms?.map(f => ({ value: f.id.toString(), label: f.name })),
    },
    { name: 'name', label: 'Field Name', type: 'text', required: true },
    { name: 'area_hectares', label: 'Area (ha)', type: 'number', step: '0.01' },
    { name: 'soil_type', label: 'Soil Type', type: 'text' },
    { name: 'crop_type', label: 'Current Crop', type: 'text' },
    { name: 'irrigation_system', label: 'Irrigation System', type: 'text' },
    { name: 'drainage_quality', label: 'Drainage Quality', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Field Management</h1>
            <p className="text-gray-600 mt-1">Monitor and optimize your field operations</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {farms && (
              <select
                aria-label="Select Farm"
                value={selectedFarmId}
                onChange={e => setSelectedFarmId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Farm</option>
                {farms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${viewMode === 'grid' ? ACTIVE_VIEW_CLASS : INACTIVE_VIEW_CLASS}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${viewMode === 'map' ? ACTIVE_VIEW_CLASS : INACTIVE_VIEW_CLASS}`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${viewMode === 'analytics' ? ACTIVE_VIEW_CLASS : INACTIVE_VIEW_CLASS}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setViewMode('soil')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${viewMode === 'soil' ? ACTIVE_VIEW_CLASS : INACTIVE_VIEW_CLASS}`}
              >
                Soil
              </button>
            </div>

            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Field
            </Button>
          </div>
        </div>

        {/* Content */}
        <LoadingErrorContent
          isLoading={isLoading}
          error={fieldsError}
          loadingMessage="Loading fields..."
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['fields'] })}
          empty={!isLoading && !fieldsError && (!fields || fields.length === 0)}
          emptyTitle="No fields found"
          emptyDescription="Get started by creating your first field for this farm."
          emptyAction={
            <Button onClick={() => setShowCreateForm(true)} variant="outline">
              Create Field
            </Button>
          }
          emptyIcon={<MapPin className="h-12 w-12 text-gray-300" />}
        >
          {/* Grid View */}
          {viewMode === 'grid' && fields && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fields.map(field => (
                <Card key={field.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{field.name}</CardTitle>
                        <CardDescription>{field.farm_name}</CardDescription>
                      </div>
                      <Badge variant="outline">{field.area_hectares} ha</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Crop:</span> {field.crop_type || 'None'}
                        </div>
                        <div>
                          <span className="font-medium">Soil:</span> {field.soil_type || 'Unknown'}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingField(field)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteField(field)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && fields && (
            <FieldMap
              fields={fields}
              selectedFieldId={selectedFieldId?.toString() || null}
              onSelectField={f => setSelectedFieldId(parseInt(f.id))}
            />
          )}

          {/* Analytics View */}
          {viewMode === 'analytics' && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Advanced Analytics Module Coming Soon</p>
            </div>
          )}

          {/* Soil View */}
          {viewMode === 'soil' && (
            <div className="space-y-4">
              {!selectedFieldId ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                  <Droplets className="h-12 w-12 mx-auto text-blue-300 mb-2" />
                  <p className="text-gray-500">
                    Select a field from the map or grid to view soil analysis
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {soilAnalysis?.map((analysis, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Analysis: {new Date(analysis.analysis_date).toLocaleDateString()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>pH:</span> <span>{analysis.ph_level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nitrogen:</span> <span>{analysis.nitrogen_content} ppm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Moisture:</span> <span>{analysis.soil_moisture}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!soilAnalysis || soilAnalysis.length === 0) && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No soil data available
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </LoadingErrorContent>

        {/* Unified Modals */}
        <UnifiedModal
          isOpen={showCreateForm || !!editingField}
          onClose={() => {
            setShowCreateForm(false);
            setEditingField(null);
          }}
          title={editingField ? 'Edit Field' : 'Register New Field'}
          fields={fieldFormFields}
          initialData={
            editingField
              ? {
                  ...editingField,
                  farm_id: editingField.farm_id, // Ensure ID mismatch is handled if necessary
                }
              : { farm_id: selectedFarmId }
          }
          onSubmit={editingField ? handleUpdateField : handleCreateField}
          isLoading={createFieldMutation.isPending || updateFieldMutation.isPending}
        />

        {ConfirmationDialog}
      </div>
    </div>
  );
}

export default FieldsPage;
