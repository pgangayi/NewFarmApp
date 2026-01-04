import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { Plus, Search, Edit, Trash2, MapPin, Home, TreePine, Warehouse, Fence } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { LoadingErrorContent } from '../components/ui/LoadingStates';
import { useConfirmation, ConfirmDialogs } from '../components/ui/ConfirmationDialog';
import { UnifiedModal } from '../components/ui/UnifiedModal';
import { ModalField } from '../components/ui/UnifiedModal';

// Import from unified API layer
import {
  useLocations,
  useFarmWithSelection,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../api';
import type { Location, CreateRequest, UpdateRequest } from '../api';

// Map location types to icons
const locationTypeIcons: Record<string, any> = {
  field: MapPin,
  structure: Home,
  building: Home,
  greenhouse: TreePine,
  barn: Warehouse,
  corral: Fence,
  paddock: Fence,
  storage: Warehouse,
  other: MapPin,
};

const locationTypeLabels: Record<string, string> = {
  field: 'Field',
  structure: 'Structure',
  building: 'Building',
  greenhouse: 'Greenhouse',
  barn: 'Barn',
  corral: 'Corral',
  paddock: 'Paddock',
  storage: 'Storage',
  other: 'Other',
};

// Location form fields definition for UnifiedModal
const locationFormFields: ModalField[] = [
  {
    name: 'name',
    label: 'Location Name',
    type: 'text',
    required: true,
    placeholder: 'Enter location name',
  },
  {
    name: 'type',
    label: 'Location Type',
    type: 'select',
    required: true,
    options: Object.entries(locationTypeLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Enter description (optional)',
    rows: 3,
  },
  {
    name: 'capacity',
    label: 'Capacity (animals)',
    type: 'number',
    min: '0',
    placeholder: 'Enter capacity (optional)',
  },
];

export function LocationsPage() {
  const { isAuthenticated } = useAuth();
  const { currentFarm } = useFarmWithSelection();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const { confirm, ConfirmationDialog } = useConfirmation();

  // Use new API hooks
  const { data: locations = [], isLoading, error, refetch } = useLocations(currentFarm?.id);
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access location management.</p>
        </div>
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Farm Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select or create a farm to access location management features.
          </p>
          <Button onClick={() => (window.location.href = '/farms')}>Go to Farms</Button>
        </div>
      </div>
    );
  }

  const filteredLocations = locations.filter(
    (location: Location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (location: Location) => {
    const confirmed = await confirm(ConfirmDialogs.delete(location.name));
    if (confirmed && location.id) {
      deleteMutation.mutate(location.id);
    }
  };

  const handleCreate = (data: Record<string, any>) => {
    // Transform simple form data to typed request
    const request: CreateRequest<Location> = {
      name: data.name,
      type: data.type,
      description: data.description,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      farm_id: currentFarm.id,
    };
    createMutation.mutate(request, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleUpdate = (data: Record<string, any>) => {
    if (!editingLocation || !editingLocation.id) return;

    // Transform simple form data to typed request
    const request: UpdateRequest<Location> = {
      name: data.name,
      type: data.type,
      description: data.description,
      capacity: data.capacity ? Number(data.capacity) : undefined,
    };

    updateMutation.mutate(
      { id: editingLocation.id, data: request },
      {
        onSuccess: () => setEditingLocation(null),
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur-[0.5px]"></div>

      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <MapPin className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentFarm.name} • Manage barns, pastures, and other farm locations
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search locations by name or type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Barns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {locations.filter((l: Location) => l.type === 'barn').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TreePine className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pastures</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    locations.filter(
                      (l: Location) =>
                        l.type === 'paddock' || l.type === 'field' || l.type === 'corral'
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Structures</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    locations.filter(
                      (l: Location) =>
                        l.type === 'structure' || l.type === 'building' || l.type === 'storage'
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        <LoadingErrorContent
          isLoading={isLoading}
          error={error}
          loadingMessage="Loading locations..."
          errorTitle="Error Loading Locations"
          errorMessage="Failed to load location data. Please try again."
          onRetry={() => refetch()}
          empty={!isLoading && !error && filteredLocations.length === 0}
          emptyTitle={searchTerm ? 'No locations found' : 'No locations yet'}
          emptyDescription={
            searchTerm
              ? 'Try adjusting your search terms.'
              : 'Get started by adding your first farm location to organize your animals.'
          }
          emptyAction={
            !searchTerm ? (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Location
              </Button>
            ) : undefined
          }
          emptyIcon={
            <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-green-600" />
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location: Location) => {
              const IconComponent = locationTypeIcons[location.type] || locationTypeIcons.other;
              return (
                <div
                  key={location.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{location.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {locationTypeLabels[location.type] || location.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingLocation(location)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {location.description && (
                    <p className="text-sm text-gray-600 mb-4">{location.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {location.capacity && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capacity:</span>
                        <span className="text-gray-900">{location.capacity} animals</span>
                      </div>
                    )}
                    {/* Occupancy isn't always in the base model but if the API returns it we can show it */}
                    {location.current_occupancy !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current Occupancy:</span>
                        <span className="text-gray-900">{location.current_occupancy} animals</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </LoadingErrorContent>
      </div>

      {/* Create/Edit Modals */}
      <UnifiedModal
        isOpen={showCreateModal || editingLocation !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingLocation(null);
        }}
        onSubmit={editingLocation ? handleUpdate : handleCreate}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        fields={locationFormFields}
        initialData={(editingLocation as Record<string, unknown>) || undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitLabel={editingLocation ? 'Update Location' : 'Create Location'}
        size="lg"
      />

      {/* Confirmation Dialog */}
      {ConfirmationDialog}
    </div>
  );
}

export default LocationsPage;
