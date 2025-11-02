import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface InventoryItem {
  id: number;
  name: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold: number;
  created_at: string;
}

interface InventoryListProps {
  farmId: string;
}

export function InventoryList({ farmId }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    if (farmId) {
      loadInventory();
    }
  }, [farmId]);

  const loadInventory = async () => {
    try {
      const response = await fetch(`/api/inventory?farm_id=${farmId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="inventory-list">
      <h2 className="text-xl font-semibold mb-4">Inventory Items</h2>

      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  item.reorder_threshold && item.qty <= item.reorder_threshold
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {item.qty} {item.unit}
                </p>
                {item.reorder_threshold && (
                  <p className="text-sm text-gray-500">
                    Threshold: {item.reorder_threshold}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No inventory items found.
        </div>
      )}
    </div>
  );
}