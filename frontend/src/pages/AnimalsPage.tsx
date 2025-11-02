import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Plus, Search, Filter, Edit, Trash2, Eye, Heart, Baby, TrendingUp } from 'lucide-react';
import AnimalDetailPage from './AnimalDetailPage';

interface Animal {
  id: string;
  farm_id?: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  sex?: string;
  identification_tag?: string;
  health_status: string;
  current_location?: string;
  pasture_id?: number;
  production_type?: string;
  status: string;
  current_weight?: number;
  target_weight?: number;
  vaccination_status: string;
  last_vet_check?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  father_id?: number;
  mother_id?: number;
  genetic_profile?: string;
  created_at?: string;
  updated_at?: string;
  farm_name: string;
  pasture_name?: string;
  breed_origin?: string;
  breed_purpose?: string;
  breed_avg_weight?: number;
  breed_temperament?: string;
  health_records_count: number;
  production_records_count: number;
  breeding_records_count: number;
  father_name?: string;
  mother_name?: string;
}

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

interface Breed {
  value: string;
  label: string;
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
  sort_order: 'desc'
};

const speciesOptions = [
  { value: '', label: 'All Species' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'chicken', label: 'Chicken' },
  { value: 'pig', label: 'Pig' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'goat', label: 'Goat' }
];

const healthStatusOptions = [
  { value: '', label: 'All Health Status' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'sick', label: 'Sick' },
  { value: 'injured', label: 'Injured' },
  { value: 'under_treatment', label: 'Under Treatment' },
  { value: 'quarantine', label: 'Quarantine' }
];

const sexOptions = [
  { value: '', label: 'All Sex' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

const productionTypeOptions = [
  { value: '', label: 'All Production Types' },
  { value: 'meat', label: 'Meat' },
  { value: 'milk', label: 'Milk' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'wool', label: 'Wool' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'companion', label: 'Companion' }
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'sold', label: 'Sold' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'slaughtered', label: 'Slaughtered' },
  { value: 'retired', label: 'Retired' }
];

export function AnimalsPage() {
  const { getAuthHeaders } = useAuth();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Check if viewing individual animal detail
  const urlParams = new URLSearchParams(window.location.search);
  const animalId = urlParams.get('id');
  
  if (animalId) {
    return <AnimalDetailPage animalId={animalId} />;
  }

  const queryClient = useQueryClient();

  // Fetch animals with filters
  const { data: animalsData, isLoading, error } = useQuery({
    queryKey: ['animals', { ...filters, page, limit }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());

      const response = await fetch(`/api/animals?${searchParams.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch animals');
      }

      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create animal mutation
  const createAnimalMutation = useMutation({
    mutationFn: async (animalData: any) => {
      const response = await fetch('/api/animals', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(animalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create animal');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setShowCreateModal(false);
    },
  });

  // Update animal mutation
  const updateAnimalMutation = useMutation({
    mutationFn: async ({ id, ...animalData }: any) => {
      const response = await fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(animalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update animal');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setShowEditModal(false);
      setSelectedAnimal(null);
    },
  });

  // Delete animal mutation
  const deleteAnimalMutation = useMutation({
    mutationFn: async (animalId: string) => {
      const response = await fetch(`/api/animals/${animalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete animal');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowEditModal(true);
  };

  const handleDelete = async (animal: Animal) => {
    if (window.confirm(`Are you sure you want to delete ${animal.name}?`)) {
      try {
        await deleteAnimalMutation.mutateAsync(animal.id);
      } catch (error) {
        console.error('Failed to delete animal:', error);
      }
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-600">Error loading animals: {error.message}</div>
    </div>
  );

  const animals = animalsData?.animals || [];
  const pagination = animalsData?.pagination;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Animal Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your livestock with comprehensive tracking and breeding records
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Animal
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search animals by name or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  onChange={(e) => handleFilterChange('species', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {speciesOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <select
                  value={filters.health_status}
                  onChange={(e) => handleFilterChange('health_status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {healthStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <select
                  value={filters.sex}
                  onChange={(e) => handleFilterChange('sex', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sexOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Type</label>
                <select
                  value={filters.production_type}
                  onChange={(e) => handleFilterChange('production_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {productionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="species">Species</option>
                  <option value="breed">Breed</option>
                  <option value="health_status">Health Status</option>
                  <option value="created_at">Date Added</option>
                  <option value="updated_at">Last Updated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={filters.sort_order}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value as 'asc' | 'desc')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {animals.map((animal: Animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Empty State */}
        {animals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No animals found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first animal to track</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Animal
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 border rounded-lg ${
                      page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, pagination.pages))}
              disabled={page === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modals */}
      {showCreateModal && (
        <AnimalFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createAnimalMutation.mutate(data)}
          isLoading={createAnimalMutation.isPending}
        />
      )}

      {showEditModal && selectedAnimal && (
        <AnimalFormModal
          animal={selectedAnimal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAnimal(null);
          }}
          onSubmit={(data) => updateAnimalMutation.mutate({ ...data, id: selectedAnimal.id })}
          isLoading={updateAnimalMutation.isPending}
        />
      )}
    </div>
  );
}

// Animal Card Component
interface AnimalCardProps {
  animal: Animal;
  onEdit: (animal: Animal) => void;
  onDelete: (animal: Animal) => void;
}

function AnimalCard({ animal, onEdit, onDelete }: AnimalCardProps) {
  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'under_treatment':
        return 'bg-yellow-100 text-yellow-800';
      case 'injured':
        return 'bg-orange-100 text-orange-800';
      case 'quarantine':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0) {
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
    }
    return `${remainingMonths}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{animal.name}</h3>
          <p className="text-sm text-gray-500">
            {animal.species} {animal.breed && `• ${animal.breed}`}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => window.location.href = `/animals?id=${animal.id}`}
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
        {animal.identification_tag && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ID Tag:</span>
            <span className="text-gray-900 font-mono">{animal.identification_tag}</span>
          </div>
        )}
        
        {animal.sex && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sex:</span>
            <span className="text-gray-900 capitalize">{animal.sex}</span>
          </div>
        )}

        {animal.birth_date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Age:</span>
            <span className="text-gray-900">{calculateAge(animal.birth_date)}</span>
          </div>
        )}

        {animal.current_weight && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Weight:</span>
            <span className="text-gray-900">{animal.current_weight} kg</span>
          </div>
        )}

        {animal.current_location && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-900">{animal.current_location}</span>
          </div>
        )}

        {animal.production_type && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Production:</span>
            <span className="text-gray-900 capitalize">{animal.production_type}</span>
          </div>
        )}
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(animal.health_status)}`}>
          {animal.health_status.replace('_', ' ')}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animal.status)}`}>
          {animal.status}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="flex items-center justify-center gap-1 text-blue-600">
          <Heart className="h-4 w-4" />
          <span>{animal.health_records_count}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span>{animal.production_records_count}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-purple-600">
          <Baby className="h-4 w-4" />
          <span>{animal.breeding_records_count}</span>
        </div>
      </div>

      {/* Breed Info */}
      {animal.breed_origin && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {animal.breed_origin} {animal.breed_purpose && `• ${animal.breed_purpose.replace('_', ' ')}`}
          </p>
          {animal.breed_temperament && (
            <p className="text-xs text-gray-500 capitalize">{animal.breed_temperament}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Animal Form Modal Component
interface AnimalFormModalProps {
  animal?: Animal;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function AnimalFormModal({ animal, onClose, onSubmit, isLoading }: AnimalFormModalProps) {
  const [formData, setFormData] = useState({
    farm_id: animal?.farm_id || '',
    name: animal?.name || '',
    species: animal?.species || '',
    breed: animal?.breed || '',
    birth_date: animal?.birth_date || '',
    sex: animal?.sex || '',
    identification_tag: animal?.identification_tag || '',
    health_status: animal?.health_status || 'healthy',
    current_location: animal?.current_location || '',
    production_type: animal?.production_type || '',
    current_weight: animal?.current_weight || '',
    target_weight: animal?.target_weight || '',
    vaccination_status: animal?.vaccination_status || 'up-to-date',
    acquisition_date: animal?.acquisition_date || '',
    acquisition_cost: animal?.acquisition_cost || '',
    status: animal?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert numeric strings to numbers
    const submitData = {
      ...formData,
      current_weight: formData.current_weight ? parseFloat(formData.current_weight.toString()) : undefined,
      target_weight: formData.target_weight ? parseFloat(formData.target_weight.toString()) : undefined,
      acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost.toString()) : undefined,
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {animal ? 'Edit Animal' : 'Add New Animal'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
                <select
                  required
                  value={formData.species}
                  onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value, breed: '' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Species</option>
                  {speciesOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Sex</option>
                  {sexOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Tag</label>
                <input
                  type="text"
                  value={formData.identification_tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, identification_tag: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <select
                  value={formData.health_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, health_status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {healthStatusOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Type</label>
                <select
                  value={formData.production_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, production_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Production Type</option>
                  {productionTypeOptions.slice(1).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.current_weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_weight: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.current_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                <input
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisition_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.acquisition_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisition_cost: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : animal ? 'Update Animal' : 'Create Animal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AnimalsPage;