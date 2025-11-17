import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useFarm } from '../hooks/useFarm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Location } from '../types/entities';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Home,
  TreePine,
  Warehouse,
  Fence,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface LocationFormData {
  name: string;
  type: 'barn' | 'pasture' | 'field' | 'stable' | 'corral' | 'other';
  description?: string;
  capacity?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

const locationTypeIcons = {
  barn: Warehouse,
  pasture: TreePine,
  field: Fence,
  stable: Home,
  corral: Fence,
  other: MapPin,
};

const locationTypeLabels = {
  barn: 'Barn',
  pasture: 'Pasture',
  field: 'Field',
  stable: 'Stable',
  corral: 'Corral',
  other: 'Other',
};

export function LocationsPage() {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const { currentFarm } = useFarm();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Fetch locations for current farm
  const {
    data: locations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['locations', currentFarm?.id],
    queryFn: async () => {
      const response = await fetch(`/api/locations?farm_id=${currentFarm?.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      return data.data?.locations || [];
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: LocationFormData) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.session?.access_token}`,
        },
        body: JSON.stringify({
          ...locationData,
          farm_id: currentFarm?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create location');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowCreateModal(false);
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...locationData }: LocationFormData & { id: string }) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.session?.access_token}`,
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setEditingLocation(null);
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

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
    if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
      try {
        await deleteLocationMutation.mutateAsync(location.id);
      } catch (error) {
        console.error('Failed to delete location:', error);
      }
    }
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
                  {locations.filter((l: Location) => l.type === 'pasture').length}
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
                <p className="text-sm font-medium text-gray-600">Stables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {locations.filter((l: Location) => l.type === 'stable').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Locations</h3>
            <p className="text-gray-600">Failed to load location data. Please try again.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location: Location) => {
              const IconComponent = locationTypeIcons[location.type];
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
                          {locationTypeLabels[location.type]}
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
        )}

        {filteredLocations.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No locations found' : 'No locations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Get started by adding your first farm location to organize your animals.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Location
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modals */}
      {(showCreateModal || editingLocation) && (
        <LocationFormModal
          location={editingLocation}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLocation(null);
          }}
          onSubmit={data => {
            if (editingLocation) {
              updateLocationMutation.mutate({ ...data, id: editingLocation.id });
            } else {
              createLocationMutation.mutate(data);
            }
          }}
          isLoading={createLocationMutation.isPending || updateLocationMutation.isPending}
        />
      )}
    </div>
  );
}

// Location Form Modal Component
interface LocationFormModalProps {
  location?: Location | null;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => void;
  isLoading: boolean;
}

function LocationFormModal({ location, onClose, onSubmit, isLoading }: LocationFormModalProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: location?.name || '',
    type: location?.type || 'barn',
    description: location?.description || '',
    capacity: location?.capacity,
    coordinates: location?.coordinates,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              {location ? 'Edit Location' : 'Add New Location'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter location name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({ ...prev, type: e.target.value as Location['type'] }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Object.entries(locationTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity (animals)
              </label>
              <input
                type="number"
                min="0"
                value={formData.capacity || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    capacity: parseInt(e.target.value) || undefined,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter capacity (optional)"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LocationsPage;
