import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useFarm } from '../hooks/useFarm';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  Loader,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  unit: string;
  qty: number;
  reorder_threshold?: number;
  current_cost_per_unit?: number;
  supplier_info?: string;
  stock_status?: 'critical' | 'low' | 'normal';
  farm_id: string;
}

interface CreateInventoryForm {
  name: string;
  category: string;
  sku: string;
  qty: number;
  unit: string;
  reorder_threshold: number;
  current_cost_per_unit?: number;
  supplier_info?: string;
}

export function InventoryPage() {
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const { currentFarm } = useFarm();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<CreateInventoryForm>({
    name: '',
    category: '',
    sku: '',
    qty: 0,
    unit: 'units',
    reorder_threshold: 0,
    current_cost_per_unit: 0,
    supplier_info: ''
  });

  // Fetch inventory items from API
  const { data: items = [], isLoading, error, refetch } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return [];
      
      const response = await fetch('/api/inventory-enhanced', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      
      return await response.json();
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
    staleTime: 30000
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: CreateInventoryForm) => {
      const response = await fetch('/api/inventory-enhanced', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          farm_id: currentFarm?.id,
          ...itemData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }

      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setFormData({
        name: '',
        category: '',
        sku: '',
        qty: 0,
        unit: 'units',
        reorder_threshold: 0,
        current_cost_per_unit: 0,
        supplier_info: ''
      });
      setShowCreateForm(false);
      setFormError('');
    },
    onError: (error: any) => {
      setFormError(error.message || 'Failed to create item');
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (itemData: Partial<CreateInventoryForm> & { id: string }) => {
      const { id, ...updates } = itemData;
      const response = await fetch('/api/inventory-enhanced', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...updates })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update item');
      }

      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setFormData({
        name: '',
        category: '',
        sku: '',
        qty: 0,
        unit: 'units',
        reorder_threshold: 0,
        current_cost_per_unit: 0,
        supplier_info: ''
      });
      setShowEditForm(false);
      setSelectedItem(null);
      setFormError('');
    },
    onError: (error: any) => {
      setFormError(error.message || 'Failed to update item');
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/inventory-enhanced?id=${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setShowDeleteConfirm(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      setFormError(error.message || 'Failed to delete item');
    }
  });

  // Authentication check
  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access inventory management.</p>
        </div>
      </div>
    );
  }

  // Farm selection check
  if (!currentFarm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Farm Selected</h2>
          <p className="text-gray-600 mb-4">Please select or create a farm to manage inventory.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Loader className="h-12 w-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !items.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Inventory</h2>
          <p className="text-gray-600 mb-4">Failed to load inventory items.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories: string[] = [
    'all',
    ...Array.from(new Set(
      items
        .map((item) => item.category)
        .filter((cat): cat is string => !!cat)
    ))
  ];

  // Get low stock items count
  const lowStockCount = items.filter((item) => 
    item.stock_status === 'critical' || item.stock_status === 'low'
  ).length;
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-sm text-gray-600">{currentFarm.name} • {items.length} items</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lowStockCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">{lowStockCount} low stock</span>
                </div>
              )}
              <button
                onClick={() => {
                  setFormError('');
                  setFormData({
                    name: '',
                    category: '',
                    sku: '',
                    qty: 0,
                    unit: 'units',
                    reorder_threshold: 0,
                    current_cost_per_unit: 0,
                    supplier_info: ''
                  });
                  setShowCreateForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border-b py-4 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Add your first inventory item to get started'}
            </p>
            {!(searchTerm || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setFormError('');
                  setFormData({
                    name: '',
                    category: '',
                    sku: '',
                    qty: 0,
                    unit: 'units',
                    reorder_threshold: 0,
                    current_cost_per_unit: 0,
                    supplier_info: ''
                  });
                  setShowCreateForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.stock_status === 'critical' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Critical
                        </span>
                      )}
                      {item.stock_status === 'low' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                        <p className="font-medium text-gray-900">{item.category || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">SKU</p>
                        <p className="font-medium text-gray-900">{item.sku || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Quantity</p>
                        <p className="font-medium text-gray-900">{item.qty} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Unit Cost</p>
                        <p className="font-medium text-gray-900">
                          {item.current_cost_per_unit ? `$${item.current_cost_per_unit.toFixed(2)}` : '-'}
                        </p>
                      </div>
                    </div>
                    {item.supplier_info && (
                      <p className="text-sm text-gray-600 mt-2">Supplier: {item.supplier_info}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setFormData({
                          name: item.name,
                          category: item.category || '',
                          sku: item.sku || '',
                          qty: item.qty,
                          unit: item.unit || 'units',
                          reorder_threshold: item.reorder_threshold || 0,
                          current_cost_per_unit: item.current_cost_per_unit || 0,
                          supplier_info: item.supplier_info || ''
                        });
                        setFormError('');
                        setShowEditForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Item Modal */}
      {showCreateForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !createItemMutation.isPending && setShowCreateForm(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Inventory Item</h2>
              <button
                onClick={() => !createItemMutation.isPending && setShowCreateForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Nitrogen Fertilizer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createItemMutation.isPending}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Fertilizer, Seeds, Tools"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createItemMutation.isPending}
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., SKU-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createItemMutation.isPending}
                  />
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      disabled={createItemMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., kg, L, units"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      disabled={createItemMutation.isPending}
                    />
                  </div>
                </div>

                {/* Reorder Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_threshold}
                    onChange={(e) => setFormData({ ...formData, reorder_threshold: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createItemMutation.isPending}
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    value={formData.current_cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, current_cost_per_unit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createItemMutation.isPending}
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_info}
                    onChange={(e) => setFormData({ ...formData, supplier_info: e.target.value })}
                    placeholder="e.g., ABC Suppliers"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createItemMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => !createItemMutation.isPending && setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={createItemMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!formData.name || !formData.category) {
                    setFormError('Item name and category are required');
                    return;
                  }
                  createItemMutation.mutate(formData);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={createItemMutation.isPending}
              >
                {createItemMutation.isPending && (
                  <Loader className="h-4 w-4 animate-spin" />
                )}
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditForm && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !updateItemMutation.isPending && setShowEditForm(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Item: {selectedItem.name}</h2>
              <button
                onClick={() => !updateItemMutation.isPending && setShowEditForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={updateItemMutation.isPending}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={updateItemMutation.isPending}
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={updateItemMutation.isPending}
                  />
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      disabled={updateItemMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      disabled={updateItemMutation.isPending}
                    />
                  </div>
                </div>

                {/* Reorder Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.reorder_threshold}
                    onChange={(e) => setFormData({ ...formData, reorder_threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={updateItemMutation.isPending}
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    value={formData.current_cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, current_cost_per_unit: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={updateItemMutation.isPending}
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_info}
                    onChange={(e) => setFormData({ ...formData, supplier_info: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={updateItemMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => !updateItemMutation.isPending && setShowEditForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={updateItemMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateItemMutation.mutate({
                    id: selectedItem.id,
                    ...formData
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={updateItemMutation.isPending}
              >
                {updateItemMutation.isPending && (
                  <Loader className="h-4 w-4 animate-spin" />
                )}
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !deleteItemMutation.isPending && setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Delete Item?</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{selectedItem.name}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => !deleteItemMutation.isPending && setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={deleteItemMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteItemMutation.mutate(selectedItem.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deleteItemMutation.isPending}
              >
                {deleteItemMutation.isPending && (
                  <Loader className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;