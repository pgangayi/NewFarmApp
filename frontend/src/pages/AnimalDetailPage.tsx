import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Heart, TrendingUp, Baby, FileText } from 'lucide-react';
import { AnimalHealthManager } from '../components/AnimalHealthManager';
import { AnimalProductionTracker } from '../components/AnimalProductionTracker';
import { AnimalBreedingManager } from '../components/AnimalBreedingManager';
import { AnimalAnalyticsDashboard } from '../components/AnimalAnalyticsDashboard';

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

interface AnimalDetailPageProps {
  animalId?: string;
}

export function AnimalDetailPage({ animalId }: AnimalDetailPageProps = {}) {
  const { getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get animal ID from URL params or props
  const urlParams = new URLSearchParams(window.location.search);
  const id = animalId || urlParams.get('id');

  const { data: animal, isLoading, error } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const response = await fetch(`/api/animals/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch animal details');
      }

      return await response.json();
    },
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Animal Not Found</h2>
          <p className="text-gray-600 mb-4">The animal you're looking for doesn't exist or you don't have access to it.</p>
          <a
            href="/animals"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
          >
            Back to Animals
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'health', name: 'Health Records', icon: Heart },
    { id: 'production', name: 'Production', icon: TrendingUp },
    ...(animal.sex === 'female' ? [{ id: 'breeding', name: 'Breeding', icon: Baby }] : []),
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/animals"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors inline-block"
              >
                <ArrowLeft className="h-5 w-5" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{animal.name}</h1>
                <p className="text-gray-600">
                  {animal.species} {animal.breed && `• ${animal.breed}`} • {animal.farm_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animal Summary Card */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Basic Info */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {animal.identification_tag && (
                  <div>
                    <span className="font-medium text-gray-700">ID Tag:</span>
                    <span className="text-gray-600 ml-2 font-mono">{animal.identification_tag}</span>
                  </div>
                )}
                {animal.sex && (
                  <div>
                    <span className="font-medium text-gray-700">Sex:</span>
                    <span className="text-gray-600 ml-2 capitalize">{animal.sex}</span>
                  </div>
                )}
                {animal.birth_date && (
                  <div>
                    <span className="font-medium text-gray-700">Age:</span>
                    <span className="text-gray-600 ml-2">{calculateAge(animal.birth_date)}</span>
                  </div>
                )}
                {animal.current_weight && (
                  <div>
                    <span className="font-medium text-gray-700">Weight:</span>
                    <span className="text-gray-600 ml-2">{animal.current_weight} kg</span>
                  </div>
                )}
                {animal.target_weight && (
                  <div>
                    <span className="font-medium text-gray-700">Target Weight:</span>
                    <span className="text-gray-600 ml-2">{animal.target_weight} kg</span>
                  </div>
                )}
                {animal.current_location && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="text-gray-600 ml-2">{animal.current_location}</span>
                  </div>
                )}
                {animal.pasture_name && (
                  <div>
                    <span className="font-medium text-gray-700">Pasture:</span>
                    <span className="text-gray-600 ml-2">{animal.pasture_name}</span>
                  </div>
                )}
                {animal.production_type && (
                  <div>
                    <span className="font-medium text-gray-700">Production:</span>
                    <span className="text-gray-600 ml-2 capitalize">{animal.production_type}</span>
                  </div>
                )}
              </div>

              {/* Family Information */}
              {(animal.father_name || animal.mother_name) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Genetic Lineage</h4>
                  <div className="text-sm space-y-1">
                    {animal.father_name && (
                      <div>
                        <span className="font-medium text-gray-700">Father:</span>
                        <span className="text-gray-600 ml-2">{animal.father_name}</span>
                      </div>
                    )}
                    {animal.mother_name && (
                      <div>
                        <span className="font-medium text-gray-700">Mother:</span>
                        <span className="text-gray-600 ml-2">{animal.mother_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Breed Information */}
              {animal.breed_origin && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Breed Information</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium text-gray-700">Origin:</span>
                      <span className="text-gray-600 ml-2">{animal.breed_origin}</span>
                    </div>
                    {animal.breed_purpose && (
                      <div>
                        <span className="font-medium text-gray-700">Purpose:</span>
                        <span className="text-gray-600 ml-2 capitalize">{animal.breed_purpose.replace('_', ' ')}</span>
                      </div>
                    )}
                    {animal.breed_avg_weight && (
                      <div>
                        <span className="font-medium text-gray-700">Avg Weight:</span>
                        <span className="text-gray-600 ml-2">{animal.breed_avg_weight} kg</span>
                      </div>
                    )}
                    {animal.breed_temperament && (
                      <div>
                        <span className="font-medium text-gray-700">Temperament:</span>
                        <span className="text-gray-600 ml-2 capitalize">{animal.breed_temperament}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status and Quick Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(animal.health_status)}`}>
                  {animal.health_status.replace('_', ' ')}
                </span>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(animal.status)}`}>
                  {animal.status}
                </span>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Vaccination Status:</span>
                  <span className="text-gray-600 ml-2 capitalize">{animal.vaccination_status.replace('_', ' ')}</span>
                </div>
                {animal.last_vet_check && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Last Vet Check:</span>
                    <span className="text-gray-600 ml-2">{new Date(animal.last_vet_check).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Financial Info */}
              {animal.acquisition_cost && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Investment</h4>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Acquisition Cost:</span>
                    <span className="text-gray-600 ml-2">${animal.acquisition_cost}</span>
                  </div>
                  {animal.acquisition_date && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Acquired:</span>
                      <span className="text-gray-600 ml-2">{new Date(animal.acquisition_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Health Records</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">{animal.health_records_count}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Production Records</span>
                  </div>
                  <span className="text-lg font-bold text-green-900">{animal.production_records_count}</span>
                </div>

                {animal.sex === 'female' && (
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Baby className="h-5 w-5 text-pink-600" />
                      <span className="text-sm font-medium text-pink-700">Breeding Records</span>
                    </div>
                    <span className="text-lg font-bold text-pink-900">{animal.breeding_records_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AnimalAnalyticsDashboard farmId={animal.farm_id} />
          </div>
        )}

        {activeTab === 'health' && (
          <AnimalHealthManager animalId={animal.id} animalName={animal.name} />
        )}

        {activeTab === 'production' && (
          <AnimalProductionTracker 
            animalId={animal.id} 
            animalName={animal.name}
            productionType={animal.production_type}
          />
        )}

        {activeTab === 'breeding' && animal.sex === 'female' && (
          <AnimalBreedingManager 
            animalId={animal.id} 
            animalName={animal.name}
            animalSex={animal.sex}
          />
        )}

        {activeTab === 'analytics' && (
          <AnimalAnalyticsDashboard farmId={animal.farm_id} />
        )}
      </div>
    </div>
  );
}

export default AnimalDetailPage;