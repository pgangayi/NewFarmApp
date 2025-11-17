import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useInventory, useLowStockItems } from '../hooks/useInventory';
import { useApiClient } from '../hooks/useApiClient';
import { useFarm } from '../hooks/useFarm';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  Truck,
  Calendar,
  Bell,
  BarChart3,
  ShoppingCart,
  Warehouse,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface InventoryItem {
  id: number;
  farm_id: number;
  name: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold: number;
  category?: string;
  supplier_info?: string;
  storage_requirements?: string;
  expiration_date?: string;
  quality_grade?: string;
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  current_cost_per_unit?: number;
  preferred_supplier_id?: number;
  stock_status: 'normal' | 'low' | 'critical';
  farm_name: string;
  transaction_count?: number;
  total_usage?: number;
  total_additions?: number;
  latest_cost_per_unit?: number;
  avg_cost_per_unit?: number;
  alerts?: InventoryAlert[];
  cost_history?: CostHistory[];
  created_at: string;
  updated_at?: string;
}

interface InventoryAlert {
  id: number;
  inventory_item_id: number;
  alert_type: string;
  alert_date: string;
  current_quantity: number;
  threshold_quantity: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_date?: string;
  notes?: string;
  item_name?: string;
  farm_name?: string;
}

interface CostHistory {
  id: number;
  inventory_item_id: number;
  cost_date: string;
  unit_cost: number;
  supplier_id?: number;
  quantity_purchased?: number;
  total_cost: number;
  cost_reason?: string;
  notes?: string;
}

interface Supplier {
  id: number;
  farm_id: number;
  supplier_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days?: number;
  reliability_rating?: number;
  product_categories?: string;
  pricing_structure?: string;
  delivery_schedule?: string;
  active: boolean;
  notes?: string;
  farm_name?: string;
  total_orders?: number;
  completed_orders?: number;
}

interface InventoryFormData {
  farm_id: number;
  name: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold: number;
  category?: string;
  supplier_info?: string;
  storage_requirements?: string;
  expiration_date?: string;
  quality_grade?: string;
  minimum_order_quantity?: number;
  maximum_order_quantity?: number;
  current_cost_per_unit?: number;
  preferred_supplier_id?: number;
}

export function InventoryPage() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const apiClient = useApiClient();
  const { currentFarm } = useFarm();
  const [viewMode, setViewMode] = useState<
    'overview' | 'items' | 'alerts' | 'suppliers' | 'analytics'
  >('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<InventoryAlert | null>(null);

  // Use shared inventory hooks
  const { items: inventoryItems, isLoading, error, refetch, createItemAsync } = useInventory();
  const { data: lowStockItems } = useLowStockItems();

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

  // Use createItemAsync from hook so we can await and show errors

  const handleCreateItem = async (itemData: InventoryFormData) => {
    try {
      await createItemAsync(itemData);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Create item failed', err);
      // TODO: surface error to UI (toast/modal)
    }
  };

  const handleUpdateItem = async (itemData: InventoryFormData) => {
    try {
      // For now call API directly via apiClient (could be added to hook)
      if (!editingItem) return;
      await apiClient.put('/api/inventory', { id: editingItem.id, ...itemData });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingItem(null);
    } catch (err) {
      console.error('Update item failed', err);
    }
  };

  const handleResolveAlert = async (alert: InventoryAlert, resolved: boolean, notes?: string) => {
    try {
      await apiClient.put('/api/inventory/alerts', {
        alert_id: alert.id,
        resolved,
        notes: notes || `Alert ${resolved ? 'resolved' : 'reopened'} by user`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] });
      setSelectedAlert(null);
    } catch (err) {
      console.error('Resolve alert failed', err);
    }
  };

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

  // Calculate summary statistics
  const totalItems = inventoryItems?.length || 0;
  const totalValue =
    inventoryItems?.reduce((sum, item) => sum + item.qty * (item.current_cost_per_unit || 0), 0) ||
    0;
  const criticalItems =
    inventoryItems?.filter(item => item.stock_status === 'critical').length || 0;
  const lowStockItemsCount =
    inventoryItems?.filter(item => item.stock_status === 'low').length || 0;
  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved).length || 0;

  // Filter items based on search and category
  const filteredItems =
    inventoryItems?.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  // Get unique categories for filter dropdown
  const categories = [...new Set(inventoryItems?.map(item => item.category).filter(Boolean) || [])];

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
                onClick={() => setViewMode(key as unknown)}
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
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <p className="text-xs text-muted-foreground">Across all farms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Current inventory value</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{criticalItems}</div>
                  <p className="text-xs text-muted-foreground">Low stock items</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{unresolvedAlerts}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts */}
            {unresolvedAlerts > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Active Alerts ({unresolvedAlerts})
                  </CardTitle>
                  <CardDescription>Items requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts
                      ?.filter(alert => !alert.resolved)
                      .slice(0, 5)
                      .map(alert => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle
                              className={`h-4 w-4 ${
                                alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium">{alert.item_name}</p>
                              <p className="text-xs text-gray-600">
                                {alert.alert_type === 'low_stock' ? 'Low stock' : alert.alert_type}{' '}
                                - Qty: {alert.current_quantity} / Threshold:{' '}
                                {alert.threshold_quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                            >
                              {alert.severity}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert, true)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Items */}
            {lowStockItems && lowStockItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Low Stock Items ({lowStockItems.length})
                  </CardTitle>
                  <CardDescription>Items below reorder threshold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockItems.slice(0, 6).map(item => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <Badge
                            variant={item.stock_status === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {item.stock_status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          Current: {item.qty} {item.unit}
                        </p>
                        <p className="text-xs text-gray-600">
                          Threshold: {item.reorder_threshold} {item.unit}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => setEditingItem(item)}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest inventory transactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start by adding inventory items or transactions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Items Tab */}
        {viewMode === 'items' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost/Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.sku && (
                              <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {item.qty} {item.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Threshold: {item.reorder_threshold}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${(item.current_cost_per_unit || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: ${(item.qty * (item.current_cost_per_unit || 0)).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              item.stock_status === 'critical'
                                ? 'destructive'
                                : item.stock_status === 'low'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {item.stock_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No items found</h4>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedCategory
                      ? 'Try adjusting your search or filter criteria'
                      : 'Start by adding your first inventory item'}
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {viewMode === 'alerts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Inventory Alerts</h2>
              <Badge variant={unresolvedAlerts > 0 ? 'destructive' : 'default'}>
                {unresolvedAlerts} Unresolved
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {alerts?.map(alert => (
                <Card
                  key={alert.id}
                  className={`${
                    alert.resolved ? 'opacity-60' : ''
                  } ${alert.severity === 'critical' ? 'border-red-200' : 'border-yellow-200'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                          }`}
                        />
                        <div>
                          <h4 className="font-medium">{alert.item_name}</h4>
                          <p className="text-sm text-gray-600">
                            {alert.alert_type === 'low_stock'
                              ? 'Low Stock Alert'
                              : alert.alert_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            Current: {alert.current_quantity} / Threshold:{' '}
                            {alert.threshold_quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        >
                          {alert.severity}
                        </Badge>
                        <Badge variant={alert.resolved ? 'default' : 'outline'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                        {!alert.resolved && (
                          <Button size="sm" onClick={() => handleResolveAlert(alert, true)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    {alert.notes && <div className="mt-2 text-sm text-gray-600">{alert.notes}</div>}
                  </CardContent>
                </Card>
              ))}

              {(!alerts || alerts.length === 0) && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No alerts</h4>
                  <p className="text-gray-600">All inventory items are within acceptable ranges</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {viewMode === 'suppliers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Suppliers</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers?.map(supplier => (
                <Card key={supplier.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{supplier.supplier_name}</CardTitle>
                    <CardDescription>
                      {supplier.contact_person && `Contact: ${supplier.contact_person}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {supplier.contact_phone && (
                        <p className="text-sm text-gray-600">📞 {supplier.contact_phone}</p>
                      )}
                      {supplier.contact_email && (
                        <p className="text-sm text-gray-600">📧 {supplier.contact_email}</p>
                      )}
                      {supplier.lead_time_days && (
                        <p className="text-sm text-gray-600">
                          ⏱️ Lead time: {supplier.lead_time_days} days
                        </p>
                      )}
                      {supplier.reliability_rating && (
                        <p className="text-sm text-gray-600">
                          ⭐ Reliability: {supplier.reliability_rating}/10
                        </p>
                      )}
                      {supplier.total_orders !== undefined && (
                        <p className="text-sm text-gray-600">
                          📦 Orders: {supplier.completed_orders || 0}/{supplier.total_orders}{' '}
                          completed
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={supplier.active ? 'default' : 'secondary'}>
                        {supplier.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!suppliers || suppliers.length === 0) && (
                <div className="col-span-full text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No suppliers</h4>
                  <p className="text-gray-600 mb-4">
                    Add suppliers to manage your procurement relationships
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Supplier
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Inventory Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Critical Stock</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${(criticalItems / totalItems) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{criticalItems}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low Stock</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${(lowStockItemsCount / totalItems) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{lowStockItemsCount}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Normal Stock</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${((totalItems - criticalItems - lowStockItemsCount) / totalItems) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {totalItems - criticalItems - lowStockItemsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Categories by Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map(category => {
                      const categoryItems =
                        inventoryItems?.filter(item => item.category === category) || [];
                      const categoryValue = categoryItems.reduce(
                        (sum, item) => sum + item.qty * (item.current_cost_per_unit || 0),
                        0
                      );
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-sm font-medium">
                            ${categoryValue.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Create/Edit Item Modal */}
        {(showCreateForm || editingItem) && (
          <InventoryItemModal
            item={editingItem}
            farms={farms || []}
            suppliers={suppliers || []}
            onSave={editingItem ? handleUpdateItem : handleCreateItem}
            onClose={() => {
              setShowCreateForm(false);
              setEditingItem(null);
            }}
            isLoading={createItemMutation.isPending || updateItemMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

interface InventoryItemModalProps {
  item?: InventoryItem | null;
  farms: unknown[];
  suppliers: Supplier[];
  onSave: (data: InventoryFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

function InventoryItemModal({
  item,
  farms,
  suppliers,
  onSave,
  onClose,
  isLoading,
}: InventoryItemModalProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    farm_id: item?.farm_id || farms[0]?.id || 1,
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

export default InventoryPage;
