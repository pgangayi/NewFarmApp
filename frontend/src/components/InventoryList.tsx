import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/domains/InventoryService';
import { InventoryItem } from '../api/types';

interface InventoryListProps {
  farmId: string;
}

export function InventoryList({ farmId }: InventoryListProps) {
  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory', farmId],
    queryFn: async () => {
      // Logic for using service
      // Note: Component was fetching /api/inventory/items previously.
      // InventoryService uses /api/inventory (from config).
      // If this fails, config needs update to /inventory/items.
      return InventoryService.getInventoryByFarm(farmId);
    },
    enabled: !!farmId,
  });

  if (isLoading) {
    return <div>Loading inventory...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error loading inventory: {(error as Error).message}</div>;
  }

  const inventoryItems = items || [];

  return (
    <div className="inventory-list">
      <h2 className="text-xl font-semibold mb-4">Inventory Items</h2>

      <div className="grid gap-4">
        {inventoryItems.map(item => (
          <div key={item.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                {/* SKU removed as it is not in InventoryItem type */}
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    item.reorder_level && item.quantity <= item.reorder_level
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {item.quantity} {item.unit}
                </p>
                {item.reorder_level && (
                  <p className="text-sm text-gray-500">Threshold: {item.reorder_level}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {inventoryItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">No inventory items found.</div>
      )}
    </div>
  );
}
