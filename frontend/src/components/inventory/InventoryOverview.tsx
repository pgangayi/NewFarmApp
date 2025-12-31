import { Package, DollarSign, AlertTriangle, Bell, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { InventoryItem, InventoryAlert } from './types';

interface InventoryOverviewProps {
  inventoryItems: InventoryItem[];
  alerts: InventoryAlert[];
  lowStockItems: InventoryItem[];
  onResolveAlert: (alert: InventoryAlert, resolved: boolean) => void;
  onReorder: (item: InventoryItem) => void;
}

export function InventoryOverview({
  inventoryItems,
  alerts,
  lowStockItems,
  onResolveAlert,
  onReorder,
}: InventoryOverviewProps) {
  // Calculate summary statistics
  const totalItems = inventoryItems?.length || 0;
  const totalValue =
    inventoryItems?.reduce((sum, item) => sum + item.qty * (item.current_cost_per_unit || 0), 0) ||
    0;
  const criticalItems =
    inventoryItems?.filter(item => item.stock_status === 'critical').length || 0;
  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved).length || 0;
  const categories = [...new Set(inventoryItems?.map(item => item.category).filter(Boolean) || [])];

  return (
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
                          {alert.alert_type === 'low_stock' ? 'Low stock' : alert.alert_type} - Qty:{' '}
                          {alert.current_quantity} / Threshold: {alert.threshold_quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveAlert(alert, true)}
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
                    <Badge variant={item.stock_status === 'critical' ? 'destructive' : 'secondary'}>
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
                    onClick={() => onReorder(item)}
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

      {/* Top Categories */}
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
                  <span className="text-sm font-medium">${categoryValue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
