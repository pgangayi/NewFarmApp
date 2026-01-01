import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Bell, Truck, BarChart3, Plus, Warehouse } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAuth } from '../hooks/AuthContext';
import { useToast } from '../components/ui/use-toast';
import {
  useInventory,
  useInventoryLowStock,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useFarmWithSelection,
  apiClient,
} from '../api';
import type { Farm, InventoryItem } from '../api';
import { InventoryOverview } from '../components/inventory/InventoryOverview';
import { InventoryList } from '../components/inventory/InventoryList';
import { InventoryAlerts } from '../components/inventory/InventoryAlerts';
import { SupplierList } from '../components/inventory/SupplierList';
import { InventoryAnalytics } from '../components/inventory/InventoryAnalytics';
import { InventoryItemModal } from '../components/inventory/InventoryItemModal';
import { Supplier, InventoryAlert, InventoryFormData } from '../components/inventory/types';

export function InventoryPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<
    'overview' | 'items' | 'alerts' | 'suppliers' | 'analytics'
  >('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Use shared inventory hooks
  const { currentFarm } = useFarmWithSelection();
  const { data: inventoryItems = [], isLoading, error } = useInventory(currentFarm?.id);

  const { data: lowStockInventoryItems = [] } = useInventoryLowStock(currentFarm?.id);

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  // Suppliers and alerts via apiClient
  const { data: suppliers } = useQuery({
    queryKey: ['inventory', 'suppliers', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return [] as Supplier[];
      return apiClient.get<Supplier[]>('/api/inventory/suppliers');
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
  });

  const { data: alerts } = useQuery({
    queryKey: ['inventory', 'alerts', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return [] as InventoryAlert[];
      return apiClient.get<InventoryAlert[]>('/api/inventory/alerts');
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
  });

  const handleCreateItem = async (itemData: InventoryFormData) => {
    try {
      await createMutation.mutateAsync({
        ...itemData,
        farm_id: currentFarm.id,
      } as any);
      setShowCreateForm(false);
      toast('Item created successfully', 'success');
    } catch (err) {
      console.error('Create item failed', err);
      toast('Failed to create item', 'error');
    }
  };

  const handleUpdateItem = async (itemData: InventoryFormData) => {
    try {
      if (!editingItem) return;
      await updateMutation.mutateAsync({
        id: editingItem.id,
        data: itemData as any,
      });
      setEditingItem(null);
      toast('Item updated successfully', 'success');
    } catch (err) {
      console.error('Update item failed', err);
      toast('Failed to update item', 'error');
    }
  };

  const handleResolveAlert = async (alert: InventoryAlert, resolved: boolean) => {
    try {
      await apiClient.put('/api/inventory/alerts', {
        alert_id: alert.id,
        resolved,
        notes: `Alert ${resolved ? 'resolved' : 'reopened'} by user`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] });
    } catch (err) {
      console.error('Resolve alert failed', err);
    }
  };

  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved).length || 0;

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view inventory.</p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading inventory</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your farm supplies, track stock levels, and optimize procurement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setViewMode('analytics')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: Package },
              { key: 'items', label: 'Items', icon: Warehouse },
              { key: 'alerts', label: 'Alerts', icon: Bell },
              { key: 'suppliers', label: 'Suppliers', icon: Truck },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setViewMode(key as 'items' | 'analytics' | 'overview' | 'alerts' | 'suppliers')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === 'alerts' && unresolvedAlerts > 0 && (
                  <Badge className="bg-red-100 text-red-800">{unresolvedAlerts}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <InventoryOverview
            inventoryItems={inventoryItems}
            alerts={alerts || []}
            lowStockItems={lowStockInventoryItems}
            onResolveAlert={handleResolveAlert}
            onReorder={item => setEditingItem(item)}
          />
        )}

        {/* Items Tab */}
        {viewMode === 'items' && (
          <InventoryList
            inventoryItems={inventoryItems}
            onEdit={setEditingItem}
            onView={item => console.log('View item', item)}
            onCreate={() => setShowCreateForm(true)}
          />
        )}

        {/* Alerts Tab */}
        {viewMode === 'alerts' && (
          <InventoryAlerts alerts={alerts || []} onResolveAlert={handleResolveAlert} />
        )}

        {/* Suppliers Tab */}
        {viewMode === 'suppliers' && (
          <SupplierList
            suppliers={suppliers || []}
            onAddSupplier={() => console.log('Add supplier')}
            onEditSupplier={supplier => console.log('Edit supplier', supplier)}
          />
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && <InventoryAnalytics inventoryItems={inventoryItems} />}

        {/* Create/Edit Item Modal */}
        {(showCreateForm || editingItem) && (
          <InventoryItemModal
            item={editingItem}
            farms={currentFarm ? [currentFarm as unknown as Farm] : []}
            suppliers={suppliers || []}
            onSave={editingItem ? handleUpdateItem : handleCreateItem}
            onClose={() => {
              setShowCreateForm(false);
              setEditingItem(null);
            }}
            isLoading={createMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

export default InventoryPage;
