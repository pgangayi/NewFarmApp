import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { InventoryItem } from './types';

interface InventoryAnalyticsProps {
  inventoryItems: InventoryItem[];
}

export function InventoryAnalytics({ inventoryItems }: InventoryAnalyticsProps) {
  const totalItems = inventoryItems.length;
  const criticalItems = inventoryItems.filter(item => item.stock_status === 'critical').length;
  const lowStockItemsCount = inventoryItems.filter(item => item.stock_status === 'low').length;
  const categories = [...new Set(inventoryItems.map(item => item.category).filter(Boolean))];

  return (
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
                  <div key={category as string} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category as string}</span>
                    <span className="text-sm font-medium">${categoryValue.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
