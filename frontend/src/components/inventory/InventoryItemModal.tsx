import { useState } from 'react';
import { Button } from '../ui/button';
import { InventoryFormData, InventoryItem, Supplier } from './types';
import { Farm } from '../../types/entities';

interface InventoryItemModalProps {
  item?: InventoryItem | null;
  farms: Farm[];
  suppliers: Supplier[];
  onSave: (data: InventoryFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function InventoryItemModal({
  item,
  farms,
  suppliers,
  onSave,
  onClose,
  isLoading,
}: InventoryItemModalProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    farm_id:
      item?.farm_id ||
      (farms?.[0]?.id
        ? typeof farms[0].id === 'string'
          ? parseInt(farms[0].id)
          : farms[0].id
        : 1),
    name: item?.name || '',
    sku: item?.sku || '',
    qty: item?.qty || 0,
    unit: item?.unit || 'units',
    reorder_threshold: item?.reorder_threshold || 0,
    category: item?.category || '',
    supplier_info: item?.supplier_info || '',
    storage_requirements: item?.storage_requirements || '',
    expiration_date: item?.expiration_date || '',
    quality_grade: item?.quality_grade || '',
    minimum_order_quantity: item?.minimum_order_quantity || undefined,
    maximum_order_quantity: item?.maximum_order_quantity || undefined,
    current_cost_per_unit: item?.current_cost_per_unit || undefined,
    preferred_supplier_id: item?.preferred_supplier_id || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={formData.farm_id}
                  onChange={e => setFormData({ ...formData, farm_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {farms.map(farm => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Seeds">Seeds</option>
                  <option value="Fertilizer">Fertilizer</option>
                  <option value="Pesticides">Pesticides</option>
                  <option value="Tools">Tools</option>
                  <option value="Feed">Feed</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Supplies">Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.qty}
                  onChange={e => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorder_threshold}
                  onChange={e =>
                    setFormData({ ...formData, reorder_threshold: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Unit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_cost_per_unit}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      current_cost_per_unit: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={formData.quality_grade}
                  onChange={e => setFormData({ ...formData, quality_grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="Premium">Premium</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Supplier
                </label>
                <select
                  value={formData.preferred_supplier_id}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      preferred_supplier_id: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Requirements
              </label>
              <textarea
                value={formData.storage_requirements}
                onChange={e => setFormData({ ...formData, storage_requirements: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Temperature, humidity, special handling requirements..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
