import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';
import type { InventoryItem } from '../../api/types';
import type { InventoryAlert } from './types';

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
  const totalItems = inventoryItems.length;
  const totalValue = inventoryItems.reduce(
    (acc, item) => acc + item.quantity * (item.cost_per_unit || 0),
    0
  );
  const lowStockCount = lowStockItems.length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard
          title="Total Items"
          value={totalItems.toString()}
          icon={Package}
          color="text-blue-600"
        />
        <OverviewCard
          title="Total Value"
          value={`$${totalValue.toLocaleString()}`}
          icon={CheckCircle} // Using generic icon
          color="text-green-600"
        />
        <OverviewCard
          title="Low Stock"
          value={lowStockCount.toString()}
          icon={AlertTriangle}
          color="text-yellow-600"
        />
        <OverviewCard
          title="Active Alerts"
          value={activeAlerts.toString()}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items are currently low on stock.</p>
            ) : (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 bg-red-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-red-900">{item.name}</p>
                      <p className="text-xs text-red-700">
                        Quantity: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => onReorder(item)}
                      className="text-xs bg-white text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Reorder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No system alerts.</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-2 rounded border ${alert.resolved ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}
                  >
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{alert.message}</p>
                      {!alert.resolved && (
                        <button
                          onClick={() => onResolveAlert(alert, true)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 bg-gray-50 rounded-full ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
