import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/AuthContext';
import { Plus, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface HealthRecord {
  id: number;
  animal_id: string;
  record_date: string;
  record_type: string;
  vet_name?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  next_due_date?: string;
  vet_contact?: string;
  notes?: string;
  animal_name: string;
  recorded_by_name?: string;
  created_at: string;
}

interface AnimalHealthManagerProps {
  animalId: string;
  animalName: string;
}

const recordTypeOptions = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'vet_visit', label: 'Veterinary Visit' },
  { value: 'illness', label: 'Illness' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'checkup', label: 'Check-up' },
];

export function AnimalHealthManager({ animalId, animalName }: AnimalHealthManagerProps) {
  const { getAuthHeaders } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  const queryClient = useQueryClient();

  // Fetch health records
  const {
    data: healthRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['animal-health-records', animalId],
    queryFn: async () => {
      const response = await fetch(`/api/animals/${animalId}/health-records`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch health records');
      }

      return await response.json();
    },
    enabled: !!animalId,
  });

  // Create health record mutation
  const createMutation = useMutation({
    mutationFn: async (recordData: unknown) => {
      const response = await fetch(`/api/animals/${animalId}/health-records`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create health record');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-health-records', animalId] });
      setShowAddModal(false);
    },
  });

  // Update health record mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...recordData }: unknown) => {
      const response = await fetch(`/api/animals/${animalId}/health-records/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update health record');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-health-records', animalId] });
      setEditingRecord(null);
    },
  });

  // Delete health record mutation
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const response = await fetch(`/api/animals/${animalId}/health-records/${recordId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete health record');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-health-records', animalId] });
    },
  });

  const handleEdit = (record: HealthRecord) => {
    setEditingRecord(record);
  };

  const handleDelete = async (record: HealthRecord) => {
    if (window.confirm('Are you sure you want to delete this health record?')) {
      try {
        await deleteMutation.mutateAsync(record.id.toString());
      } catch (error) {
        console.error('Failed to delete health record:', error);
      }
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'vaccination':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'vet_visit':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'illness':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'treatment':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'checkup':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'vaccination':
        return 'bg-green-100 text-green-800';
      case 'vet_visit':
        return 'bg-blue-100 text-blue-800';
      case 'illness':
        return 'bg-red-100 text-red-800';
      case 'treatment':
        return 'bg-yellow-100 text-yellow-800';
      case 'checkup':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        Error loading health records: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
          <p className="text-sm text-gray-600">{animalName}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      {/* Health Records List */}
      <div className="space-y-4">
        {(healthRecords || []).map((record: HealthRecord) => (
          <div
            key={record.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {getRecordTypeIcon(record.record_type)}
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {record.record_type.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(record.record_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(record.record_type)}`}
                >
                  {record.record_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {record.vet_name && (
                <div>
                  <span className="font-medium text-gray-700">Veterinarian:</span>
                  <span className="text-gray-600 ml-2">{record.vet_name}</span>
                </div>
              )}
              {record.diagnosis && (
                <div>
                  <span className="font-medium text-gray-700">Diagnosis:</span>
                  <span className="text-gray-600 ml-2">{record.diagnosis}</span>
                </div>
              )}
              {record.treatment && (
                <div>
                  <span className="font-medium text-gray-700">Treatment:</span>
                  <span className="text-gray-600 ml-2">{record.treatment}</span>
                </div>
              )}
              {record.medication && (
                <div>
                  <span className="font-medium text-gray-700">Medication:</span>
                  <span className="text-gray-600 ml-2">{record.medication}</span>
                  {record.dosage && <span className="text-gray-500 ml-1">({record.dosage})</span>}
                </div>
              )}
              {record.cost && (
                <div>
                  <span className="font-medium text-gray-700">Cost:</span>
                  <span className="text-gray-600 ml-2">${record.cost}</span>
                </div>
              )}
              {record.next_due_date && (
                <div>
                  <span className="font-medium text-gray-700">Next Due:</span>
                  <span className="text-gray-600 ml-2">
                    {new Date(record.next_due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {record.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{record.notes}</p>
              </div>
            )}

            {record.recorded_by_name && (
              <div className="mt-2 text-xs text-gray-500">
                Recorded by {record.recorded_by_name} on{' '}
                {new Date(record.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(healthRecords || []).length === 0 && (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No health records</h3>
          <p className="text-gray-500 mb-4">
            Start tracking {animalName}&apos;s health by adding records
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Health Record
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingRecord) && (
        <HealthRecordModal
          record={editingRecord}
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
    </div>
  );
}

// Health Record Modal Component
interface HealthRecordModalProps {
  record?: HealthRecord | null;
  onClose: () => void;
  onSubmit: (data: unknown) => void;
  isLoading: boolean;
}

function HealthRecordModal({ record, onClose, onSubmit, isLoading }: HealthRecordModalProps) {
  const [formData, setFormData] = useState({
    record_date: record?.record_date || new Date().toISOString().split('T')[0],
    record_type: record?.record_type || '',
    vet_name: record?.vet_name || '',
    diagnosis: record?.diagnosis || '',
    treatment: record?.treatment || '',
    medication: record?.medication || '',
    dosage: record?.dosage || '',
    cost: record?.cost || '',
    next_due_date: record?.next_due_date || '',
    vet_contact: record?.vet_contact || '',
    notes: record?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost.toString()) : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {record ? 'Edit Health Record' : 'Add Health Record'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.record_date}
                  onChange={e => setFormData(prev => ({ ...prev, record_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Type *
                </label>
                <select
                  required
                  value={formData.record_type}
                  onChange={e => setFormData(prev => ({ ...prev, record_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  {recordTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian</label>
                <input
                  type="text"
                  value={formData.vet_name}
                  onChange={e => setFormData(prev => ({ ...prev, vet_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vet Contact</label>
                <input
                  type="text"
                  value={formData.vet_contact}
                  onChange={e => setFormData(prev => ({ ...prev, vet_contact: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={e => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
                <input
                  type="text"
                  value={formData.treatment}
                  onChange={e => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
                <input
                  type="text"
                  value={formData.medication}
                  onChange={e => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={e => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={formData.next_due_date}
                  onChange={e => setFormData(prev => ({ ...prev, next_due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes about this health record..."
              />
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
                {isLoading ? 'Saving...' : record ? 'Update Record' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
