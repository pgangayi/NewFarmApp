import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Plus, TrendingUp, DollarSign, Calendar, Award } from 'lucide-react';

interface ProductionRecord {
  id: number;
  animal_id: string;
  production_date: string;
  production_type: string;
  quantity: number;
  unit: string;
  quality_grade?: string;
  price_per_unit?: number;
  total_value?: number;
  market_destination?: string;
  storage_location?: string;
  notes?: string;
  animal_name: string;
  recorded_by_name?: string;
  created_at: string;
}

interface AnimalProductionTrackerProps {
  animalId: string;
  animalName: string;
  productionType?: string;
}

const productionTypeOptions = [
  { value: 'milk', label: 'Milk', unit: 'liters', icon: '🥛' },
  { value: 'eggs', label: 'Eggs', unit: 'pieces', icon: '🥚' },
  { value: 'wool', label: 'Wool', unit: 'kg', icon: '🧶' },
  { value: 'meat', label: 'Meat', unit: 'kg', icon: '🥩' },
  { value: 'offspring', label: 'Offspring', unit: 'head', icon: '🐣' },
];

const qualityGrades = [
  { value: '', label: 'No Grade' },
  { value: 'premium', label: 'Premium' },
  { value: 'grade_a', label: 'Grade A' },
  { value: 'grade_b', label: 'Grade B' },
  { value: 'grade_c', label: 'Grade C' },
  { value: 'standard', label: 'Standard' },
];

export function AnimalProductionTracker({
  animalId,
  animalName,
  productionType,
}: AnimalProductionTrackerProps) {
  const { getAuthHeaders } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const queryClient = useQueryClient();

  // Fetch production records
  const {
    data: productionRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['animal-production-records', animalId, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/animals/${animalId}/production?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch production records');
      }

      return await response.json();
    },
    enabled: !!animalId,
  });

  // Calculate analytics
  const analytics = React.useMemo(() => {
    if (!productionRecords) return null;

    const records = Array.isArray(productionRecords) ? productionRecords : [];
    const totalQuantity = records.reduce((sum, record) => sum + (record.quantity || 0), 0);
    const totalValue = records.reduce((sum, record) => sum + (record.total_value || 0), 0);
    const avgQuantity = records.length > 0 ? totalQuantity / records.length : 0;

    // Group by production type
    const byType = records.reduce(
      (acc, record) => {
        const type = record.production_type;
        if (!acc[type]) {
          acc[type] = { quantity: 0, value: 0, count: 0 };
        }
        acc[type].quantity += record.quantity || 0;
        acc[type].value += record.total_value || 0;
        acc[type].count += 1;
        return acc;
      },
      {} as Record<string, { quantity: number; value: number; count: number }>
    );

    return {
      totalQuantity,
      totalValue,
      avgQuantity,
      recordCount: records.length,
      byType,
    };
  }, [productionRecords]);

  // Create production record mutation
  const createMutation = useMutation({
    mutationFn: async (recordData: unknown) => {
      const response = await fetch(`/api/animals/${animalId}/production`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create production record');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-production-records', animalId] });
      setShowAddModal(false);
    },
  });

  // Update production record mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...recordData }: unknown) => {
      const response = await fetch(`/api/animals/${animalId}/production/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update production record');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-production-records', animalId] });
      setEditingRecord(null);
    },
  });

  // Delete production record mutation
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const response = await fetch(`/api/animals/${animalId}/production/${recordId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete production record');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal-production-records', animalId] });
    },
  });

  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
  };

  const handleDelete = async (record: ProductionRecord) => {
    if (window.confirm('Are you sure you want to delete this production record?')) {
      try {
        await deleteMutation.mutateAsync(record.id.toString());
      } catch (error) {
        console.error('Failed to delete production record:', error);
      }
    }
  };

  const getProductionTypeIcon = (type: string) => {
    const option = productionTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : '📦';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        Error loading production records: {error.message}
      </div>
    );
  }

  const records = Array.isArray(productionRecords) ? productionRecords : [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Production Records</h3>
          <p className="text-sm text-gray-600">{animalName}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Production</p>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.totalQuantity.toFixed(1)}
                </p>
                <p className="text-xs text-green-600">units</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Value</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(analytics.totalValue)}
                </p>
                <p className="text-xs text-blue-600">revenue</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Average/Day</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analytics.avgQuantity.toFixed(1)}
                </p>
                <p className="text-xs text-purple-600">units</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Records</p>
                <p className="text-2xl font-bold text-orange-900">{analytics.recordCount}</p>
                <p className="text-xs text-orange-600">total entries</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Production Records List */}
      <div className="space-y-4">
        {records.map((record: ProductionRecord) => (
          <div
            key={record.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getProductionTypeIcon(record.production_type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">{record.production_type}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(record.production_date).toLocaleDateString()}
                  </p>
                </div>
                {record.quality_grade && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.quality_grade === 'premium'
                        ? 'bg-gold-100 text-gold-800'
                        : record.quality_grade === 'grade_a'
                          ? 'bg-green-100 text-green-800'
                          : record.quality_grade === 'grade_b'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {record.quality_grade.replace('_', ' ').toUpperCase()}
                  </span>
                )}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium text-gray-700">Quantity:</span>
                <span className="text-gray-600 ml-2">
                  {record.quantity} {record.unit}
                </span>
              </div>
              {record.price_per_unit && (
                <div>
                  <span className="font-medium text-gray-700">Price/Unit:</span>
                  <span className="text-gray-600 ml-2">
                    {formatCurrency(record.price_per_unit)}
                  </span>
                </div>
              )}
              {record.total_value && (
                <div>
                  <span className="font-medium text-gray-700">Total Value:</span>
                  <span className="text-gray-600 ml-2 font-semibold">
                    {formatCurrency(record.total_value)}
                  </span>
                </div>
              )}
              {record.market_destination && (
                <div>
                  <span className="font-medium text-gray-700">Destination:</span>
                  <span className="text-gray-600 ml-2">{record.market_destination}</span>
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
      {records.length === 0 && (
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
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No production records</h3>
          <p className="text-gray-500 mb-4">
            Start tracking {animalName}&apos;s production by adding records
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Production Record
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingRecord) && (
        <ProductionRecordModal
          record={editingRecord}
          productionType={productionType}
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

// Production Record Modal Component
interface ProductionRecordModalProps {
  record?: ProductionRecord | null;
  productionType?: string;
  onClose: () => void;
  onSubmit: (data: unknown) => void;
  isLoading: boolean;
}

function ProductionRecordModal({
  record,
  productionType,
  onClose,
  onSubmit,
  isLoading,
}: ProductionRecordModalProps) {
  const [formData, setFormData] = useState({
    production_date: record?.production_date || new Date().toISOString().split('T')[0],
    production_type: record?.production_type || productionType || '',
    quantity: record?.quantity || '',
    unit: record?.unit || '',
    quality_grade: record?.quality_grade || '',
    price_per_unit: record?.price_per_unit || '',
    market_destination: record?.market_destination || '',
    storage_location: record?.storage_location || '',
    notes: record?.notes || '',
  });

  // Auto-set unit when production type changes
  React.useEffect(() => {
    if (formData.production_type && !record) {
      const option = productionTypeOptions.find(opt => opt.value === formData.production_type);
      if (option) {
        setFormData(prev => ({ ...prev, unit: option.unit }));
      }
    }
  }, [formData.production_type, record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      quantity: formData.quantity ? parseFloat(formData.quantity.toString()) : undefined,
      price_per_unit: formData.price_per_unit
        ? parseFloat(formData.price_per_unit.toString())
        : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {record ? 'Edit Production Record' : 'Add Production Record'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.production_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, production_date: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Type *
                </label>
                <select
                  required
                  value={formData.production_type}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, production_type: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Type</option>
                  {productionTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={formData.quality_grade}
                  onChange={e => setFormData(prev => ({ ...prev, quality_grade: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {qualityGrades.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={e => setFormData(prev => ({ ...prev, price_per_unit: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market Destination
                </label>
                <input
                  type="text"
                  value={formData.market_destination}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, market_destination: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.storage_location}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, storage_location: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Additional notes about this production record..."
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
