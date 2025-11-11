import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAnimals } from '../hooks/useAnimals';
import { useFarm } from '../hooks/useFarm';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Heart,
  Baby,
  TrendingUp,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface FilterState {
  search: string;
  species: string;
  breed: string;
  health_status: string;
  sex: string;
  production_type: string;
  status: string;
  location: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

const defaultFilters: FilterState = {
  search: '',
  species: '',
  breed: '',
  health_status: '',
  sex: '',
  production_type: '',
  status: '',
  location: '',
  sort_by: 'created_at',
  sort_order: 'desc',
};

const speciesOptions = [
  { value: '', label: 'All Species' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'chicken', label: 'Chicken' },
  { value: 'pig', label: 'Pig' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'goat', label: 'Goat' },
];

const healthStatusOptions = [
  { value: '', label: 'All Health Status' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'sick', label: 'Sick' },
  { value: 'injured', label: 'Injured' },
  { value: 'under_treatment', label: 'Under Treatment' },
  { value: 'quarantine', label: 'Quarantine' },
];

const sexOptions = [
  { value: '', label: 'All Sex' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const productionTypeOptions = [
  { value: '', label: 'All Production Types' },
  { value: 'meat', label: 'Meat' },
  { value: 'milk', label: 'Milk' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'wool', label: 'Wool' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'companion', label: 'Companion' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'sold', label: 'Sold' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'slaughtered', label: 'Slaughtered' },
  { value: 'retired', label: 'Retired' },
];

export function AnimalsPage() {
  const { user, isAuthenticated } = useAuth();
  const { currentFarm } = useFarm();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<unknown>(null);

  // Use custom hooks for live data
  const {
    animals,
    isLoading,
    error,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAnimals();

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access animal management.</p>
        </div>
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Farm Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select or create a farm to access animal management features.
          </p>
          <Button onClick={() => (window.location.href = '/farms')}>Go to Farms</Button>
        </div>
      </div>
    );
  }

  // Filter animals for current farm
  const farmAnimals = animals.filter(animal => animal.farm_id === currentFarm.id);
  const filteredAnimals = farmAnimals.filter(animal => {
    const matchesSearch =
      filters.search === '' ||
      animal.identification?.toLowerCase().includes(filters.search.toLowerCase()) ||
      animal.animal_type?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesSpecies = filters.species === '' || animal.animal_type === filters.species;
    const matchesBreed = filters.breed === '' || animal.breed === filters.breed;
    const matchesStatus = filters.status === '' || animal.status === filters.status;

    return matchesSearch && matchesSpecies && matchesBreed && matchesStatus;
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleEdit = (animal: unknown) => {
    setSelectedAnimal(animal);
    setShowEditModal(true);
  };

  const handleDelete = async (animal: unknown) => {
    if (
      window.confirm(`Are you sure you want to delete ${animal.identification || 'this animal'}?`)
    ) {
      try {
        await deleteAnimal(animal.id);
      } catch (error) {
        console.error('Failed to delete animal:', error);
      }
    }
  };

  // Calculate statistics
  const stats = {
    total: farmAnimals.length,
    active: farmAnimals.filter(a => a.status === 'active').length,
    healthy: farmAnimals.length, // Default to healthy as we don't have health data in the basic Animal type
    needsAttention: farmAnimals.filter(a => a.status === 'sold' || a.status === 'deceased').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your animals...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Animals</h2>
          <p className="text-gray-600 mb-4">
            We&apos;re having trouble loading your animal data. Please check your connection and try
            again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: `url('/Livestock Wallpaper.png')`,
        backgroundBlendMode: 'soft-light',
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur-[0.5px]"></div>

      {/* Breadcrumbs */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Heart className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Animal Management</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentFarm.name} • {currentFarm.location || 'Location not set'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Animal
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Animals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Baby className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Heart className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Healthy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.healthy}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900">{stats.needsAttention}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search animals by ID or type..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                <select
                  value={filters.species}
                  onChange={e => handleFilterChange('species', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {speciesOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Status
                </label>
                <select
                  value={filters.health_status}
                  onChange={e => handleFilterChange('health_status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {healthStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <select
                  value={filters.sex}
                  onChange={e => handleFilterChange('sex', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sexOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Animals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredAnimals.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredAnimals.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Heart className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No animals found</h3>
            <p className="text-gray-600 mb-6">
              {filteredAnimals.length === 0 && farmAnimals.length > 0
                ? 'Try adjusting your search filters.'
                : 'Get started by adding your first animal to track'}
            </p>
            {filteredAnimals.length === 0 && farmAnimals.length === 0 && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Animal
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modals */}
      {showCreateModal && (
        <AnimalFormModal
          farmId={currentFarm.id}
          onClose={() => setShowCreateModal(false)}
          onSubmit={data => createAnimal(data)}
          isLoading={isCreating}
        />
      )}

      {showEditModal && selectedAnimal && (
        <AnimalFormModal
          animal={selectedAnimal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAnimal(null);
          }}
          onSubmit={data => updateAnimal({ id: selectedAnimal.id, ...data })}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}

// Animal Card Component
interface AnimalCardProps {
  animal: unknown;
  onEdit: (animal: unknown) => void;
  onDelete: (animal: unknown) => void;
}

function AnimalCard({ animal, onEdit, onDelete }: AnimalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'breeding':
        return 'bg-blue-100 text-blue-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'deceased':
        return 'bg-red-100 text-red-800';
      case 'retired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (acquisitionDate?: string) => {
    if (!acquisitionDate) return null;
    const birth = new Date(acquisitionDate);
    const now = new Date();
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0) {
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    }
    return `${remainingMonths}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{animal.identification || 'No ID'}</h3>
              <p className="text-sm text-gray-600">{animal.animal_type || 'Unknown type'}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(animal)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(animal)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {animal.breed && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Breed:</span>
            <span className="text-gray-900">{animal.breed}</span>
          </div>
        )}

        {animal.acquisition_date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Age:</span>
            <span className="text-gray-900">{calculateAge(animal.acquisition_date)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animal.status)}`}
          >
            {animal.status || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Breed Info */}
      {animal.breed && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {animal.animal_type} • {animal.breed}
          </p>
        </div>
      )}
    </div>
  );
}

// Animal Form Modal Component
interface AnimalFormModalProps {
  farmId?: string;
  animal?: unknown;
  onClose: () => void;
  onSubmit: (data: unknown) => void;
  isLoading: boolean;
}

function AnimalFormModal({ farmId, animal, onClose, onSubmit, isLoading }: AnimalFormModalProps) {
  const [formData, setFormData] = useState({
    farm_id: animal?.farm_id || farmId || '',
    animal_type: animal?.animal_type || '',
    breed: animal?.breed || '',
    identification: animal?.identification || '',
    acquisition_date: animal?.acquisition_date || new Date().toISOString().split('T')[0],
    status: animal?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              {animal ? 'Edit Animal' : 'Add New Animal'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animal Type *
                </label>
                <select
                  required
                  value={formData.animal_type}
                  onChange={e => setFormData(prev => ({ ...prev, animal_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  {speciesOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={e => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter breed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identification *
                </label>
                <input
                  type="text"
                  required
                  value={formData.identification}
                  onChange={e => setFormData(prev => ({ ...prev, identification: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ID or tag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acquisition Date
                </label>
                <input
                  type="date"
                  value={formData.acquisition_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, acquisition_date: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : animal ? (
                  'Update Animal'
                ) : (
                  'Create Animal'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AnimalsPage;
