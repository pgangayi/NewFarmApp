import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/AuthContext';
import { Animal, BreedingRecord } from '../api/types';
import { AnimalService } from '../services/domains/AnimalService';
import { Plus, Heart, Calendar, AlertCircle, CheckCircle, Baby } from 'lucide-react';

// BreedingRecord interface removed, using global import

interface AnimalBreedingManagerProps {
  animalId: string;
  animalName: string;
  animalSex: string;
}

const BREEDING_TYPE_NATURAL = 'natural';
const BREEDING_TYPE_ARTIFICIAL = 'artificial';
const BREEDING_TYPE_EMBRYO = 'embryo_transfer';

const RESULT_PREGNANT = 'pregnant';
const RESULT_NOT_PREGNANT = 'not_pregnant';
const RESULT_UNKNOWN = 'unknown';
const RESULT_PENDING = 'pending';

const breedingTypeOptions = [
  { value: BREEDING_TYPE_NATURAL, label: 'Natural Breeding' },
  { value: BREEDING_TYPE_ARTIFICIAL, label: 'Artificial Insemination' },
  { value: BREEDING_TYPE_EMBRYO, label: 'Embryo Transfer' },
];

const breedingResultOptions = [
  { value: RESULT_PREGNANT, label: 'Pregnant' },
  { value: RESULT_NOT_PREGNANT, label: 'Not Pregnant' },
  { value: RESULT_UNKNOWN, label: 'Unknown' },
  { value: RESULT_PENDING, label: 'Pending' },
];

export function AnimalBreedingManager({
  animalId,
  animalName,
  animalSex,
}: AnimalBreedingManagerProps) {
  const { getAuthHeaders } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const [showOffspringModal, setShowOffspringModal] = useState(false);
  const [selectedBreeding, setSelectedBreeding] = useState<BreedingRecord | null>(null);

  const queryClient = useQueryClient();
  const BREEDING_RECORDS_KEY = 'animal-breeding-records';

  // Fetch breeding records
  const {
    data: breedingRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: [BREEDING_RECORDS_KEY, animalId],
    queryFn: async () => {
      return AnimalService.getBreedingRecords(animalId);
    },
    enabled: !!animalId && animalSex === 'female', // Only for females
  });

  // Fetch male animals for sire selection
  const { data: maleAnimals } = useQuery({
    queryKey: ['male-animals-for-breeding'],
    queryFn: async () => {
      return AnimalService.getAnimals({ species: 'all', sex: 'male' });
    },
    enabled: !!animalId,
  });

  // Create breeding record mutation
  const createMutation = useMutation({
    mutationFn: async (recordData: any) => {
      return AnimalService.addBreedingRecord(animalId, recordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BREEDING_RECORDS_KEY, animalId] });
      setShowAddModal(false);
    },
  });

  // Update breeding record mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...recordData }: Partial<BreedingRecord> & { id: string }) => {
      return AnimalService.updateBreedingRecord(animalId, id, recordData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BREEDING_RECORDS_KEY, animalId] });
      setEditingRecord(null);
    },
  });

  // Delete breeding record mutation
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return AnimalService.deleteBreedingRecord(animalId, recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BREEDING_RECORDS_KEY, animalId] });
    },
  });

  const handleEdit = (record: BreedingRecord) => {
    setEditingRecord(record);
  };

  const handleDelete = async (record: BreedingRecord) => {
    if (window.confirm('Are you sure you want to delete this breeding record?')) {
      try {
        await deleteMutation.mutateAsync(record.id.toString());
      } catch (error) {
        console.error('Failed to delete breeding record:', error);
      }
    }
  };

  const handleViewOffspring = (record: BreedingRecord) => {
    setSelectedBreeding(record);
    setShowOffspringModal(true);
  };

  const getBreedingTypeIcon = (type: string) => {
    switch (type) {
      case BREEDING_TYPE_NATURAL:
        return <Heart className="h-4 w-4 text-pink-600" />;
      case BREEDING_TYPE_ARTIFICIAL:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case BREEDING_TYPE_EMBRYO:
        return <Baby className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBreedingResultColor = (result?: string) => {
    switch (result) {
      case RESULT_PREGNANT:
        return 'bg-green-100 text-green-800';
      case RESULT_NOT_PREGNANT:
        return 'bg-red-100 text-red-800';
      case RESULT_UNKNOWN:
        return 'bg-yellow-100 text-yellow-800';
      case RESULT_PENDING:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateGestationDays = (breedingDate: string, expectedCalvingDate?: string) => {
    if (!expectedCalvingDate) return null;

    const breeding = new Date(breedingDate);
    const expectedCalving = new Date(expectedCalvingDate);
    const diffTime = expectedCalving.getTime() - breeding.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysUntilCalving = (expectedCalvingDate?: string) => {
    if (!expectedCalvingDate) return null;

    const today = new Date();
    const expectedCalving = new Date(expectedCalvingDate);
    const diffTime = expectedCalving.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (animalSex !== 'female') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Breeding Management</h3>
          <p className="text-gray-500">Breeding records are only available for female animals.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        Error loading breeding records: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Breeding Records</h3>
          <p className="text-sm text-gray-600">{animalName}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record Breeding
        </button>
      </div>

      {/* Breeding Summary */}
      {breedingRecords && breedingRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700">Total Breedings</p>
                <p className="text-2xl font-bold text-pink-900">{breedingRecords.length}</p>
              </div>
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Successful</p>
                <p className="text-2xl font-bold text-green-900">
                  {
                    breedingRecords.filter(
                      (r: BreedingRecord) => r.breeding_result === RESULT_PREGNANT
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Offspring</p>
                <p className="text-2xl font-bold text-blue-900">
                  {breedingRecords.reduce(
                    (sum: number, r: BreedingRecord) => sum + (r.offspring_count || 0),
                    0
                  )}
                </p>
              </div>
              <Baby className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Breeding Records List */}
      <div className="space-y-4">
        {(breedingRecords || []).map((record: BreedingRecord) => {
          const daysUntilCalving = getDaysUntilCalving(record.expected_calving_date || '');
          // const gestationDays = calculateGestationDays(
          //   record.breeding_date,
          //   record.expected_calving_date
          // );

          return (
            <div
              key={record.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {getBreedingTypeIcon(record.breeding_type || '')}
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {(record.breeding_type || 'unknown').replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(record.breeding_date).toLocaleDateString()}
                    </p>
                  </div>
                  {record.breeding_result && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getBreedingResultColor(record.breeding_result)}`}
                    >
                      {record.breeding_result.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {record.offspring_count && record.offspring_count > 0 && (
                    <button
                      onClick={() => handleViewOffspring(record)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Offspring"
                    >
                      <Baby className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-3">
                {record.sire_name && (
                  <div>
                    <span className="font-medium text-gray-700">Sire:</span>
                    <span className="text-gray-600 ml-2">{record.sire_name}</span>
                  </div>
                )}
                {record.breeding_fee && (
                  <div>
                    <span className="font-medium text-gray-700">Breeding Fee:</span>
                    <span className="text-gray-600 ml-2">${record.breeding_fee}</span>
                  </div>
                )}
                {record.vet_supervision && (
                  <div>
                    <span className="font-medium text-gray-700">Vet Supervision:</span>
                    <span className="text-green-600 ml-2">Yes</span>
                  </div>
                )}
                {record.expected_calving_date && (
                  <div>
                    <span className="font-medium text-gray-700">Expected Calving:</span>
                    <span className="text-gray-600 ml-2">
                      {new Date(record.expected_calving_date || '').toLocaleDateString()}
                    </span>
                    {daysUntilCalving !== null && (
                      <span
                        className={`ml-2 text-xs ${
                          daysUntilCalving > 30
                            ? 'text-gray-500'
                            : daysUntilCalving > 0
                              ? 'text-orange-600'
                              : 'text-red-600'
                        }`}
                      >
                        ({daysUntilCalving > 0 ? `${daysUntilCalving} days` : 'Overdue'})
                      </span>
                    )}
                  </div>
                )}
                {record.actual_calving_date && (
                  <div>
                    <span className="font-medium text-gray-700">Actual Calving:</span>
                    <span className="text-gray-600 ml-2">
                      {new Date(record.actual_calving_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {record.offspring_count && (
                  <div>
                    <span className="font-medium text-gray-700">Offspring:</span>
                    <span className="text-gray-600 ml-2">
                      {record.offspring_count} {record.offspring_count === 1 ? 'calf' : 'calves'}
                    </span>
                  </div>
                )}
              </div>

              {record.breeding_notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{record.breeding_notes}</p>
                </div>
              )}

              {record.created_by_name && (
                <div className="mt-2 text-xs text-gray-500">
                  Recorded by {record.created_by_name} on{' '}
                  {new Date(record.created_at || new Date().toISOString()).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {(breedingRecords || []).length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No breeding records</h3>
          <p className="text-gray-500 mb-4">Start tracking {animalName}&apos;s breeding history</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Record First Breeding
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingRecord) && (
        <BreedingRecordModal
          record={editingRecord}
          maleAnimals={maleAnimals || []}
          onClose={() => {
            setShowAddModal(false);
            setEditingRecord(null);
          }}
          onSubmit={data => {
            if (editingRecord) {
              updateMutation.mutate({ ...data, id: editingRecord.id });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Offspring Modal */}
      {showOffspringModal && selectedBreeding && (
        <OffspringModal
          breedingRecord={selectedBreeding}
          onClose={() => {
            setShowOffspringModal(false);
            setSelectedBreeding(null);
          }}
        />
      )}
    </div>
  );
}

// Breeding Record Modal Component
interface BreedingRecordModalProps {
  record?: BreedingRecord | null;
  maleAnimals: Animal[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function BreedingRecordModal({
  record,
  maleAnimals,
  onClose,
  onSubmit,
  isLoading,
}: BreedingRecordModalProps) {
  const [formData, setFormData] = useState<{
    breeding_date: string;
    sire_id: string | number;
    breeding_type: string;
    breeding_fee: string | number;
    expected_calving_date: string;
    actual_calving_date: string;
    breeding_result: string;
    offspring_count: string | number;
    breeding_notes: string;
    vet_supervision: boolean;
  }>({
    breeding_date: record?.breeding_date || (new Date().toISOString().split('T')[0] as string),
    sire_id: record?.sire_id || '',
    breeding_type: record?.breeding_type || BREEDING_TYPE_NATURAL,
    breeding_fee: record?.breeding_fee || '',
    expected_calving_date: record?.expected_calving_date || '',
    actual_calving_date: record?.actual_calving_date || '',
    breeding_result: record?.breeding_result || '',
    offspring_count: record?.offspring_count || '',
    breeding_notes: record?.breeding_notes || '',
    vet_supervision: record?.vet_supervision || false,
  });

  // Auto-calculate expected calving date based on breeding type and date
  React.useEffect(() => {
    if (formData.breeding_date && !record) {
      const breedingDate = new Date(formData.breeding_date);
      let gestationDays = 280; // Default for cattle

      if (formData.breeding_type === BREEDING_TYPE_ARTIFICIAL) {
        gestationDays = 280;
      } else if (formData.breeding_type === BREEDING_TYPE_EMBRYO) {
        gestationDays = 280;
      }

      const expectedCalving = new Date(breedingDate);
      expectedCalving.setDate(expectedCalving.getDate() + gestationDays);

      setFormData(prev => ({
        ...prev,
        expected_calving_date: expectedCalving.toISOString().split('T')[0] as string,
      }));
    }
  }, [formData.breeding_date, formData.breeding_type, record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      sire_id: formData.sire_id ? parseInt(formData.sire_id.toString()) : undefined,
      breeding_fee: formData.breeding_fee
        ? parseFloat(formData.breeding_fee.toString())
        : undefined,
      offspring_count: formData.offspring_count
        ? parseInt(formData.offspring_count.toString())
        : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {record ? 'Edit Breeding Record' : 'Record Breeding'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="breeding-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Breeding Date *
                </label>
                <input
                  id="breeding-date"
                  type="date"
                  required
                  value={formData.breeding_date}
                  onChange={e => setFormData(prev => ({ ...prev, breeding_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label
                  htmlFor="breeding-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Breeding Type *
                </label>
                <select
                  id="breeding-type"
                  required
                  value={formData.breeding_type}
                  onChange={e => setFormData(prev => ({ ...prev, breeding_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {breedingTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sire-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Sire (Father)
                </label>
                <select
                  id="sire-id"
                  value={formData.sire_id}
                  onChange={e => setFormData(prev => ({ ...prev, sire_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Select Sire</option>
                  {maleAnimals.map((animal: Animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name} ({animal.species} - {animal.breed || 'Unknown Breed'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="breeding-fee"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Breeding Fee ($)
                </label>
                <input
                  id="breeding-fee"
                  type="number"
                  step="0.01"
                  value={formData.breeding_fee}
                  onChange={e => setFormData(prev => ({ ...prev, breeding_fee: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label
                  htmlFor="expected-calving-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expected Calving Date
                </label>
                <input
                  id="expected-calving-date"
                  type="date"
                  value={formData.expected_calving_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, expected_calving_date: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label
                  htmlFor="actual-calving-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Actual Calving Date
                </label>
                <input
                  id="actual-calving-date"
                  type="date"
                  value={formData.actual_calving_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, actual_calving_date: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label
                  htmlFor="breeding-result"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Breeding Result
                </label>
                <select
                  id="breeding-result"
                  value={formData.breeding_result}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, breeding_result: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Select Result</option>
                  {breedingResultOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="offspring-count"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Offspring Count
                </label>
                <input
                  id="offspring-count"
                  type="number"
                  min="0"
                  value={formData.offspring_count}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, offspring_count: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="breeding-notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Breeding Notes
              </label>
              <textarea
                id="breeding-notes"
                rows={3}
                value={formData.breeding_notes}
                onChange={e => setFormData(prev => ({ ...prev, breeding_notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Notes about the breeding process..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="vet_supervision"
                checked={formData.vet_supervision}
                onChange={e =>
                  setFormData(prev => ({ ...prev, vet_supervision: e.target.checked }))
                }
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="vet_supervision" className="ml-2 block text-sm text-gray-900">
                Veterinary supervision was required
              </label>
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
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : record ? 'Update Record' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Offspring Modal Component
interface OffspringModalProps {
  breedingRecord: BreedingRecord;
  onClose: () => void;
}

function OffspringModal({ breedingRecord, onClose }: OffspringModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Offspring Details</h2>

          <div className="space-y-4">
            <div className="text-center">
              <Baby className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <p className="text-lg font-semibold text-gray-900">
                {breedingRecord.offspring_count}{' '}
                {breedingRecord.offspring_count === 1 ? 'Offspring' : 'Offspring'}
              </p>
              <p className="text-sm text-gray-600">
                From breeding on {new Date(breedingRecord.breeding_date).toLocaleDateString()}
              </p>
            </div>

            {breedingRecord.sire_name && (
              <div className="border-t pt-4">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Father:</span>
                  <span className="text-gray-600 ml-2">{breedingRecord.sire_name}</span>
                </p>
              </div>
            )}

            {breedingRecord.actual_calving_date && (
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Birth Date:</span>
                  <span className="text-gray-600 ml-2">
                    {new Date(breedingRecord.actual_calving_date).toLocaleDateString()}
                  </span>
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">
                This feature will be expanded to allow you to create individual animal records for
                each offspring and track their growth and development.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
