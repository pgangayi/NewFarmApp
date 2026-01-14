/**
 * FARMS PAGE
 * ==========
 * Farm management page using the unified API layer.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, TrendingUp, Edit2, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { LoadingErrorContent } from '../components/ui/LoadingStates';
import { useConfirmation, ConfirmDialogs } from '../components/ui/ConfirmationDialog';
import { UnifiedModal } from '../components/ui/UnifiedModal';
import { FirstTimeWizard } from '../components/wizards/FirstTimeSetup';

// Import from unified API layer
import {
  useFarms,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,
  type Farm,
  type ModalField,
} from '../api';

// ============================================================================
// FORM CONFIGURATION
// ============================================================================

const farmFormFields: ModalField[] = [
  {
    name: 'name',
    label: 'Farm Name',
    type: 'text',
    required: true,
    placeholder: 'Enter farm name',
  },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    placeholder: 'Enter farm location',
  },
  {
    name: 'area_hectares',
    label: 'Area (Hectares)',
    type: 'number',
    placeholder: 'Enter area in hectares',
    step: '0.01',
  },
  {
    name: 'timezone',
    label: 'Timezone',
    type: 'select',
    options: [
      { value: 'Africa/Harare', label: 'Africa/Harare (CAT)' },
      { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST)' },
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'America/New_York (EST)' },
      { value: 'Europe/London', label: 'Europe/London (GMT)' },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function FarmsPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // API Hooks
  const { data: farms = [], isLoading, error, refetch } = useFarms();
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();
  const deleteFarm = useDeleteFarm();

  // Local state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'analytics'>('grid');
  const [showWizard, setShowWizard] = useState(false);

  const { confirm, ConfirmationDialog } = useConfirmation();

  // Check for wizard eligibility on load
  useEffect(() => {
    if (!isLoading && farms.length === 0 && isAuthenticated()) {
      setShowWizard(true);
    }
  }, [isLoading, farms.length, isAuthenticated]);

  // ---- Handlers ----

  const handleCreateFarm = async (formData: Record<string, unknown>) => {
    try {
      await createFarm.mutateAsync({
        name: formData.name as string,
        location: formData.location as string | undefined,
        area_hectares: formData.area_hectares ? Number(formData.area_hectares) : undefined,
        timezone: formData.timezone as string | undefined,
        owner_id: user?.id || '',
      });
      setShowCreateForm(false);
    } catch (e) {
      console.error('Failed to create farm:', e);
    }
  };

  const handleUpdateFarm = async (formData: Record<string, unknown>) => {
    if (!editingFarm) return;

    try {
      await updateFarm.mutateAsync({
        id: editingFarm.id,
        data: {
          name: formData.name as string,
          location: formData.location as string | undefined,
          area_hectares: formData.area_hectares ? Number(formData.area_hectares) : undefined,
          timezone: formData.timezone as string | undefined,
        },
      });
      setEditingFarm(null);
    } catch (e) {
      console.error('Failed to update farm:', e);
    }
  };

  const handleDeleteFarm = async (farm: Farm) => {
    const confirmed = await confirm(ConfirmDialogs.delete(farm.name));
    if (confirmed) {
      try {
        await deleteFarm.mutateAsync(farm.id);
      } catch (e) {
        console.error('Failed to delete farm:', e);
      }
    }
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    refetch();
  };

  // ---- Auth Check ----

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view farms.</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // ---- Render ----

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Farm Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor your farm operations</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
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
                  Grid
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

              {/* Add Farm Button */}
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Farm</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {farms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farms.length}</div>
                <p className="text-xs text-muted-foreground">Active farm operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Area</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {farms.reduce((sum, f) => sum + (f.area_hectares || 0), 0).toFixed(1)} ha
                </div>
                <p className="text-xs text-muted-foreground">Combined hectares</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(farms.map(f => f.location).filter(Boolean)).size}
                </div>
                <p className="text-xs text-muted-foreground">Unique locations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Size</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {farms.length > 0
                    ? (
                        farms.reduce((sum, f) => sum + (f.area_hectares || 0), 0) / farms.length
                      ).toFixed(1)
                    : 0}{' '}
                  ha
                </div>
                <p className="text-xs text-muted-foreground">Per farm</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        <LoadingErrorContent
          isLoading={isLoading}
          error={error?.message || null}
          loadingMessage="Loading farms..."
          errorTitle="Error Loading Farms"
          errorMessage={error?.message}
          onRetry={() => refetch()}
        >
          {farms.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No farms yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first farm.</p>
                <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Farm
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map(farm => (
                <Card key={farm.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{farm.name}</CardTitle>
                        {farm.location && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {farm.location}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {farm.area_hectares ? `${farm.area_hectares} ha` : 'No size'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {farm.timezone && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Timezone:</span> {farm.timezone}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Created:{' '}
                        {farm.created_at ? new Date(farm.created_at).toLocaleDateString() : 'N/A'}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/farms/${farm.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingFarm(farm)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFarm(farm)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </LoadingErrorContent>
      </div>
      {/* Create Farm Modal */}
      <UnifiedModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Farm"
        fields={farmFormFields}
        onSubmit={handleCreateFarm}
        submitLabel="Create Farm"
        isLoading={createFarm.isPending}
      />
      {/* Edit Farm Modal */}
      <UnifiedModal
        isOpen={!!editingFarm}
        onClose={() => setEditingFarm(null)}
        title="Edit Farm"
        fields={farmFormFields}
        initialData={editingFarm || undefined}
        onSubmit={handleUpdateFarm}
        submitLabel="Save Changes"
        isLoading={updateFarm.isPending}
      />
      {/* First Time Wizard */}
      <FirstTimeWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />{' '}
      {/* Confirmation Dialog */}
      {ConfirmationDialog}
    </div>
  );
}

export default FarmsPage;
